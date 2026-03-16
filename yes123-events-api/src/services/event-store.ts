// 活动数据存储服务

import type { Env } from '../env'
import type { EventRecord, EventInput, EventOutput, EventQuery } from '../types'

/** 数据库记录 → 前端输出格式 */
function toOutput(row: EventRecord): EventOutput {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    endDate: row.end_date,
    city: row.city,
    address: row.address,
    lng: row.lng,
    lat: row.lat,
    category: row.category,
    tags: JSON.parse(row.tags || '[]'),
    url: row.url,
    source: row.source,
    organizer: row.organizer,
    theme: row.theme,
    free: row.free === 1,
    status: row.status,
  }
}

/** 生成活动 ID */
function generateId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `evt-${ts}-${rand}`
}

/** 查询活动列表 */
export async function queryEvents(db: D1Database, query: EventQuery): Promise<EventOutput[]> {
  const conditions: string[] = []
  const params: unknown[] = []

  // status 过滤：传 'all' 不过滤，不传默认 approved
  const status = query.status
  if (status && status !== 'all') {
    conditions.push('status = ?')
    params.push(status)
  } else if (!status) {
    conditions.push('status = ?')
    params.push('approved')
  }

  if (query.city) {
    conditions.push('city = ?')
    params.push(query.city)
  }
  if (query.date_from) {
    conditions.push('date >= ?')
    params.push(query.date_from)
  }
  if (query.date_to) {
    conditions.push('date <= ?')
    params.push(query.date_to)
  }
  if (query.category) {
    conditions.push('category = ?')
    params.push(query.category)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit = Math.min(query.limit || 100, 200)
  const offset = ((query.page || 1) - 1) * limit

  const sql = `SELECT * FROM events ${where} ORDER BY date ASC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const result = await db.prepare(sql).bind(...params).all<EventRecord>()
  return (result.results || []).map(toOutput)
}

/** 按 ID 获取单个活动 */
export async function getEventById(db: D1Database, id: string): Promise<EventRecord | null> {
  const result = await db.prepare('SELECT * FROM events WHERE id = ?').bind(id).first<EventRecord>()
  return result || null
}

/** 插入新活动 */
export async function insertEvent(
  db: D1Database,
  input: EventInput,
  status: 'approved' | 'pending' | 'rejected' = 'pending',
  id?: string,
): Promise<string> {
  const eventId = id || generateId()
  const now = new Date().toISOString()

  await db
    .prepare(
      `INSERT INTO events (id, title, date, end_date, city, address, lng, lat, category, tags, url, source, source_platform, source_url, organizer, theme, free, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      eventId,
      input.title,
      input.date,
      input.endDate || null,
      input.city,
      input.address || null,
      input.lng || null,
      input.lat || null,
      input.category || 'meetup',
      JSON.stringify(input.tags || []),
      input.url || '',
      input.source || '',
      input.sourcePlatform || '',
      input.sourceUrl || '',
      input.organizer || '',
      input.theme || '',
      input.free ? 1 : 0,
      status,
      now,
      now,
    )
    .run()

  return eventId
}

/** 更新活动 */
export async function updateEvent(db: D1Database, id: string, updates: Partial<EventInput>): Promise<boolean> {
  const fields: string[] = []
  const params: unknown[] = []

  if (updates.title !== undefined) { fields.push('title = ?'); params.push(updates.title) }
  if (updates.date !== undefined) { fields.push('date = ?'); params.push(updates.date) }
  if (updates.endDate !== undefined) { fields.push('end_date = ?'); params.push(updates.endDate) }
  if (updates.city !== undefined) { fields.push('city = ?'); params.push(updates.city) }
  if (updates.address !== undefined) { fields.push('address = ?'); params.push(updates.address) }
  if (updates.lng !== undefined) { fields.push('lng = ?'); params.push(updates.lng) }
  if (updates.lat !== undefined) { fields.push('lat = ?'); params.push(updates.lat) }
  if (updates.category !== undefined) { fields.push('category = ?'); params.push(updates.category) }
  if (updates.tags !== undefined) { fields.push('tags = ?'); params.push(JSON.stringify(updates.tags)) }
  if (updates.url !== undefined) { fields.push('url = ?'); params.push(updates.url) }
  if (updates.source !== undefined) { fields.push('source = ?'); params.push(updates.source) }
  if (updates.organizer !== undefined) { fields.push('organizer = ?'); params.push(updates.organizer) }
  if (updates.theme !== undefined) { fields.push('theme = ?'); params.push(updates.theme) }
  if (updates.free !== undefined) { fields.push('free = ?'); params.push(updates.free ? 1 : 0) }

  if (fields.length === 0) return false

  fields.push("updated_at = datetime('now')")
  params.push(id)

  const sql = `UPDATE events SET ${fields.join(', ')} WHERE id = ?`
  const result = await db.prepare(sql).bind(...params).run()
  return result.meta.changes > 0
}

/** 更新活动状态 */
export async function updateEventStatus(
  db: D1Database,
  id: string,
  status: 'approved' | 'pending' | 'rejected',
): Promise<boolean> {
  const result = await db
    .prepare("UPDATE events SET status = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(status, id)
    .run()
  return result.meta.changes > 0
}

/** 删除活动 */
export async function deleteEvent(db: D1Database, id: string): Promise<boolean> {
  const result = await db.prepare('DELETE FROM events WHERE id = ?').bind(id).run()
  return result.meta.changes > 0
}

/** 检查 source_url 是否已存在（去重） */
export async function existsBySourceUrl(db: D1Database, sourceUrl: string): Promise<boolean> {
  const row = await db.prepare('SELECT id FROM events WHERE source_url = ? LIMIT 1').bind(sourceUrl).first()
  return row !== null
}

/** 删除过期活动（结束日期早于 7 天前） */
export async function deleteExpiredEvents(db: D1Database): Promise<number> {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const result = await db
    .prepare('DELETE FROM events WHERE COALESCE(end_date, date) < ?')
    .bind(cutoffStr)
    .run()

  return result.meta.changes
}

/** 写入审核日志 */
export async function insertAuditLog(
  db: D1Database,
  log: {
    eventId: string
    action: string
    actor?: string
    oldStatus?: string
    newStatus?: string
    aiReason?: string
    aiConfidence?: number
    rawInput?: string
    ipAddress?: string
  },
): Promise<void> {
  await db
    .prepare(
      `INSERT INTO audit_log (event_id, action, actor, old_status, new_status, ai_reason, ai_confidence, raw_input, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      log.eventId,
      log.action,
      log.actor || '',
      log.oldStatus || null,
      log.newStatus || null,
      log.aiReason || null,
      log.aiConfidence || null,
      log.rawInput || null,
      log.ipAddress || null,
    )
    .run()
}
