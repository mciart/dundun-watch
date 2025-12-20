// src/core/state.js

import { getMonitorState, putMonitorState } from './storage.js';

/**
 * 内存缓存层
 * 所有状态优先从内存读取，只在 Cron 或强制保存时才写入 KV
 */
let memoryCache = null;
let isDirty = false;  // 标记是否有未保存的更改
let lastKVRead = 0;   // 上次从 KV 读取的时间

/**
 * 站点状态缓存 - 存储最新的检测结果
 * 与 Push 心跳缓存类似，确保 API 请求能读取到最新状态
 */
const siteStatusCache = new Map();

/**
 * 历史记录缓存 - 存储最新的历史记录（用于实时显示进度条）
 */
const historyCache = new Map();

/**
 * 更新站点状态缓存
 */
export function updateSiteStatusCache(siteId, statusData) {
  siteStatusCache.set(siteId, {
    ...statusData,
    cachedAt: Date.now()
  });
}

/**
 * 获取站点状态缓存
 */
export function getSiteStatusCache() {
  return siteStatusCache;
}

/**
 * 清除站点状态缓存
 */
export function clearSiteStatusCache() {
  siteStatusCache.clear();
}

/**
 * 添加历史记录到缓存
 */
export function addHistoryRecord(siteId, record) {
  if (!historyCache.has(siteId)) {
    historyCache.set(siteId, []);
  }
  const records = historyCache.get(siteId);
  records.push({
    ...record,
    cachedAt: Date.now()
  });
  // 限制缓存数量，避免内存溢出
  if (records.length > 100) {
    records.shift();
  }
}

/**
 * 获取历史记录缓存
 */
export function getHistoryCache() {
  return historyCache;
}

/**
 * 清除历史记录缓存
 */
export function clearHistoryCache() {
  historyCache.clear();
}

/**
 * 获取缓存是否有脏数据
 */
export function isCacheDirty() {
  return isDirty;
}

/**
 * 标记缓存为脏数据（需要保存）
 */
export function markCacheDirty() {
  isDirty = true;
}

/**
 * 清除脏标记（保存后调用）
 */
export function clearDirtyFlag() {
  isDirty = false;
}

/**
 * 获取内存缓存（供调试使用）
 */
export function getMemoryCache() {
  return memoryCache;
}

/**
 * 获取北京日期字符串 (YYYY-MM-DD)
 * @returns {string}
 */
export function getBeijingDate() {
  const now = new Date();
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijingTime.toISOString().split('T')[0];
}

/**
 * 初始化监控系统状态
 * @returns {Object}
 */
export function initializeState() {
  return {
    version: 1,
    lastUpdate: Date.now(),
    
    config: {
      historyHours: 24,              
      retentionHours: 720,           
      checkInterval: 10,             
      statusChangeDebounceMinutes: 3, 
      siteName: '炖炖守望',
      siteSubtitle: '慢慢炖，网站不"糊锅"',
      pageTitle: '网站监控',
      
      notifications: {
        enabled: false,
        events: ['down', 'recovered', 'cert_warning'],
        channels: {
          email: {
            enabled: false,
            to: '',
            from: '' 
          },
          wecom: {
            enabled: false,
            webhook: ''
          }
        }
      },
      groups: [
        {
          id: 'default',
          name: '默认分类',
          order: 0,
          createdAt: Date.now()
        }
      ]
    },
    
    sites: [],
    
    history: {},
    
    incidents: {},
    incidentIndex: [],
    certificateAlerts: {},
    
    stats: {
      writes: {
        total: 0,
        today: 0,
        yesterday: 0,
        forced: 0,
        statusChange: 0,
        lastResetDate: getBeijingDate()
      },
      checks: {
        total: 0,
        today: 0,
        yesterday: 0
      },
      sites: {
        total: 0,
        online: 0,
        offline: 0
      }
    }
  };
}

/**
 * 检查是否需要重置每日统计
 * @param {Object} state 
 * @returns {boolean}
 */
