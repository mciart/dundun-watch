# Vercel 部署快速指南

## 📌 重要提示

Vercel 已将 **KV 数据库**移至 **Marketplace**，不再在 Storage 页面直接显示。

---

## 🚀 快速部署步骤

### 1️⃣ Fork 项目

访问 [dundun-sentinel](https://github.com/mciart/dundun-sentinel) 并 Fork 到你的 GitHub 账户。

---

### 2️⃣ 在 Marketplace 创建 KV 数据库

**重要：必须先创建 KV 数据库再导入项目！**

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击顶部导航 **Marketplace**
3. 搜索 **KV** 或访问：https://vercel.com/marketplace/kv
4. 点击 **Install** 或 **Add**
5. 选择你的团队/账户
6. 为数据库命名：`dundun-sentinel-kv`
7. 点击 **Create**

![KV Marketplace](https://github.com/user-attachments/assets/kv-marketplace-screenshot.png)

---

### 3️⃣ 导入项目到 Vercel

1. 回到 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **Add New** → **Project**
3. 找到你 Fork 的 `dundun-sentinel` 仓库
4. 点击 **Import**
5. **暂时不要点击 Deploy！** 先进行下一步

---

### 4️⃣ 连接 KV 数据库

**在项目导入后，部署前操作：**

1. 在项目设置页面，点击 **Storage** 标签
2. 点击 **Connect Database**
3. 选择刚创建的 `dundun-sentinel-kv`
4. 点击 **Connect**

这会自动添加这些环境变量：
- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

---

### 5️⃣ 配置 Cron Secret

1. 进入 **Settings** → **Environment Variables**
2. 点击 **Add New**
3. 添加变量：

| Name | Value | 
|------|-------|
| `CRON_SECRET` | 任意随机字符串（如 `abc123xyz`） |

💡 **生成随机字符串**：
```bash
# macOS/Linux
openssl rand -base64 32

# 或直接用任意字符串
my-super-secret-cron-key-2025
```

---

### 6️⃣ 部署项目

1. 点击顶部 **Deployments**
2. 点击 **Deploy** 或 **Redeploy**
3. 等待部署完成（约 1-2 分钟）

---

## ✅ 部署完成

访问 Vercel 提供的域名，例如：
- `https://dundun-sentinel.vercel.app/`
- 后台地址：`https://你的域名/admin`
- 默认密码：`admin`

⚠️ **立即修改密码！** 登录后台 → 后台设置 → 修改密码

---

## ❓ 常见问题

### Q: 找不到 KV 数据库选项？

A: Vercel 已将 KV 移至 Marketplace。请访问：
- https://vercel.com/marketplace/kv
- 或在 Vercel Dashboard 点击顶部 **Marketplace** 搜索 "KV"

### Q: 部署失败，提示找不到 KV？

A: 确保你已经：
1. ✅ 在 Marketplace 创建了 KV 数据库
2. ✅ 在项目的 Storage 页面连接了数据库
3. ✅ 环境变量 `KV_REST_API_URL` 和 `KV_REST_API_TOKEN` 已自动配置

### Q: 监控不工作？

A: 检查：
1. 环境变量 `CRON_SECRET` 是否已配置
2. 查看 Functions 日志：项目页面 → Functions → 查看 `/api/cron/monitor` 的日志

### Q: 如何查看监控日志？

A: 
1. 进入项目页面
2. 点击 **Logs** 或 **Functions**
3. 选择 `/api/cron/monitor` 查看定时任务执行日志

---

## 🔗 相关链接

- [Vercel KV 文档](https://vercel.com/docs/storage/vercel-kv)
- [Vercel Marketplace](https://vercel.com/marketplace)
- [项目 GitHub](https://github.com/mciart/dundun-sentinel)
