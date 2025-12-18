
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';  // 开发时走 Vite 代理，生产时走相对路径

export const REFRESH_INTERVAL = 60000; 

export const CHART_COLORS = {
  online: '#22c55e',
  offline: '#ef4444',
  slow: '#f59e0b',
  responseTime: '#3b82f6',
};

export const TIME_RANGES = [
  { label: '1小时', hours: 1 },
  { label: '6小时', hours: 6 },
  { label: '24小时', hours: 24 },
  { label: '7天', hours: 168 },
  { label: '30天', hours: 720 },
];
