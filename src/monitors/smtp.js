import { connect } from 'cloudflare:sockets';
import { TIMEOUTS, MONITOR } from '../config/index.js';

/**
 * SMTP 监控器
 * 支持三种安全模式：
 * - smtps: 使用 TLS 加密连接 (通常端口 465)
 * - starttls: 明文连接后升级到 TLS
 * - none: 纯明文连接 (忽略 STARTTLS)
 */
export async function checkSmtpSite(site, checkTime) {
  const startTime = Date.now();

  // Mock mode for SMTP checks
  if (site && site.mock && typeof site.mock === 'object' && site.mock.forceStatus) {
    return {
      timestamp: checkTime,
      status: site.mock.forceStatus,
      statusCode: site.mock.statusCode || 0,
      responseTime: site.mock.responseTime || 0,
      message: site.mock.message || '模拟'
    };
  }

  const host = site.smtpHost || '';
  const port = parseInt(site.smtpPort, 10) || MONITOR.defaultSmtpPort;
  const security = site.smtpSecurity || 'starttls';

  if (!host) {
    return {
      timestamp: checkTime,
      status: 'offline',
      statusCode: 0,
      responseTime: 0,
      message: '未配置SMTP主机名'
    };
  }

  const timeoutMs = TIMEOUTS.smtpTimeout;
  let socket = null;
  let timeoutId;

  try {
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error('SMTP_TIMEOUT')), timeoutMs);
    });

    const smtpCheckPromise = (async () => {
      // 根据安全模式决定是否使用 TLS
      const useTls = security === 'smtps';
      
      // 连接配置
      const connectOptions = {
        hostname: host,
        port: port
      };

      // SMTPS 模式：直接 TLS 连接
      if (useTls) {
        connectOptions.secureTransport = 'on';
      }

      socket = connect(connectOptions);
      await socket.opened;

      const reader = socket.readable.getReader();
      const writer = socket.writable.getWriter();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      // 读取 SMTP 响应的辅助函数
      const readResponse = async () => {
        let fullResponse = '';
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value, { stream: true });
          // SMTP 响应以 "xxx " 开头的行表示最后一行（非 "xxx-"）
          const lines = fullResponse.split('\r\n');
          for (const line of lines) {
            if (line.length >= 4 && /^\d{3} /.test(line)) {
              return fullResponse;
            }
          }
        }
        return fullResponse;
      };

      // 发送 SMTP 命令
      const sendCommand = async (cmd) => {
        await writer.write(encoder.encode(cmd + '\r\n'));
        return await readResponse();
      };

      // 1. 读取服务器欢迎信息
      const greeting = await readResponse();
      if (!greeting.startsWith('220')) {
        throw new Error(`SMTP欢迎响应异常: ${greeting.substring(0, 100)}`);
      }

      // 2. 发送 EHLO 命令
      const ehloResponse = await sendCommand(`EHLO sentinel-monitor`);
      if (!ehloResponse.startsWith('250')) {
        throw new Error(`EHLO响应异常: ${ehloResponse.substring(0, 100)}`);
      }

      // 3. 如果是 STARTTLS 模式，升级连接
      if (security === 'starttls') {
        // 检查服务器是否支持 STARTTLS
        if (!ehloResponse.toUpperCase().includes('STARTTLS')) {
          throw new Error('服务器不支持STARTTLS');
        }

        // 发送 STARTTLS 命令
        const starttlsResponse = await sendCommand('STARTTLS');
        if (!starttlsResponse.startsWith('220')) {
          throw new Error(`STARTTLS响应异常: ${starttlsResponse.substring(0, 100)}`);
        }

        // 升级到 TLS
        // 注意：Cloudflare Workers 的 socket 需要使用 startTls() 方法
        // 但目前 Cloudflare Workers 不直接支持 STARTTLS 升级
        // 我们需要关闭当前连接，建立新的 TLS 连接来验证证书
        reader.releaseLock();
        writer.releaseLock();
        await socket.close();

        // 重新建立 TLS 连接以验证证书有效性
        const tlsSocket = connect({
          hostname: host,
          port: port,
          secureTransport: 'starttls'
        });
        await tlsSocket.opened;
        
        const tlsReader = tlsSocket.readable.getReader();
        const tlsWriter = tlsSocket.writable.getWriter();
        
        // 读取欢迎消息
        let tlsGreeting = '';
        const { value: greetValue } = await tlsReader.read();
        if (greetValue) {
          tlsGreeting = decoder.decode(greetValue);
        }
        
        // 发送 EHLO
        await tlsWriter.write(encoder.encode('EHLO sentinel-monitor\r\n'));
        const { value: ehloValue } = await tlsReader.read();
        const tlsEhlo = ehloValue ? decoder.decode(ehloValue) : '';
        
        if (!tlsEhlo.startsWith('250')) {
          throw new Error(`TLS升级后EHLO失败: ${tlsEhlo.substring(0, 100)}`);
        }

        // 发送 QUIT
        await tlsWriter.write(encoder.encode('QUIT\r\n'));
        tlsReader.releaseLock();
        tlsWriter.releaseLock();
        await tlsSocket.close();
        socket = null; // 标记已关闭
        
        return { success: true, mode: 'STARTTLS', greeting };
      }

      // 4. 发送 QUIT 命令
      await sendCommand('QUIT');
      
      reader.releaseLock();
      writer.releaseLock();
      await socket.close();
      socket = null;

      return { success: true, mode: useTls ? 'SMTPS' : '明文', greeting };
    })();

    const result = await Promise.race([smtpCheckPromise, timeoutPromise]);
    clearTimeout(timeoutId);

    const responseTime = Date.now() - startTime;

    // 提取服务器标识（从欢迎信息中）
    const serverBanner = result.greeting ? result.greeting.substring(4, 60).trim() : '';

    let finalStatus = 'online';
    let finalMessage = `SMTP服务正常 (${result.mode})`;

    if (responseTime > 20000) {
      finalStatus = 'slow';
      finalMessage = `SMTP服务响应缓慢 (${result.mode})`;
    } else if (responseTime > 10000) {
      finalStatus = 'slow';
      finalMessage = `SMTP服务响应较慢 (${result.mode})`;
    }

    return {
      timestamp: checkTime,
      status: finalStatus,
      statusCode: 220, // SMTP 正常响应码
      responseTime,
      message: finalMessage
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;
    clearTimeout(timeoutId);

    // 尝试关闭 socket
    if (socket) {
      try {
        await socket.close();
      } catch (e) {
        // 忽略关闭错误
      }
    }

    const errMsg = (error && (error.message || String(error))) || '';
    const msgLower = errMsg.toLowerCase();

    // 检查是否是超时
    if (errMsg === 'SMTP_TIMEOUT' || msgLower.includes('timeout') || msgLower.includes('etimedout')) {
      return {
        timestamp: checkTime,
        status: 'offline',
        statusCode: 0,
        responseTime,
        message: `SMTP连接超时 (${host}:${port})`
      };
    }

    // 检查是否是连接被拒绝
    if (msgLower.includes('refused') || msgLower.includes('econnrefused') || msgLower.includes('reset')) {
      return {
        timestamp: checkTime,
        status: 'offline',
        statusCode: 0,
        responseTime,
        message: `SMTP端口 ${port} 连接被拒绝`
      };
    }

    // 检查是否是 DNS 解析失败
    if (msgLower.includes('getaddrinfo') || msgLower.includes('enotfound') || msgLower.includes('dns')) {
      return {
        timestamp: checkTime,
        status: 'offline',
        statusCode: 0,
        responseTime,
        message: `SMTP主机 ${host} DNS解析失败`
      };
    }

    // 检查是否是 TLS/证书错误
    if (msgLower.includes('tls') || msgLower.includes('ssl') || msgLower.includes('certificate') || msgLower.includes('cert')) {
      return {
        timestamp: checkTime,
        status: 'offline',
        statusCode: 0,
        responseTime,
        message: `SMTP TLS/证书错误: ${errMsg.substring(0, 80)}`
      };
    }

    // 其他错误
    return {
      timestamp: checkTime,
      status: 'offline',
      statusCode: 0,
      responseTime,
      message: `SMTP检测失败: ${errMsg.substring(0, 80)}`
    };
  }
}
