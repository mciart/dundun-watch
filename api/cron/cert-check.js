// Vercel Cron - SSL证书检测任务
// 每天凌晨4点执行（在 vercel.json 中配置）

import { handleCertCheck } from '../../src/monitor.js';

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
  
  console.log('=== Vercel Cron: 开始SSL证书检测 ===');
  console.log('执行时间:', new Date().toISOString());
  
  try {
    const env = createEnv();
    const ctx = {
      waitUntil: (promise) => {
        promise.catch(console.error);
      }
    };
    
    // 执行SSL证书检测
    await handleCertCheck(env, ctx);
    
    console.log('=== Vercel Cron: SSL证书检测完成 ===');
    
    res.status(200).json({
      success: true,
      message: 'SSL证书检测完成',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Cron SSL证书检测错误:', error);
    res.status(500).json({
      error: 'SSL证书检测失败',
      message: error.message
    });
  }
}

// Vercel Cron 配置
export const config = {
  maxDuration: 60,
};
