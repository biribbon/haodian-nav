// 掘金爬虫 — fetch HTML → DeepSeek 提取结构化活动

import type { Env } from '../env'
import type { EventInput } from '../types'
import { existsBySourceUrl, insertEvent, insertAuditLog } from '../services/event-store'
import { chatCompletion } from '../services/deepseek-client'
import { geocodeAddress } from './scheduler'

const JUEJIN_EVENTS_URL = 'https://juejin.cn/events'

const EXTRACT_PROMPT = `从以下 HTML 文本中提取 AI 相关的线下活动信息。
只提取与 AI、人工智能、大模型、机器学习相关的活动。
以 JSON 数组格式输出：
[{
  "title": "活动标题",
  "date": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD 或 null",
  "city": "城市",
  "address": "地址",
  "url": "活动链接",
  "tags": ["标签"]
}]
只输出 JSON，不要其他内容。如果没有 AI 相关活动，输出空数组 []。`

/** 执行掘金爬虫 */
export async function crawlJuejin(env: Env): Promise<number> {
  let imported = 0

  try {
    const resp = await fetch(JUEJIN_EVENTS_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; haodianai-bot/1.0)',
      },
    })

    if (!resp.ok) {
      console.error(`掘金请求失败: ${resp.status}`)
      return 0
    }

    const html = await resp.text()
    // 截取前 8000 字符避免超出 token 限制
    const truncated = html.slice(0, 8000)

    const raw = await chatCompletion(env, [
      { role: 'system', content: EXTRACT_PROMPT },
      { role: 'user', content: truncated },
    ], { maxTokens: 3000 })

    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const events = JSON.parse(cleaned) as Array<{
      title: string
      date: string
      endDate?: string
      city: string
      address?: string
      url?: string
      tags?: string[]
    }>

    for (const evt of events) {
      const sourceUrl = evt.url || `${JUEJIN_EVENTS_URL}#${evt.title}`
      if (await existsBySourceUrl(env.DB, sourceUrl)) continue

      const input: EventInput = {
        title: evt.title,
        date: evt.date,
        endDate: evt.endDate,
        city: evt.city || '待确认',
        address: evt.address,
        source: '掘金',
        sourcePlatform: 'juejin',
        sourceUrl,
        category: 'meetup',
        tags: evt.tags || ['AI'],
      }

      // 地理编码
      if (input.address) {
        const geo = await geocodeAddress(env, input.address)
        if (geo) {
          input.lng = geo.lng
          input.lat = geo.lat
          if (!input.city || input.city === '待确认') input.city = geo.city
        }
      }

      const id = await insertEvent(env.DB, input, 'pending')
      await insertAuditLog(env.DB, {
        eventId: id,
        action: 'crawl',
        actor: 'juejin-crawler',
        newStatus: 'pending',
      })
      imported++
    }
  } catch (e) {
    console.error('掘金爬取失败:', e)
  }

  return imported
}
