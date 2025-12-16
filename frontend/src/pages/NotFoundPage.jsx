import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldX } from 'lucide-react';

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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md text-center"
      >
        <div className="glass-card p-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-danger-100 dark:bg-danger-900/30 mb-6">
            <ShieldX className="w-10 h-10 text-danger-600 dark:text-danger-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            禁止访问
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            页面不存在或无权访问
          </p>
          <div className="text-sm text-slate-400 dark:text-slate-500">
            <span>{countdown}</span> 秒后返回首页...
          </div>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="mt-4 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            立即返回首页
          </button>
        </div>
      </motion.div>
    </div>
  );
}
