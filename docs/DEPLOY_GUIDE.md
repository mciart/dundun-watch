# GitHub Actions 自动部署到 Cloudflare Workers 配置指南

## 📋 前提条件

1. 拥有 Cloudflare 账号
2. 已创建 Cloudflare Workers KV 命名空间
3. GitHub 仓库已关联

## 🔑 配置 GitHub Secrets

在 GitHub 仓库中添加以下 Secrets：

**路径**: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`

### 1. CLOUDFLARE_API_TOKEN

创建步骤：
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击右上角头像 → `My Profile` → `API Tokens`
3. 点击 `Create Token`
4. 选择 `Create Custom Token`
5. 配置权限：
   - **Account** - `Workers Scripts` - `Edit`
   - **Account** - `Workers KV Storage` - `Edit`
   - **Account** - `Workers Routes` - `Edit` (如需自定义域名)
   - **Zone** - `Workers Routes` - `Edit` (如需自定义域名)
6. 点击 `Continue to summary` → `Create Token`
7. 复制生成的 Token

### 2. CLOUDFLARE_ACCOUNT_ID

获取步骤：
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 `Workers & Pages`
3. 在右侧栏找到 `Account ID`
4. 复制该 ID

## 🗃️ 创建 KV 命名空间

```bash
# 使用 Wrangler CLI 创建
npx wrangler kv namespace create "MONITOR_DATA"

# 输出示例：
# 🌀 Creating namespace with title "dundun-watch-MONITOR_DATA"
# ✨ Success! Add the following to your wrangler.toml:
# [[kv_namespaces]]
# binding = "MONITOR_DATA"
# id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

## 📝 更新 wrangler.toml

将生成的 KV namespace ID 更新到 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "MONITOR_DATA"
id = "你的实际KV_ID"  # 替换为上面创建时获取的 ID
# preview_id 用于 wrangler dev 本地开发，可以创建单独的预览命名空间
# preview_id = "你的预览KV_ID"
```

### 生产环境配置示例

你可以使用环境分离：

```toml
name = "dundun-watch"
main = "src/index.js"
compatibility_date = "2024-12-08"

[assets]
directory = "./frontend/dist"
binding = "ASSETS"
html_handling = "auto-trailing-slash"
not_found_handling = "single-page-application"

# 开发环境 KV
[[kv_namespaces]]
binding = "MONITOR_DATA"
id = "dev-kv-id"
preview_id = "dev-kv-id"

[triggers]
crons = ["* * * * *", "0 4 * * *"]

[vars]
ENVIRONMENT = "development"

# ========= 生产环境配置 =========
[env.production]
[[env.production.kv_namespaces]]
binding = "MONITOR_DATA"
id = "production-kv-id"

[env.production.vars]
ENVIRONMENT = "production"
```

部署生产环境：
```bash
npx wrangler deploy --env production
```

## 🚀 触发部署

### 自动触发
- Push 到 `main` 或 `master` 分支时自动部署

### 手动触发
1. 进入 GitHub 仓库
2. 点击 `Actions` 标签
3. 选择 `Deploy to Cloudflare Workers` 工作流
4. 点击 `Run workflow`

## 📊 工作流说明

### Jobs

| Job | 说明 | 触发条件 |
|-----|------|----------|
| build | 构建前端，验证代码 | 所有 push 和 PR |
| deploy | 部署到 Cloudflare | push 到主分支或手动触发 |
| preview | 预览部署（dry-run） | PR 时触发 |

### 工作流文件

位置: `.github/workflows/deploy.yml`

## 🔧 本地测试

运行本地测试脚本验证配置：

```bash
chmod +x test-deploy.sh
./test-deploy.sh
```

## ❓ 常见问题

### Q: 部署失败，提示 "Authentication error"
**A**: 检查 `CLOUDFLARE_API_TOKEN` 是否正确配置，Token 是否有足够权限。

### Q: 部署成功但 KV 数据丢失
**A**: 确保生产环境使用了正确的 KV namespace ID，不要使用开发环境的 ID。

### Q: 如何查看部署日志
**A**: 在 GitHub Actions 页面点击对应的工作流运行记录查看详细日志。

### Q: 如何回滚部署
**A**: 
1. 在 Cloudflare Dashboard 进入 Workers
2. 点击你的 Worker
3. 进入 `Deployments` 标签
4. 选择历史版本进行回滚

## 🔗 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler 文档](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Wrangler GitHub Action](https://github.com/cloudflare/wrangler-action)
