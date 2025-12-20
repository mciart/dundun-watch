// Vercel API 入口 - 处理所有 /api/* 请求
// 将请求转发到现有的 API 处理模块

import { handleAPI } from '../src/api.js';

// 模拟 Cloudflare Workers 的 env 对象
function createEnv() {
  return {
    ENVIRONMENT: process.env.NODE_ENV || 'production',
    // Vercel KV 通过 storage.js 自动检测和使用
    MONITOR_DATA: null, // 在 Vercel 上不使用此对象
  };
}

// 将 Vercel 请求转换为标准 Request
function toWebRequest(req) {
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const url = new URL(req.url, `${protocol}://${host}`);
  
  const init = {
    method: req.method,
    headers: new Headers(req.headers),
  };
  
  // 对于有 body 的请求，需要传递 body
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req.body;
    init.duplex = 'half';
  }
  
  return new Request(url.toString(), init);
}

// 将 Web Response 转换为 Vercel 响应
async function sendWebResponse(res, webResponse) {
  // 设置状态码
  res.status(webResponse.status);
  
  // 设置响应头
  webResponse.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  
  // 发送响应体
  const body = await webResponse.text();
  res.send(body);
}

export default async function handler(req, res) {
  try {
    // CORS 预检请求
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.status(200).end();
      return;
    }
    
    const env = createEnv();
    const ctx = {
      waitUntil: (promise) => {
        // Vercel 不支持 waitUntil，直接执行
        promise.catch(console.error);
      }
    };
    
    // 转换请求
    const webRequest = toWebRequest(req);
    
    // 调用现有的 API 处理函数
    const response = await handleAPI(webRequest, env, ctx);
    
    // 返回响应
    await sendWebResponse(res, response);
    
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      error: '服务器内部错误',
      message: error.message
    });
  }
}

// Vercel Edge Runtime 配置（如需要边缘运行时）
// export const config = {
//   runtime: 'edge',
// };
