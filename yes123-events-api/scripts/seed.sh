#!/bin/bash
# 导入种子数据
set -e

cd "$(dirname "$0")/.."

TARGET=${1:-local}

if [ "$TARGET" = "remote" ]; then
  echo "🌱 导入远程种子数据..."
  npx wrangler d1 execute yes123-events --remote --file=migrations/0003_seed_data.sql
else
  echo "🌱 导入本地种子数据..."
  npx wrangler d1 execute yes123-events --local --file=migrations/0003_seed_data.sql
fi

echo "✅ 种子数据导入完成"
