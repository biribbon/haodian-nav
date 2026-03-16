// GET /api/health — 健康检查

import { json } from '../utils/response'

export function handleHealth(request: Request): Response {
  return json({
    status: 'ok',
    service: 'haodianai-events-api',
    timestamp: new Date().toISOString(),
  }, 200, request.headers.get('Origin'))
}
