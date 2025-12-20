// TCP 监控模块
// 使用 Node.js net 模块进行 TCP 端口检测

import net from 'net';

// Node.js TCP 连接
function connectTcp(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const socket = new net.Socket();
    
    const timeoutId = setTimeout(() => {
      socket.destroy();
      reject(new Error('TCP_TIMEOUT'));
    }, timeoutMs);
    
    socket.connect(port, host, () => {
      clearTimeout(timeoutId);
      socket.destroy();
      resolve(true);
    });
    
    socket.on('error', (err) => {
      clearTimeout(timeoutId);
      socket.destroy();
      reject(err);
    });
  });
}

export async function checkTcpSite(site, checkTime) {
  const startTime = Date.now();

  // Mock mode for TCP checks
  if (site && site.mock && typeof site.mock === 'object' && site.mock.forceStatus) {
    return {
      timestamp: checkTime,
      status: site.mock.forceStatus,
      statusCode: site.mock.statusCode || 0,
      responseTime: site.mock.responseTime || 0,
      message: site.mock.message || '模拟'
    };
  }

  const host = site.tcpHost || '';
  const port = parseInt(site.tcpPort, 10) || 80;
  
  if (!host) {
    return {
      timestamp: checkTime,
      status: 'offline',
      statusCode: 0,
      responseTime: 0,
      message: '未配置主机名'
    };
  }

  try {
    const timeoutMs = 15000; // 15秒超时
    
    await connectTcp(host, port, timeoutMs);
    
    const responseTime = Date.now() - startTime;
    
    // 连接成功，端口开放
    let finalStatus = 'online';
    let finalMessage = `端口 ${port} 开放`;
    
    if (responseTime > 10000) {
      finalStatus = 'slow';
      finalMessage = `端口 ${port} 开放 (响应缓慢)`;
    } else if (responseTime > 5000) {
      finalStatus = 'slow';
      finalMessage = `端口 ${port} 开放 (响应较慢)`;
    }
    
    return {
      timestamp: checkTime,
      status: finalStatus,
      statusCode: 0,
      responseTime,
      message: finalMessage
    };
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errMsg = (error && (error.message || String(error))) || '';
    const msgLower = errMsg.toLowerCase();
    
    // 检查是否是超时
    if (errMsg === 'TCP_TIMEOUT' || msgLower.includes('timeout') || msgLower.includes('etimedout')) {
      return {
        timestamp: checkTime,
        status: 'offline',
        statusCode: 0,
        responseTime,
        message: `端口 ${port} 超时 (可能被防火墙过滤)`
      };
    }
    
    // 检查是否是连接被拒绝（端口关闭）
    const isConnectionRefused = msgLower.includes('refused') || 
                                 msgLower.includes('econnrefused') ||
                                 msgLower.includes('connection refused') ||
                                 msgLower.includes('reset');
    
    if (isConnectionRefused) {
      return {
        timestamp: checkTime,
        status: 'offline',
        statusCode: 0,
        responseTime,
        message: `端口 ${port} 关闭 (连接被拒绝)`
      };
    }
    
    // 检查是否是 DNS 解析失败
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
      message: `端口 ${port} 检测失败: ${errMsg.substring(0, 50)}`
    };
  }
}
