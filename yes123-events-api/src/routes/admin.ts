// 管理端点 — CRUD + 审核 + 批量导入

import type { Env } from '../env'
import type { EventInput } from '../types'
import {
  queryEvents,
  getEventById,
  insertEvent,
  updateEvent,
  updateEventStatus,
  deleteEvent,
  insertAuditLog,
} from '../services/event-store'
import { requireAdmin } from '../utils/auth'
import { json, error, success } from '../utils/response'

/** GET /api/admin/events — 管理端查询（可含 pending/rejected） */
export async function handleAdminGetEvents(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin')
  const authErr = requireAdmin(request, env)
  if (authErr) return authErr

  const url = new URL(request.url)
  const events = await queryEvents(env.DB, {
    city: url.searchParams.get('city') || undefined,
    date_from: url.searchParams.get('date_from') || undefined,
    date_to: url.searchParams.get('date_to') || undefined,
    category: url.searchParams.get('category') || undefined,
    status: url.searchParams.get('status') || 'all',
    page: parseInt(url.searchParams.get('page') || '1') || 1,
    limit: parseInt(url.searchParams.get('limit') || '100') || 100,
  })

  return json({ events, total: events.length }, 200, origin)
}

/** PUT /api/admin/events/:id — 编辑活动 */
export async function handleAdminUpdateEvent(request: Request, env: Env, id: string): Promise<Response> {
  const origin = request.headers.get('Origin')
  const authErr = requireAdmin(request, env)
  if (authErr) return authErr

  const existing = await getEventById(env.DB, id)
  if (!existing) return error('活动不存在', 404, origin)

  let body: Partial<EventInput>
  try {
    body = (await request.json()) as Partial<EventInput>
  } catch {
    return error('请求体格式错误', 400, origin)
  }

  await updateEvent(env.DB, id, body)

  await insertAuditLog(env.DB, {
    eventId: id,
    action: 'update',
    actor: 'admin',
  })

  return success({ id, message: '活动已更新' }, origin)
}

/** DELETE /api/admin/events/:id — 删除活动 */
export async function handleAdminDeleteEvent(request: Request, env: Env, id: string): Promise<Response> {
  const origin = request.headers.get('Origin')
  const authErr = requireAdmin(request, env)
  if (authErr) return authErr

  const existing = await getEventById(env.DB, id)
  if (!existing) return error('活动不存在', 404, origin)

  await deleteEvent(env.DB, id)

  await insertAuditLog(env.DB, {
    eventId: id,
    action: 'delete',
    actor: 'admin',
    oldStatus: existing.status,
  })

  return success({ id, message: '活动已删除' }, origin)
}

/** POST /api/admin/events/:id/review — 人工审核 */
export async function handleAdminReview(request: Request, env: Env, id: string): Promise<Response> {
  const origin = request.headers.get('Origin')
  const authErr = requireAdmin(request, env)
  if (authErr) return authErr

  const existing = await getEventById(env.DB, id)
  if (!existing) return error('活动不存在', 404, origin)

  let body: { status: 'approved' | 'rejected'; reason?: string }
  try {
    body = (await request.json()) as { status: 'approved' | 'rejected'; reason?: string }
  } catch {
    return error('请求体格式错误', 400, origin)
  }

  if (!['approved', 'rejected'].includes(body.status)) {
    return error('status 必须是 approved 或 rejected', 400, origin)
  }

  await updateEventStatus(env.DB, id, body.status)

  await insertAuditLog(env.DB, {
    eventId: id,
    action: 'review',
    actor: 'admin',
    oldStatus: existing.status,
    newStatus: body.status,
    aiReason: body.reason,
  })

  return success({ id, status: body.status, message: '审核完成' }, origin)
}

/** POST /api/admin/events/batch — 批量导入 */
export async function handleAdminBatch(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin')
  const authErr = requireAdmin(request, env)
  if (authErr) return authErr

  let body: { events: EventInput[]; status?: 'approved' | 'pending' }
  try {
    body = (await request.json()) as { events: EventInput[]; status?: 'approved' | 'pending' }
  } catch {
    return error('请求体格式错误', 400, origin)
  }

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return error('events 数组不能为空', 400, origin)
  }

  const status = body.status || 'approved'
  const ids: string[] = []

  for (const evt of body.events) {
    if (!evt.title || !evt.date || !evt.city) continue
    const id = await insertEvent(env.DB, evt, status)
    ids.push(id)
  }

  return json({ imported: ids.length, ids }, 201, origin)
}
