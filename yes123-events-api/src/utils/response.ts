// 统一响应构造工具

import { corsHeaders } from './cors'

export function json(data: unknown, status = 200, origin?: string | null): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  })
}

export function error(message: string, status = 400, origin?: string | null): Response {
  return json({ error: message }, status, origin)
}

export function success(data: unknown, origin?: string | null): Response {
  return json({ success: true, data }, 200, origin)
}
