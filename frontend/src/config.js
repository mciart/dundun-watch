// 前端配置文件
// 集中管理所有前端配置项

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';  // 开发时走 Vite 代理，生产时走相对路径

// ==================== 品牌默认值 ====================
export const BRAND = {
  siteName: '炖炖哨兵',
  siteSubtitle: '慢慢炖，网站不 "糊锅"',
  pageTitle: '网站监控',
};

// ==================== 刷新间隔 ====================
export const REFRESH_INTERVAL = 60000; // 60秒

// ==================== 状态颜色 ====================
export const CHART_COLORS = {
  online: '#22c55e',   // 绿色
  offline: '#ef4444',  // 红色
  slow: '#f59e0b',     // 橙色
  responseTime: '#3b82f6', // 蓝色
};

// ==================== 主机监控指标颜色 ====================
export const METRIC_COLORS = {
  cpu: '#3b82f6',       // 蓝色
  memory: '#8b5cf6',    // 紫色
  disk: '#f59e0b',      // 橙色
  temperature: '#ef4444', // 红色
  network: '#06b6d4',   // 青色
  load: '#22c55e',      // 绿色
};

// ==================== 时间范围选项 ====================
export const TIME_RANGES = [
  { label: '1小时', hours: 1 },
  { label: '6小时', hours: 6 },
  { label: '24小时', hours: 24 },
  { label: '7天', hours: 168 },
  { label: '30天', hours: 720 },
];

// ==================== 默认值 ====================
export const DEFAULTS = {
  // 默认分组名称
  groupName: '默认分类',
  // 默认分组图标 (Lucide icon name)
  groupIcon: 'Folder',
};
