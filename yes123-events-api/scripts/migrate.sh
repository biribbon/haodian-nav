#!/bin/bash
# 执行数据库迁移
set -e

cd "$(dirname "$0")/.."

TARGET=${1:-local}

if [ "$TARGET" = "remote" ]; then
  echo "🗄️  执行远程迁移..."
  npx wrangler d1 execute yes123-events --remote --file=migrations/0001_create_events.sql
  npx wrangler d1 execute yes123-events --remote --file=migrations/0002_create_audit_log.sql
else
  echo "🗄️  执行本地迁移..."
  npx wrangler d1 execute yes123-events --local --file=migrations/0001_create_events.sql
  npx wrangler d1 execute yes123-events --local --file=migrations/0002_create_audit_log.sql
fi

echo "✅ 迁移完成"
