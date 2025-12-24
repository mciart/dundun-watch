const colorMap = {
  blue: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400',
    text: 'text-blue-600 dark:text-blue-400'
  },
  green: {
    bg: 'bg-primary-100 dark:bg-primary-900/30',
    icon: 'text-primary-600 dark:text-primary-400',
    text: 'text-primary-600 dark:text-primary-400'
  },
  red: {
    bg: 'bg-danger-100 dark:bg-danger-900/30',
    icon: 'text-danger-600 dark:text-danger-400',
    text: 'text-danger-600 dark:text-danger-400'
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'text-purple-600 dark:text-purple-400',
    text: 'text-purple-600 dark:text-purple-400'
  }
};

export default function StatsCard({ icon: Icon, label, value, color = 'blue' }) {
  const colors = colorMap[color];

  return (
    <div
      className="glass-card p-6 group cursor-pointer transition-all duration-150 ease-out hover:shadow-lg"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
            {label}
          </p>
          <p className={`text-3xl font-bold ${colors.text}`}>
            {value}
          </p>
        </div>
        <div
          className={`w-14 h-14 rounded-2xl ${colors.bg} flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-[360deg] group-hover:scale-110 animate-icon-spin`}
        >
          <Icon className={`w-7 h-7 ${colors.icon}`} />
        </div>
      </div>
    </div>
  );
}