export function shouldResetStats(state) {
  const today = getBeijingDate();
  return state.stats.writes.lastResetDate !== today;
}

/**
 * 重置每日统计信息
 * @param {Object} state 
 */
export function resetDailyStats(state) {
  const yesterday = state.stats.writes.lastResetDate;
  const yesterdayWrites = state.stats.writes.today;
  const yesterdayChecks = state.stats.checks.today;
  
  console.log(`📊 日期变更，重置统计: ${yesterday} 写入 ${yesterdayWrites} 次，检测 ${yesterdayChecks} 次`);
  
  state.stats.writes.yesterday = yesterdayWrites;
  state.stats.checks.yesterday = yesterdayChecks;
  
  state.stats.writes.today = 0;
  state.stats.writes.forced = 0;
  state.stats.writes.statusChange = 0;
  state.stats.checks.today = 0;
  state.stats.writes.lastResetDate = getBeijingDate();
}

/**
 * 从 KV 获取状态，优先使用内存缓存
 * @param {Object} env 
 * @param {boolean} forceRefresh - 是否强制从 KV 刷新
 * @returns {Promise<Object>}
 */
export async function getState(env, forceRefresh = false) {
  try {
    // 如果内存缓存存在且不强制刷新，直接返回缓存
    if (memoryCache && !forceRefresh) {
      return memoryCache;
    }
    
    let data = await getMonitorState(env);
    lastKVRead = Date.now();
    
    if (!data) {
      memoryCache = initializeState();
      return memoryCache;
    }

    const defaults = initializeState();

    if (!data.config) data.config = defaults.config;
    if (!data.sites) data.sites = [];
    if (!data.history) data.history = {};
    if (!data.incidents) data.incidents = {};
    if (!Array.isArray(data.incidentIndex)) data.incidentIndex = [];
    if (!data.certificateAlerts) data.certificateAlerts = {};

    if (!data.stats) {
      data.stats = defaults.stats;
    } else {
      if (!data.stats.checks) data.stats.checks = defaults.stats.checks;
      if (!data.stats.writes) data.stats.writes = defaults.stats.writes;
      if (!data.stats.sites) data.stats.sites = defaults.stats.sites;
    }

    // 更新内存缓存
    memoryCache = data;
    return memoryCache;
  } catch (error) {
    console.error('获取状态失败:', error);
    if (!memoryCache) {
      memoryCache = initializeState();
    }
    return memoryCache;
  }
}

/**
 * 更新内存缓存中的状态（不立即写入 KV）
 * @param {Object} env 
 * @param {Object} state 
 */
export async function updateState(env, state) {
  state.lastUpdate = Date.now();
  memoryCache = state;
  isDirty = true;
  // 不再立即写入 KV，等待 flushState 调用
}

/**
 * 强制将内存缓存写入 KV（在 Cron 或关键操作时调用）
 * @param {Object} env 
 * @param {boolean} force - 是否强制写入（即使没有脏数据）
 * @returns {Promise<boolean>} - 是否执行了写入
 */
export async function flushState(env, force = false) {
  if (!memoryCache) {
    return false;
  }
  
  if (!isDirty && !force) {
    console.log('📦 缓存无变更，跳过 KV 写入');
    return false;
  }
  
  try {
    memoryCache.lastUpdate = Date.now();
    await putMonitorState(env, memoryCache);
    isDirty = false;
    console.log('💾 状态已写入 KV');
    return true;
  } catch (error) {
    console.error('写入 KV 失败:', error);
    return false;
  }
}

/**
 * 立即保存状态到 KV（用于关键操作如添加/删除站点）
 * @param {Object} env 
 * @param {Object} state 
 */
export async function saveStateNow(env, state) {
  state.lastUpdate = Date.now();
  memoryCache = state;
  await putMonitorState(env, state);
  isDirty = false;
  console.log('💾 状态已立即写入 KV（关键操作）');
}
