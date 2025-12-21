import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldX } from 'lucide-react';
import { 
  SPRING,
  cardContainerVariants,
  cardContainerTransition,
  fadeInUp,
  withDelay
} from '../utils/animations';

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/', { replace: true });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={cardContainerVariants.initial}
        animate={cardContainerVariants.animate}
        transition={cardContainerTransition}
        className="w-full max-w-md text-center"
      >
        <div className="glass-card p-8">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: 0.2, 
              ...SPRING.normal
            }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-danger-100 dark:bg-danger-900/30 mb-6"
          >
            <motion.div
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
              }}
              transition={{ 
                delay: 0.6,
                duration: 0.5,
                ease: "easeInOut"
              }}
            >
              <ShieldX className="w-10 h-10 text-danger-600 dark:text-danger-400" />
            </motion.div>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="text-2xl font-bold text-slate-900 dark:text-white mb-2"
          >
            禁止访问
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="text-slate-500 dark:text-slate-400 mb-6"
          >
            页面不存在或无权访问
          </motion.p>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="text-sm text-slate-400 dark:text-slate-500"
          >
            <motion.span
              key={countdown}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              {countdown}
            </motion.span> 秒后返回首页...
          </motion.div>
          <motion.button
            onClick={() => navigate('/', { replace: true })}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.3 }}
            className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            立即返回首页
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
