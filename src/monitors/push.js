// Push/心跳监控模块
// 该模块用于处理主机主动推送的心跳数据

/**
 * 检查 Push 类型站点的状态
 * Push 类型不需要主动检测，只需检查最后心跳时间
 * @param {Object} site - 站点对象
 * @param {number} now - 当前时间戳
 * @param {number} timeoutMinutes - 超时时间（分钟），默认3分钟
 * @returns {Object} 检测结果
 */
export function checkPushSite(site, now, timeoutMinutes = 3) {
  const timeoutMs = timeoutMinutes * 60 * 1000;
  const lastHeartbeat = site.lastHeartbeat || 0;
  const timeSinceLastHeartbeat = now - lastHeartbeat;
  
  // 如果从未收到过心跳
  if (lastHeartbeat === 0) {
    return {
      status: 'unknown',
      responseTime: 0,
      message: '等待首次心跳',
      pushData: site.pushData || null
    };
  }
  
  // 检查是否超时
  if (timeSinceLastHeartbeat > timeoutMs) {
    return {
      status: 'offline',
      responseTime: 0,
      message: `心跳超时 (${Math.floor(timeSinceLastHeartbeat / 60000)} 分钟未响应)`,
      pushData: site.pushData || null
    };
  }
  
  // 在线状态
  return {
    status: 'online',
    responseTime: site.pushData?.latency || 0,
    message: '正常',
    pushData: site.pushData || null
  };
}

/**
 * 验证 Push Token
 * @param {string} token - 推送令牌
 * @returns {boolean}
 */
export function isValidPushToken(token) {
  if (!token || typeof token !== 'string') return false;
  // Token 格式：至少16个字符，只允许字母数字和下划线
  return /^[a-zA-Z0-9_-]{16,64}$/.test(token);
}

/**
 * 生成 Push Token
 * @returns {string}
 */
export function generatePushToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
