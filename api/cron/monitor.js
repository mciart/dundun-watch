// Vercel Cron - 监控检测任务
// 每15分钟执行一次（在 vercel.json 中配置）

import { handleMonitor } from '../../src/monitor.js';

// 模拟 Cloudflare Workers 的 env 对象
function createEnv() {
  return {
    ENVIRONMENT: process.env.NODE_ENV || 'production',
    MONITOR_DATA: null, // Vercel KV 通过 storage.js 自动检测
  };
}

export default async function handler(req, res) {
  // 验证 Cron Secret（防止未授权调用）
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.warn('Cron 任务：未授权的调用尝试');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log('=== Vercel Cron: 开始监控检测 ===');
  console.log('执行时间:', new Date().toISOString());
  
  try {
    const env = createEnv();
    const ctx = {
      waitUntil: (promise) => {
        // Vercel 不支持 waitUntil，同步执行
        promise.catch(console.error);
      }
    };
    
    // 执行监控检测
    await handleMonitor(env, ctx, false);
    
    console.log('=== Vercel Cron: 监控检测完成 ===');
    
    res.status(200).json({
      success: true,
      message: '监控检测完成',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cron 监控检测错误:', error);
    res.status(500).json({
      error: '监控检测失败',
      message: error.message
    });
  }
}

// Vercel Cron 配置
export const config = {
  // 最大执行时间（秒）- Hobby 版限制 10 秒，Pro 版 60 秒
  maxDuration: 60,
};
