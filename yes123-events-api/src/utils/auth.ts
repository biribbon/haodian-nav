// 管理端点鉴权工具

import type { Env } from '../env'
import { error } from './response'

export function requireAdmin(request: Request, env: Env): Response | null {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error('缺少 Authorization 头', 401, request.headers.get('Origin'))
  }

  const token = authHeader.slice(7)
  if (token !== env.ADMIN_API_KEY) {
    return error('无效的 API Key', 403, request.headers.get('Origin'))
  }

  return null
}

export function getClientIP(request: Request): string {
  return (
    request.headers.get('CF-Connecting-IP') ||
    request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
    'unknown'
  )
}
