// POST /api/events/submit — 社区投稿

import type { Env } from '../env'
import type { EventInput } from '../types'
import { insertEvent, insertAuditLog } from '../services/event-store'
import { reviewEvent } from '../services/ai-review'
import { json, error } from '../utils/response'
import { getClientIP } from '../utils/auth'

/** 简单 IP 限流：每小时最多 5 次投稿 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600_000 })
    return true
  }

  if (entry.count >= 5) return false

  entry.count++
  return true
}

export async function handleSubmit(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin')
  const ip = getClientIP(request)

  // 限流检查
  if (!checkRateLimit(ip)) {
    return error('投稿过于频繁，每小时最多 5 次', 429, origin)
  }

  let body: EventInput
  try {
    body = (await request.json()) as EventInput
  } catch {
    return error('请求体格式错误', 400, origin)
  }

  // 基本校验
  if (!body.title?.trim()) return error('标题不能为空', 400, origin)
  if (!body.date?.trim()) return error('日期不能为空', 400, origin)
  if (!body.city?.trim()) return error('城市不能为空', 400, origin)

  try {
    // AI 审核
    const review = await reviewEvent(env, body)

    // 入库
    body.source = body.source || '社区投稿'
    body.sourcePlatform = 'submit'
    const eventId = await insertEvent(env.DB, body, review.status)

    // 审核日志
    await insertAuditLog(env.DB, {
      eventId,
      action: 'submit',
      actor: 'user',
      newStatus: review.status,
      aiReason: review.reason,
      aiConfidence: review.confidence,
      rawInput: JSON.stringify(body),
      ipAddress: ip,
    })

    return json(
      {
        id: eventId,
        status: review.status,
        message:
          review.status === 'approved'
            ? '投稿已通过审核，即将上线'
            : review.status === 'pending'
              ? '投稿已收到，等待人工审核'
              : `投稿未通过：${review.reason}`,
      },
      201,
      origin,
    )
  } catch (e) {
    console.error('投稿处理失败:', e)
    return error('投稿处理失败，请稍后重试', 500, origin)
  }
}
