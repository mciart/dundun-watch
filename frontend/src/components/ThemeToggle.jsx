import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function ThemeToggle() {
  // 初始化时立即检测当前主题状态
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // 如果没有保存的主题，检测系统偏好
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  const [isDark, setIsDark] = useState(getInitialTheme);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // 同步 DOM 状态
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    // 监听系统主题变化（仅当用户没有手动设置时）
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      if (!localStorage.getItem('theme')) {
        setIsDark(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    setIsAnimating(true);
    const newTheme = isDark ? 'light' : 'dark';
    setIsDark(!isDark);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    setTimeout(() => setIsAnimating(false), 500);
  };

  return (
    <motion.div 
      className="theme-switch"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isAnimating ? { rotate: [0, -10, 10, 0] } : {}}
      transition={{ duration: 0.3 }}
    >
      <input 
        type="checkbox" 
        id="theme-checkbox" 
        checked={isDark}
        onChange={toggleTheme}
      />
      <label htmlFor="theme-checkbox">
        <motion.div
          animate={{ 
            x: isDark ? 0 : 0,
            scale: isAnimating ? [1, 1.2, 1] : 1
          }}
          transition={{ 
            duration: 0.5, 
            ease: [0.68, -0.55, 0.265, 1.55] 
          }}
        />
        <span>
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
            animate={isDark ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <path
              fillRule="evenodd"
              d="M9.528 1.718a.75.75 0 01.162.819A8.97 8.97 0 009 6a9 9 0 009 9 8.97 8.97 0 003.463-.69.75.75 0 01.981.98 10.503 10.503 0 01-9.694 6.46c-5.799 0-10.5-4.701-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 01.818.162z"
              clipRule="evenodd"
            ></path>
          </motion.svg>
        </span>
        <span>
          <motion.svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
            animate={!isDark ? { rotate: 180, scale: [1, 1.1, 1] } : { rotate: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <path
              d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"
            ></path>
          </motion.svg>
        </span>
      </label>
    </motion.div>
  );
}
