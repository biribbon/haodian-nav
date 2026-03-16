#!/bin/bash
# 部署到 Cloudflare Workers
set -e

cd "$(dirname "$0")/.."

echo "🚀 部署到 Cloudflare Workers..."
npx wrangler deploy

echo "✅ 部署完成"
