import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Edit, Trash2, ExternalLink, TrendingUp, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { formatTimeAgo, formatResponseTime, getStatusText, getStatusBgColor, getLucideIcon } from '../utils/helpers';
import { EASING, DURATION } from '../utils/animations';
import { CHART_COLORS } from '../config';

// 提取一个内部组件来处理单个分组的拖拽逻辑
const SortableSiteGroup = ({ sites, groupId, onReorderSites, onEdit, onDelete }) => {
  const [items, setItems] = useState(sites);

  // 当外部 sites 数据更新（如状态改变）时，同步更新内部状态
  useEffect(() => {
    setItems(sites);
  }, [sites]);

  const handleReorder = (newOrder) => {
    setItems(newOrder);
  };

  const handleDragEnd = async () => {
    const siteIds = items.map(site => site.id);
    if (onReorderSites) {
      await onReorderSites(siteIds);
    }
  };

  return (
    <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="divide-y divide-slate-100 dark:divide-slate-800">
      {items.map((site) => (
        <Reorder.Item
          key={site.id}
          value={site}
          onDragEnd={handleDragEnd}
          className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors bg-white dark:bg-transparent"
        >
          {/* 拖拽手柄 */}
          <div className="flex flex-col gap-0.5 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 dark:text-slate-600 dark:hover:text-slate-400">
            <GripVertical className="w-4 h-4" />
          </div>

          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            site.status === 'online' ? 'bg-emerald-500' :
            site.status === 'offline' ? 'bg-red-500' :
            site.status === 'slow' ? 'bg-amber-500' : 'bg-slate-400'
          }`} />

          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-900 dark:text-slate-100 truncate">
              {site.name}
            </div>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 truncate"
              // 防止点击链接时触发拖拽，虽然 GripVertical 已经隔离了，但这是好习惯
              onPointerDown={(e) => e.stopPropagation()} 
            >
              {site.url.length > 50 ? site.url.substring(0, 50) + '...' : site.url}
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
            </a>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-sm">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBgColor(site.status)}`}>
              {getStatusText(site.status)}
            </span>
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 w-20">
              <TrendingUp className="w-3 h-3" />
              {formatResponseTime(site.responseTime)}
            </div>
            <div className="text-slate-500 dark:text-slate-400 w-20">
              {site.stats?.uptime !== undefined ? `${site.stats.uptime}%` : '-'}
            </div>
            <div className="text-slate-400 dark:text-slate-500 w-24 text-xs">
              {site.lastCheck ? formatTimeAgo(site.lastCheck) : '未检查'}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <motion.button
              onClick={() => onEdit(site)}
              className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              title="编辑"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Edit className="w-3.5 h-3.5" />
            </motion.button>
            <motion.button
              onClick={() => onDelete(site.id)}
              className="p-1.5 rounded-lg bg-danger-100 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400 hover:bg-danger-200 dark:hover:bg-danger-900/50 transition-colors"
              title="删除"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </motion.button>
          </div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
};

export default function SiteList({ sites, groups = [], onEdit, onDelete, onReorder }) {
  const [expandedGroups, setExpandedGroups] = useState(() => {
    const initial = {};
    groups.forEach(g => { initial[g.id] = true; });
    initial['default'] = true;
    return initial;
  });

  const sortedGroups = useMemo(() => {
    return [...groups].sort((a, b) => {
      const orderA = typeof a.order === 'number' ? a.order : 0;
      const orderB = typeof b.order === 'number' ? b.order : 0;
      if (orderA !== orderB) return orderA - orderB;
      return (a.createdAt || 0) - (b.createdAt || 0);
    });
  }, [groups]);

  const groupedSites = useMemo(() => {
    const result = {};
    sortedGroups.forEach(g => { result[g.id] = []; });
    if (!result['default']) result['default'] = [];
    
    sites.forEach(site => {
      const gid = site.groupId || 'default';
      if (!result[gid]) result[gid] = [];
      result[gid].push(site);
    });

    Object.keys(result).forEach(gid => {
      result[gid].sort((a, b) => {
        const orderA = typeof a.sortOrder === 'number' ? a.sortOrder : 0;
        const orderB = typeof b.sortOrder === 'number' ? b.sortOrder : 0;
        if (orderA !== orderB) return orderA - orderB;
        return (a.createdAt || 0) - (b.createdAt || 0);
      });
    });

    return result;
  }, [sites, sortedGroups]);

  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  if (sites.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500 dark:text-slate-400">
          暂无站点，点击右上角添加站点开始监控
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sortedGroups.map(group => {
        const sitesInGroup = groupedSites[group.id] || [];
        if (sitesInGroup.length === 0) return null;
        
        const isExpanded = expandedGroups[group.id] !== false;

        return (
          <motion.div 
            key={group.id} 
            className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: DURATION.normal, ease: EASING.bounce }}
          >
            <motion.button
              onClick={() => toggleGroup(group.id)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-dark-layer/50 hover:bg-slate-200/80 dark:hover:bg-[#2a2a2a] transition-colors"
              whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: DURATION.fast, ease: EASING.bounce }}
                >
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </motion.div>
                {group.icon && (() => {
                  const IconComponent = getLucideIcon(group.icon);
                  return IconComponent ? (
                    <IconComponent className="w-4 h-4" style={{ color: group.iconColor || CHART_COLORS.responseTime }} />
                  ) : null;
                })()}
                <span className="font-medium text-slate-900 dark:text-white">{group.name}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-1">
                  ({sitesInGroup.length})
                </span>
              </div>
            </motion.button>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: DURATION.normal, ease: EASING.bounce }}
                  className="overflow-hidden"
                >
                  {/* 使用提取的 SortableSiteGroup 组件 */}
                  <SortableSiteGroup 
                    sites={sitesInGroup}
                    groupId={group.id}
                    onReorderSites={onReorder} // 直接透传 onReorder
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}