// Vercel KV 存储抽象层
// 统一管理所有 KV 操作

import { kv } from '@vercel/kv';

// ==================== 通用接口 ====================

export async function getRaw(env, key, options = {}) {
  return await kv.get(key);
}

export async function putRaw(env, key, value) {
  await kv.set(key, value);
}

export async function deleteRaw(env, key) {
  await kv.del(key);
}

// ==================== 监控状态 ====================

export async function getMonitorState(env) {
  const state = await kv.get('monitor_state');
  return state || null;
}

export async function putMonitorState(env, state) {
  await kv.set('monitor_state', state);
}

// ==================== 站点历史 ====================

export async function getSiteHistory(env, siteId) {
  const raw = await kv.get(`history:${siteId}`);
  return Array.isArray(raw) ? raw : [];
}

export async function putSiteHistory(env, siteId, history) {
  await kv.set(`history:${siteId}`, history);
}

// ==================== 管理员设置 ====================

export async function getAdminPath(env) {
  return await kv.get('admin_path');
}

export async function putAdminPath(env, path) {
  await kv.set('admin_path', path);
}

export async function getAdminPassword(env) {
  return await kv.get('admin_password');
}

export async function putAdminPassword(env, hash) {
  await kv.set('admin_password', hash);
}

// ==================== 辅助函数 ====================

export function historyKey(siteId) {
  return `history:${siteId}`;
}

export function configKey() {
  return `config`;
}

export async function clearAllData(env) {
  // 使用 SCAN 迭代所有键并删除
  const keys = [];
  for await (const key of kv.scanIterator({ match: '*' })) {
    keys.push(key);
  }
  if (keys.length > 0) {
    await kv.del(...keys);
  }
}

// ==================== 列表所有键（用于调试） ====================

export async function listAllKeys(env) {
  const keys = [];
  for await (const key of kv.scanIterator({ match: '*' })) {
    keys.push(key);
  }
  return keys;
}
