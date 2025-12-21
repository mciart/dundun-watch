import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, LogIn, AlertCircle } from 'lucide-react';
import { api, setToken } from '../utils/api';
import { BRAND } from '../config';
import { 
  EASING, 
  DURATION, 
  SPRING,
  cardContainerVariants,
  cardContainerTransition,
  fadeInUp,
  buttonHover,
  withDelay
} from '../utils/animations';

export default function LoginPage({ adminPath = 'admin' }) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.login(password);
      
      if (!response.token) {
        throw new Error('登录响应无效');
      }

      setToken(response.token);
      // 跳转到动态后台路径
      window.location.href = `/${adminPath}`;
    } catch (err) {
      console.error('登录错误:', err);
      setError(err.message || '登录失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div 
        initial={cardContainerVariants.initial}
        animate={cardContainerVariants.animate}
        transition={cardContainerTransition}
        className="w-full max-w-md"
      >
        <div className="glass-card p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div 
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                delay: 0.2, 
                ...SPRING.normal
              }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
            >
              <motion.img 
                src="/img/favicon.ico" 
                alt="Logo" 
                className="w-16 h-16"
                animate={{ 
                  rotate: [0, -5, 5, -5, 0],
                }}
                transition={{ 
                  delay: 0.6,
                  duration: 0.5,
                  ease: "easeInOut"
                }}
              />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.3 }}
              className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-emerald-600 dark:from-primary-400 dark:to-emerald-400 bg-clip-text text-transparent"
            >
              {BRAND.siteName}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.3 }}
              className="text-slate-500 dark:text-slate-400 mt-2"
            >
              管理后台登录
            </motion.p>
          </div>

          {/* 登录表单 */}
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                管理密码
              </label>
              <motion.div 
                className="relative"
                whileFocus={{ scale: 1.02 }}
              >
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder="请输入管理密码"
                  required
                  autoFocus
                />
              </motion.div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="flex items-center gap-2 p-4 rounded-xl bg-danger-50 dark:bg-danger-900/30 text-danger-600 dark:text-danger-400"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.4 }}
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                </motion.div>
                <p className="text-sm">{error}</p>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={loading || !password}
              className="w-full btn-primary h-12 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={buttonHover.whileHover}
              whileTap={buttonHover.whileTap}
            >
              {loading ? (
                <>
                  <motion.svg 
                    className="w-5 h-5" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </motion.svg>
                  登录中...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  登录
                </>
              )}
            </motion.button>
          </motion.form>

          {/* 返回首页 */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="mt-6 text-center"
          >
            <motion.a
              href="/"
              className="text-sm text-primary-600 dark:text-primary-400 hover:underline"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              返回首页
            </motion.a>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
