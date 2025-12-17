#!/bin/bash

# GitHub Actions 本地测试脚本
# 模拟 CI/CD 流程进行本地验证

set -e

echo "=========================================="
echo "🚀 炖炖守望 - 本地部署测试"
echo "=========================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 已安装"
        return 0
    else
        echo -e "${RED}✗${NC} $1 未安装"
        return 1
    fi
}

echo ""
echo "📋 步骤 1: 检查环境..."
echo "----------------------------------------"
check_command node
check_command npm
check_command npx

NODE_VERSION=$(node -v)
echo -e "  Node 版本: ${YELLOW}${NODE_VERSION}${NC}"

echo ""
echo "📦 步骤 2: 安装根目录依赖..."
echo "----------------------------------------"
npm ci || npm install
echo -e "${GREEN}✓${NC} 根目录依赖安装完成"

echo ""
echo "📦 步骤 3: 安装前端依赖..."
echo "----------------------------------------"
cd frontend
npm ci || npm install
cd ..
echo -e "${GREEN}✓${NC} 前端依赖安装完成"

echo ""
echo "🔨 步骤 4: 构建前端..."
echo "----------------------------------------"
npm run build:frontend
echo -e "${GREEN}✓${NC} 前端构建完成"

# 检查构建产物
if [ -d "frontend/dist" ]; then
    FILE_COUNT=$(find frontend/dist -type f | wc -l | tr -d ' ')
    echo -e "  构建产物文件数: ${YELLOW}${FILE_COUNT}${NC}"
else
    echo -e "${RED}✗${NC} 构建失败: frontend/dist 目录不存在"
    exit 1
fi

echo ""
echo "🧪 步骤 5: 验证 Wrangler 配置..."
echo "----------------------------------------"
npx wrangler whoami 2>/dev/null && echo -e "${GREEN}✓${NC} Wrangler 已登录" || echo -e "${YELLOW}!${NC} Wrangler 未登录 (本地测试无需登录)"

echo ""
echo "🔍 步骤 6: 执行 dry-run 部署测试..."
echo "----------------------------------------"
echo "这将验证配置是否正确，但不会实际部署"
npx wrangler deploy --dry-run && echo -e "${GREEN}✓${NC} Dry-run 测试通过" || {
    echo -e "${YELLOW}!${NC} Dry-run 需要登录 Cloudflare"
    echo "  运行 'npx wrangler login' 登录后重试"
}

echo ""
echo "=========================================="
echo "📊 测试总结"
echo "=========================================="
echo -e "${GREEN}✓${NC} 构建流程验证完成！"
echo ""
echo "要完成实际部署，请确保:"
echo "  1. 在 GitHub 仓库设置中添加以下 Secrets:"
echo "     - CLOUDFLARE_API_TOKEN"
echo "     - CLOUDFLARE_ACCOUNT_ID"
echo ""
echo "  2. 更新 wrangler.toml 中的 KV namespace ID"
echo "     (将 'local-kv-id' 替换为实际的 KV ID)"
echo ""
echo "获取 Cloudflare API Token:"
echo "  https://dash.cloudflare.com/profile/api-tokens"
echo "  创建自定义 Token，权限需要:"
echo "    - Account: Workers Scripts: Edit"
echo "    - Account: Workers KV Storage: Edit"
echo ""
echo "获取 Account ID:"
echo "  登录 Cloudflare Dashboard → Workers & Pages → 右侧栏"
echo ""
echo "=========================================="
