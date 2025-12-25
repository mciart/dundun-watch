// Redis 数据库监控模块
// 使用 TCP Socket 验证 Redis 服务可用性

import { connect } from 'cloudflare:sockets';
import { TIMEOUTS, RESPONSE_TIME } from '../config/index.js';

/**
 * 检测 Redis 站点
 * @param {Object} site - 站点配置
 * @param {number} checkTime - 检测时间戳
 */
export async function checkRedisSite(site, checkTime) {
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

    const host = site.dbHost || '';
    const port = parseInt(site.dbPort, 10) || 6379;

    if (!host) {
        return {
            timestamp: checkTime,
            status: 'offline',
            statusCode: 0,
            responseTime: 0,
            message: '未配置数据库主机'
        };
    }

    const timeoutMs = TIMEOUTS.redisTimeout || 10000;
    let socket = null;
    let timeoutId;

    try {
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('DB_TIMEOUT')), timeoutMs);
        });

        const dbCheckPromise = (async () => {
            socket = connect({ hostname: host, port });
            await socket.opened;

            const reader = socket.readable.getReader();
            const writer = socket.writable.getWriter();

            // 发送 Redis PING 命令 (RESP 协议)
            // 使用简单内联命令格式，更兼容
            const pingCmd = new TextEncoder().encode('PING\r\n');
            await writer.write(pingCmd);

            // 读取响应
            const result = await readWithTimeout(reader, 5000);
            if (!result || result.length < 1) {
                throw new Error('无效的 Redis 响应');
            }

            // 验证响应是否为有效的 Redis RESP 协议
            // Redis 可能返回:
            // +PONG\r\n - 成功
            // -NOAUTH Authentication required\r\n - 需要认证（但说明 Redis 在运行）
            // -ERR ... - 其他错误（但说明 Redis 在运行）
            const response = new TextDecoder().decode(result);
            const firstChar = response.charAt(0);

            // RESP 协议的第一个字符标识响应类型
            // + 简单字符串, - 错误, : 整数, $ 批量字符串, * 数组
            const isValidResp = ['+', '-', ':', '$', '*'].includes(firstChar);

            if (!isValidResp) {
                throw new Error('非 Redis 协议');
            }

            // 如果返回 PONG 或者返回认证错误，都说明 Redis 服务正常
            const isRunning = response.includes('PONG') ||
                response.includes('NOAUTH') ||
                response.includes('ERR') ||
                firstChar === '+' ||
                firstChar === '-';

            if (!isRunning) {
                throw new Error('非 Redis 协议');
            }

            reader.releaseLock();
            writer.releaseLock();
            await socket.close();

            // 如果需要认证，仍然标记为在线但附加说明
            const needsAuth = response.includes('NOAUTH');
            return { success: true, needsAuth };
        })();

        const result = await Promise.race([dbCheckPromise, timeoutPromise]);
        clearTimeout(timeoutId);

        const responseTime = Date.now() - startTime;

        // 确定状态
        let finalStatus = 'online';
        const thresholds = RESPONSE_TIME.redis || { slow: 500, verySlow: 1500 };

        if (responseTime > thresholds.verySlow) {
            finalStatus = 'slow';
        } else if (responseTime > thresholds.slow) {
            finalStatus = 'slow';
        }

        return {
            timestamp: checkTime,
            status: finalStatus,
            statusCode: 0,
            responseTime,
            message: result.needsAuth ? 'Redis 服务正常 (需要认证)' : 'Redis 服务正常'
        };

    } catch (error) {
        clearTimeout(timeoutId);

        if (socket) {
            try { await socket.close(); } catch (e) { /* ignore */ }
        }

        const responseTime = Date.now() - startTime;
        const errMsg = error?.message || String(error);
        const msgLower = errMsg.toLowerCase();

        // 超时
        if (errMsg === 'DB_TIMEOUT' || msgLower.includes('timeout')) {
            return {
                timestamp: checkTime,
                status: 'offline',
                statusCode: 0,
                responseTime,
                message: `Redis 连接超时 (${host}:${port})`
            };
        }

        // 连接被拒绝
        if (msgLower.includes('refused') || msgLower.includes('econnrefused') || msgLower.includes('reset')) {
            return {
                timestamp: checkTime,
                status: 'offline',
                statusCode: 0,
                responseTime,
                message: `Redis 连接被拒绝 (${host}:${port})`
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
            message: `Redis 检测失败: ${errMsg.substring(0, 50)}`
        };
    }
}

/**
 * 带超时的读取
 */
async function readWithTimeout(reader, timeoutMs) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error('读取超时'));
        }, timeoutMs);

        reader.read().then(({ value, done }) => {
            clearTimeout(timer);
            if (done) {
                resolve(null);
            } else {
                resolve(value);
            }
        }).catch(err => {
            clearTimeout(timer);
            reject(err);
        });
    });
}
