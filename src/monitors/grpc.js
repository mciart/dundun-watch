// gRPC 服务监控模块
// 使用 HTTP/2 fetch 验证 gRPC 服务可用性
// 支持 gRPC Health Check 协议 和 简单 HTTP/2 连接检测

import { TIMEOUTS, RESPONSE_TIME } from '../config/index.js';

/**
 * 检测 gRPC 站点
 * @param {Object} site - 站点配置
 * @param {number} checkTime - 检测时间戳
 */
export async function checkGrpcSite(site, checkTime) {
    const startTime = Date.now();

    // Mock 模式
    if (site?.mock?.forceStatus) {
        return {
            timestamp: checkTime,
            status: site.mock.forceStatus,
            statusCode: site.mock.statusCode || 0,
            responseTime: site.mock.responseTime || 0,
            message: site.mock.message || '模拟'
        };
    }

    const host = site.grpcHost || '';
    const port = parseInt(site.grpcPort, 10) || 443;
    const useTls = site.grpcTls !== false; // 默认使用 TLS

    if (!host) {
        return {
            timestamp: checkTime,
            status: 'offline',
            statusCode: 0,
            responseTime: 0,
            message: '未配置 gRPC 主机'
        };
    }

    const timeoutMs = TIMEOUTS.grpcTimeout || 15000;
    const protocol = useTls ? 'https' : 'http';
    const url = `${protocol}://${host}:${port}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        // 尝试发送 gRPC Health Check 请求
        // gRPC 使用 POST 请求，Content-Type 为 application/grpc
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/grpc',
                'TE': 'trailers',
                'grpc-accept-encoding': 'identity',
            },
            signal: controller.signal,
            // 发送空的 gRPC 请求体（用于检测服务是否在线）
            body: new Uint8Array([0, 0, 0, 0, 0]), // 5字节的 gRPC 帧头
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        // gRPC 响应状态码判断
        // 即使返回 gRPC 错误，也说明服务在运行
        const grpcStatus = response.headers.get('grpc-status');
        const contentType = response.headers.get('content-type') || '';

        // 判断是否为有效的 gRPC 响应
        const isGrpcResponse = contentType.includes('grpc') ||
            grpcStatus !== null ||
            response.status === 200 ||
            response.status === 415; // Unsupported Media Type 也说明服务在运行

        if (!isGrpcResponse && response.status >= 400 && response.status !== 415) {
            // 如果不是 gRPC 响应且是错误状态
            return {
                timestamp: checkTime,
                status: 'offline',
                statusCode: response.status,
                responseTime,
                message: `gRPC 服务响应异常 (HTTP ${response.status})`
            };
        }

        // 确定状态
        let finalStatus = 'online';
        const thresholds = RESPONSE_TIME.grpc || { slow: 1000, verySlow: 3000 };

        if (responseTime > thresholds.verySlow) {
            finalStatus = 'slow';
        } else if (responseTime > thresholds.slow) {
            finalStatus = 'slow';
        }

        // 构建消息
        let message = 'gRPC 服务正常';
        if (grpcStatus !== null && grpcStatus !== '0') {
            // grpc-status 0 = OK, 其他值表示错误但服务在运行
            message = `gRPC 服务正常 (status: ${grpcStatus})`;
        }

        return {
            timestamp: checkTime,
            status: finalStatus,
            statusCode: response.status,
            responseTime,
            message
        };

    } catch (error) {
        const responseTime = Date.now() - startTime;
        const errMsg = error?.message || String(error);
        const msgLower = errMsg.toLowerCase();

        // 超时
        if (msgLower.includes('abort') || msgLower.includes('timeout')) {
            return {
                timestamp: checkTime,
                status: 'offline',
                statusCode: 0,
                responseTime,
                message: `gRPC 连接超时 (${host}:${port})`
            };
        }

        // 连接被拒绝
        if (msgLower.includes('refused') || msgLower.includes('econnrefused') || msgLower.includes('reset')) {
            return {
                timestamp: checkTime,
                status: 'offline',
                statusCode: 0,
                responseTime,
                message: `gRPC 连接被拒绝 (${host}:${port})`
            };
        }

        // SSL/TLS 错误
        if (msgLower.includes('ssl') || msgLower.includes('tls') || msgLower.includes('certificate')) {
            return {
                timestamp: checkTime,
                status: 'offline',
                statusCode: 0,
                responseTime,
                message: `gRPC TLS 错误 (${host}:${port})`
            };
        }

        // DNS 解析失败
        if (msgLower.includes('getaddrinfo') || msgLower.includes('enotfound') || msgLower.includes('dns')) {
            return {
                timestamp: checkTime,
                status: 'offline',
                statusCode: 0,
                responseTime,
                message: `主机 ${host} DNS解析失败`
            };
        }

        // 其他错误
        return {
            timestamp: checkTime,
            status: 'offline',
            statusCode: 0,
            responseTime,
            message: `gRPC 检测失败: ${errMsg.substring(0, 50)}`
        };
    }
}
