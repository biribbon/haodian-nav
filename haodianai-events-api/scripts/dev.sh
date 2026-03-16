#!/bin/bash
# 本地开发启动
set -e

cd "$(dirname "$0")/.."

# 安装依赖
if [ ! -d "node_modules" ]; then
  echo "📦 安装依赖..."
  npm install
fi

# 本地执行迁移
echo "🗄️  执行本地迁移..."
npx wrangler d1 execute haodianai-events --local --file=migrations/0001_create_events.sql 2>/dev/null || true
npx wrangler d1 execute haodianai-events --local --file=migrations/0002_create_audit_log.sql 2>/dev/null || true

echo "🚀 启动本地开发服务器..."
npx wrangler dev
