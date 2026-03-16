// POST /api/admin/extract — 小红书文本 AI 提取

import type { Env } from '../env'
import { extractEvents } from '../services/ai-extract'
import { requireAdmin } from '../utils/auth'
import { json, error } from '../utils/response'

export async function handleExtract(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin')

  const authErr = requireAdmin(request, env)
  if (authErr) return authErr

  let body: { text: string }
  try {
    body = (await request.json()) as { text: string }
  } catch {
    return error('请求体格式错误', 400, origin)
  }

  if (!body.text?.trim()) {
    return error('文本内容不能为空', 400, origin)
  }

  try {
    const result = await extractEvents(env, body.text)
    return json({
      events: result.events,
      count: result.events.length,
    }, 200, origin)
  } catch (e) {
    console.error('AI 提取失败:', e)
    return error('AI 提取失败', 500, origin)
  }
}
