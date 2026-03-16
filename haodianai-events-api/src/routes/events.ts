// GET /api/events — 公开查询活动列表

import type { Env } from '../env'
import { queryEvents } from '../services/event-store'
import { json, error } from '../utils/response'

export async function handleGetEvents(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url)
  const origin = request.headers.get('Origin')

  const query = {
    city: url.searchParams.get('city') || undefined,
    date_from: url.searchParams.get('date_from') || undefined,
    date_to: url.searchParams.get('date_to') || undefined,
    category: url.searchParams.get('category') || undefined,
    status: url.searchParams.get('status') || 'approved',
    page: parseInt(url.searchParams.get('page') || '1') || 1,
    limit: parseInt(url.searchParams.get('limit') || '100') || 100,
  }

  try {
    const events = await queryEvents(env.DB, query)
    return json({ events, total: events.length }, 200, origin)
  } catch (e) {
    console.error('查询活动失败:', e)
    return error('查询活动失败', 500, origin)
  }
}
