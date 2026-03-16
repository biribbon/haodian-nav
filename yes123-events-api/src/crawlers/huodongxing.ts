// 活动行爬虫 — fetch + HTMLRewriter 提取 AI 相关活动

import type { Env } from '../env'
import type { EventInput } from '../types'
import { existsBySourceUrl, insertEvent, insertAuditLog } from '../services/event-store'
import { geocodeAddress } from './scheduler'

const HDX_SEARCH_URL = 'https://www.huodongxing.com/eventlist?city=全国&tag=人工智能'

interface ParsedEvent {
  title: string
  date: string
  city: string
  url: string
}

/** 从活动行页面提取活动列表 */
async function fetchHuodongxingList(): Promise<ParsedEvent[]> {
  const events: ParsedEvent[] = []

  try {
    const resp = await fetch(HDX_SEARCH_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; yes123-bot/1.0)',
      },
    })

    if (!resp.ok) {
      console.error(`活动行请求失败: ${resp.status}`)
      return events
    }

    const html = await resp.text()

    // 简单正则提取（Workers 中 HTMLRewriter 仅支持 Response 流式处理）
    const itemRegex = /<a[^>]*href="(\/event\/\d+)"[^>]*>[\s\S]*?<[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/[^>]*>/gi
    let match: RegExpExecArray | null

    while ((match = itemRegex.exec(html)) !== null) {
      const url = `https://www.huodongxing.com${match[1]}`
      const title = match[2].replace(/<[^>]+>/g, '').trim()

      if (title && title.length > 5) {
        events.push({ title, date: '', city: '', url })
      }
    }
  } catch (e) {
    console.error('活动行爬取失败:', e)
  }

  return events.slice(0, 10) // 每次最多处理 10 条
}

/** 执行活动行爬虫 */
export async function crawlHuodongxing(env: Env): Promise<number> {
  const rawEvents = await fetchHuodongxingList()
  let imported = 0

  for (const raw of rawEvents) {
    // 去重
    if (await existsBySourceUrl(env.DB, raw.url)) continue

    const input: EventInput = {
      title: raw.title,
      date: raw.date || new Date().toISOString().slice(0, 10),
      city: raw.city || '待确认',
      source: '活动行',
      sourcePlatform: 'huodongxing',
      sourceUrl: raw.url,
      category: 'conference',
      tags: ['AI'],
    }

    // 尝试地理编码
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
      actor: 'huodongxing-crawler',
      newStatus: 'pending',
    })
    imported++
  }

  return imported
}
