import { useState, useMemo } from 'react';
import { 
  Server, 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Activity,
  Clock,
  Wifi,
  WifiOff,
  Thermometer,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

/**
 * 主机监控面板组件
 * 用于显示 Push 心跳监控的主机状态和详细指标
 */
export default function HostMonitorPanel({ sites = [] }) {
  const [expanded, setExpanded] = useState(true);
  
  // 过滤出 Push 类型且设置为在主机面板显示的站点
  const pushSites = useMemo(() => {
    const filtered = sites.filter(site => 
      site.monitorType === 'push' && site.showInHostPanel !== false
    );
    // 调试日志
    if (sites.length > 0) {
      console.log('HostMonitorPanel - 所有站点:', sites.map(s => ({ name: s.name, type: s.monitorType, showInHostPanel: s.showInHostPanel })));
      console.log('HostMonitorPanel - 主机面板站点:', filtered);
    }
    return filtered;
  }, [sites]);

  // 统计数据 - 必须在条件返回之前调用所有 hooks
  const stats = useMemo(() => {
    const online = pushSites.filter(s => s.status === 'online').length;
    const offline = pushSites.filter(s => s.status === 'offline').length;
    const unknown = pushSites.filter(s => s.status === 'unknown').length;
    return { total: pushSites.length, online, offline, unknown };
  }, [pushSites]);

  // 没有 Push 站点时不渲染
  if (pushSites.length === 0) {
    return null;
  }

  return (
    <div className="mb-8">
      {/* 标题栏 */}
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              主机监控
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {stats.online}/{stats.total} 在线 · Push 心跳模式
            </p>
          </div>
        </div>
        <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* 主机卡片网格 */}
      {expanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pushSites.map((site) => (
            <HostCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 单个主机卡片
 */
function HostCard({ site }) {
  const pushData = site.pushData || {};
  const isOnline = site.status === 'online';
  const isOffline = site.status === 'offline';
  const lastHeartbeat = site.lastHeartbeat || site.lastCheck || 0;

  // 格式化运行时间
  const formatUptime = (seconds) => {
    if (!seconds || seconds <= 0) return '-';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}天 ${hours}时`;
    if (hours > 0) return `${hours}时 ${mins}分`;
    return `${mins}分钟`;
  };

  // 格式化最后心跳时间
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return '从未';
    const diff = Date.now() - timestamp;
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  };

  // 获取使用率颜色
  const getUsageColor = (value) => {
    if (value === null || value === undefined) return 'text-slate-400';
    if (value >= 90) return 'text-red-500';
    if (value >= 70) return 'text-amber-500';
    return 'text-emerald-500';
  };

  // 获取进度条颜色
  const getProgressColor = (value) => {
    if (value === null || value === undefined) return 'bg-slate-200 dark:bg-slate-700';
    if (value >= 90) return 'bg-red-500';
    if (value >= 70) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div
      className={`
        glass-card p-4 relative overflow-hidden
        ${isOffline ? 'border-red-200 dark:border-red-800' : ''}
      `}
    >
      {/* 状态指示条 */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${
        isOnline ? 'bg-emerald-500' : isOffline ? 'bg-red-500' : 'bg-slate-400'
      }`} />

      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-lg ${
            isOnline ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
            isOffline ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' :
            'bg-slate-100 dark:bg-slate-800 text-slate-500'
          }`}>
            {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </div>
          <div>
            <h3 className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[150px]" title={site.name}>
              {site.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {formatLastSeen(lastHeartbeat)}
            </p>
          </div>
        </div>
        <div className={`
          px-2 py-0.5 rounded-full text-xs font-medium
          ${isOnline ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' :
            isOffline ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
            'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}
        `}>
          {isOnline ? '在线' : isOffline ? '离线' : '等待'}
        </div>
      </div>

      {/* 指标网格 */}
      <div className="grid grid-cols-2 gap-3">
        {/* CPU */}
        <MetricItem
          icon={<Cpu className="w-4 h-4" />}
          label="CPU"
          value={pushData.cpu}
          unit="%"
          getColor={getUsageColor}
          getProgressColor={getProgressColor}
        />

        {/* 内存 */}
        <MetricItem
          icon={<MemoryStick className="w-4 h-4" />}
          label="内存"
          value={pushData.memory}
          unit="%"
          getColor={getUsageColor}
          getProgressColor={getProgressColor}
        />

        {/* 磁盘 */}
        <MetricItem
          icon={<HardDrive className="w-4 h-4" />}
          label="磁盘"
          value={pushData.disk}
          unit="%"
          getColor={getUsageColor}
          getProgressColor={getProgressColor}
        />

        {/* 负载/运行时间 */}
        {pushData.load !== null && pushData.load !== undefined ? (
          <MetricItem
            icon={<Activity className="w-4 h-4" />}
            label="负载"
            value={pushData.load}
            unit=""
            showProgress={false}
          />
        ) : (
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
              <Clock className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-slate-500 dark:text-slate-400">运行</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                {formatUptime(pushData.uptime)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 温度（如果有） */}
      {pushData.temperature !== null && pushData.temperature !== undefined && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <Thermometer className={`w-4 h-4 ${
            pushData.temperature >= 80 ? 'text-red-500' :
            pushData.temperature >= 60 ? 'text-amber-500' :
            'text-blue-500'
          }`} />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            温度: <span className="font-medium">{pushData.temperature}°C</span>
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * 指标项组件
 */
function MetricItem({ icon, label, value, unit, getColor, getProgressColor, showProgress = true }) {
  const displayValue = value !== null && value !== undefined ? 
    (typeof value === 'number' ? value.toFixed(1) : value) : '-';
  const colorClass = getColor ? getColor(value) : 'text-slate-700 dark:text-slate-300';
  const progressColorClass = getProgressColor ? getProgressColor(value) : 'bg-slate-300';

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className={`text-sm font-medium ${colorClass}`}>
            {displayValue}{value !== null && value !== undefined ? unit : ''}
          </p>
        </div>
      </div>
      {showProgress && value !== null && value !== undefined && (
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${progressColorClass}`}
            style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
          />
        </div>
      )}
    </div>
  );
}
