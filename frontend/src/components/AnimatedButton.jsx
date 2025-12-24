import { motion } from 'framer-motion';
import { forwardRef } from 'react';
import { EASING, DURATION, buttonHover, iconButtonHover } from '../utils/animations';

/**
 * Q弹按钮组件
 * 提供统一的动画效果
 */
const AnimatedButton = forwardRef(({ 
  children, 
  className = '', 
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  onClick,
  type = 'button',
  ...props 
}, ref) => {
  // 变体样式
  const styleVariants = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-600 hover:to-primary-700 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40',
    secondary: 'bg-slate-200/80 dark:bg-dark-layer text-slate-900 dark:text-slate-100 hover:bg-slate-300 dark:hover:bg-dark-highlight',
    danger: 'bg-gradient-to-r from-danger-500 to-danger-600 text-white hover:from-danger-600 hover:to-danger-700 shadow-lg shadow-danger-500/30 hover:shadow-xl hover:shadow-danger-500/40',
    ghost: 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-[#2a2a2a]',
    outline: 'border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-[#2a2a2a]',
    success: 'bg-gradient-to-r from-emerald-500 to-primary-600 text-white hover:from-emerald-600 hover:to-primary-700 shadow-lg shadow-emerald-500/30',
    warning: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-lg shadow-amber-500/30',
    icon: 'p-2 rounded-lg hover:bg-slate-200/80 dark:hover:bg-[#2a2a2a]',
  };

  // 尺寸样式
  const sizes = {
    xs: 'px-2 py-1 text-xs rounded-lg',
    sm: 'px-3 py-1.5 text-sm rounded-lg',
    md: 'px-4 py-2 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
    xl: 'px-8 py-4 text-lg rounded-2xl',
    icon: 'p-2',
  };

  const baseClass = `
    relative inline-flex items-center justify-center gap-2
    font-medium overflow-hidden
    transition-colors duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClass} ${styleVariants[variant]} ${sizes[size]} ${className}`}
      whileHover={!disabled && !loading ? { 
        scale: 1.02, 
        y: -2,
        transition: { duration: DURATION.fast, ease: EASING.bounce }
      } : {}}
      whileTap={!disabled && !loading ? { 
        scale: 0.98,
        transition: { duration: 0.1 }
      } : {}}
      {...props}
    >
      {loading ? (
        <motion.svg 
          className="w-5 h-5" 
          xmlns="http://www.w3.org/2000/svg" 
          fill="none" 
          viewBox="0 0 24 24"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </motion.svg>
      ) : (
        <>
          {Icon && <Icon className={size === 'icon' ? 'w-5 h-5' : 'w-4 h-4'} />}
          {children}
        </>
      )}
    </motion.button>
  );
});

AnimatedButton.displayName = 'AnimatedButton';

/**
 * 图标按钮组件
 */
export const IconButton = forwardRef(({ 
  children, 
  className = '',
  color = 'slate',
  disabled = false,
  onClick,
  title,
  ...props 
}, ref) => {
  const colors = {
    slate: 'bg-slate-200/80 dark:bg-dark-layer text-slate-600 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-dark-highlight',
    blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50',
    red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50',
    green: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50',
    amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50',
  };

  return (
    <motion.button
      ref={ref}
      disabled={disabled}
      onClick={onClick}
      title={title}
      className={`p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${colors[color]} ${className}`}
      whileHover={!disabled ? iconButtonHover.whileHover : {}}
      whileTap={!disabled ? iconButtonHover.whileTap : {}}
      {...props}
    >
      {children}
    </motion.button>
  );
});

IconButton.displayName = 'IconButton';

export default AnimatedButton;
