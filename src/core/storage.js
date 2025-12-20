// src/core/storage.js
// 适配 Redis Cloud (Redis Labs)
// 使用 ioredis 客户端

import Redis from 'ioredis';

// 使用单例模式缓存 Redis 连接，防止在 Serverless 环境中创建过多连接
let redis = null;

function getRedis(env) {
  if (redis) {
    return redis;
  }

  // 优先从传入的 env 获取，如果没有则尝试从全局 process.env 获取
  const connectionString = env.REDIS_URL || process.env.REDIS_URL;

  if (!connectionString) {
    throw new Error('严重错误: 未配置 REDIS_URL 环境变量');
  }

  console.log('正在初始化 Redis 连接...');

  // 初始化 ioredis
  redis = new Redis(connectionString, {
    // 关键配置：Serverless 环境优化
    lazyConnect: true,        // 只有在真正发起请求时才建立连接
    connectTimeout: 5000,     // 连接超时时间
    commandTimeout: 3000,     // 指令超时时间
    maxRetriesPerRequest: 3,  // 失败重试次数
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    // 如果是 rediss:// (SSL) 协议，ioredis 会自动处理，无需额外配置
  });

  redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  return redis;
}

// ==================== 通用接口 (适配原有 API) ====================

export async function getRaw(env, key, options = {}) {
  const client = getRedis(env);
  try {
    const value = await client.get(key);
    // 尝试解析 JSON，如果失败则返回原始字符串或 null
    try {
      return value ? JSON.parse(value) : null;
    } catch (e) {
      return value;
    }
  } catch (error) {
    console.error(`Redis Get Error [${key}]:`, error);
    return null;
  }
}

export async function putRaw(env, key, value) {
  const client = getRedis(env);
  try {
    // 自动将对象序列化为 JSON 字符串
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await client.set(key, stringValue);
  } catch (error) {
    console.error(`Redis Put Error [${key}]:`, error);
    throw error;
  }
}

export async function deleteRaw(env, key) {
  const client = getRedis(env);
  try {
    await client.del(key);
  } catch (error) {
    console.error(`Redis Delete Error [${key}]:`, error);
  }
}

// ==================== 业务逻辑 (保持原有签名) ====================

// 监控状态
export async function getMonitorState(env) {
  return await getRaw(env, 'monitor_state');
}

export async function putMonitorState(env, state) {
  await putRaw(env, 'monitor_state', state);
}

// 站点历史
export async function getSiteHistory(env, siteId) {
  const raw = await getRaw(env, `history:${siteId}`);
  return Array.isArray(raw) ? raw : [];
}

export async function putSiteHistory(env, siteId, history) {
  await putRaw(env, `history:${siteId}`, history);
}

// 管理员设置
export async function getAdminPath(env) {
  return await getRaw(env, 'admin_path');
}

export async function putAdminPath(env, path) {
  await putRaw(env, 'admin_path', path);
}

export async function getAdminPassword(env) {
  return await getRaw(env, 'admin_password');
}

export async function putAdminPassword(env, hash) {
  await putRaw(env, 'admin_password', hash);
}

// 辅助函数
export function historyKey(siteId) {
  return `history:${siteId}`;
}

export function configKey() {
  return `config`;
}

// 清除所有数据 (危险操作)
export async function clearAllData(env) {
  const client = getRedis(env);
  try {
    // Redis 的 flushdb 比循环删除更高效、更干净
    await client.flushdb();
    console.log('Redis 数据已清空');
  } catch (error) {
    console.error('清空数据失败:', error);
    throw error;
  }
}

// 列出所有键 (用于调试)
export async function listAllKeys(env) {
  const client = getRedis(env);
  try {
    return await client.keys('*');
  } catch (error) {
    return [];
  }
}
