// 活动行爬虫 — 列表页提取链接 → 详情页 DeepSeek 结构化提取

import type { Env } from '../env'
import type { EventInput } from '../types'
import { existsBySourceUrl, insertEvent, insertAuditLog } from '../services/event-store'
import { chatCompletion } from '../services/deepseek-client'
import { geocodeAddress } from './scheduler'

const HDX_LIST_URL =
  'https://www.huodongxing.com/events?tag=人工智能&city=全国&orderby=n'

const MAX_DETAIL_PAGES = 8

const DETAIL_EXTRACT_PROMPT = `从以下活动页面 HTML 中提取 AI/人工智能相关活动信息。
返回 JSON 格式（注意必须是合法 JSON）：
{
  "title": "活动标题",
  "date": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD 或 null",
  "city": "城市名（如 上海、北京）",
  "address": "详细地址",
  "category": "conference | salon | hackathon | meetup",
  "organizer": "主办方",
  "theme": "活动主题摘要（一句话）",
  "free": true或false,
  "tags": ["标签1", "标签2"]
}
如果页面内容不是 AI 相关活动，返回 null。
只输出 JSON 或 null，不要其他内容。`

interface DetailResult {
  title: string
  date: string
  endDate?: string | null
  city: string
  address?: string
  category?: string
  organizer?: string
  theme?: string
  free?: boolean
  tags?: string[]
}

/** 从列表页 HTML 提取详情页链接 */
async function fetchEventLinks(): Promise<string[]> {
  try {
    const resp = await fetch(HDX_LIST_URL, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; haodianai-bot/1.0)' },
    })
    if (!resp.ok) {
      console.error(`[活动行] 列表页请求失败: ${resp.status}`)
      return []
    }

    const html = await resp.text()
    const links: string[] = []
    const seen = new Set<string>()

    // 匹配 /event/数字 格式的链接
    const regex = /\/event\/(\d+)/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(html)) !== null) {
      const eventId = match[1]
      if (!seen.has(eventId)) {
        seen.add(eventId)
        links.push(`https://www.huodongxing.com/event/${eventId}`)
      }
    }

    return links.slice(0, MAX_DETAIL_PAGES)
  } catch (e) {
    console.error('[活动行] 列表页爬取失败:', e)
    return []
  }
}

/** 从详情页提取结构化信息 */
async function extractDetailPage(
  env: Env,
  url: string,
): Promise<DetailResult | null> {
  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; haodianai-bot/1.0)' },
    })
    if (!resp.ok) return null

    const html = await resp.text()
    // 截取前 6000 字符，控制 token 用量
    const truncated = html.slice(0, 6000)

    const raw = await chatCompletion(
      env,
      [
        { role: 'system', content: DETAIL_EXTRACT_PROMPT },
        { role: 'user', content: truncated },
      ],
      { maxTokens: 1500 },
    )

    const cleaned = raw
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    if (cleaned === 'null' || !cleaned) return null

    return JSON.parse(cleaned) as DetailResult
  } catch (e) {
    console.error(`[活动行] 详情页提取失败 ${url}:`, e)
    return null
  }
}

/** 执行活动行爬虫 */
export async function crawlHuodongxing(env: Env): Promise<number> {
  const links = await fetchEventLinks()
  let imported = 0

  for (const url of links) {
    // 去重
    if (await existsBySourceUrl(env.DB, url)) continue

    const detail = await extractDetailPage(env, url)
    if (!detail) continue

    const input: EventInput = {
      title: detail.title,
      date: detail.date,
      endDate: detail.endDate || undefined,
      city: detail.city || '待确认',
      address: detail.address,
      source: '活动行',
      sourcePlatform: 'huodongxing',
      sourceUrl: url,
      url,
      category: detail.category || 'conference',
      organizer: detail.organizer,
      theme: detail.theme,
      free: detail.free,
      tags: detail.tags || ['AI'],
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

    const id = await insertEvent(env.DB, input, 'approved')
    await insertAuditLog(env.DB, {
      eventId: id,
      action: 'crawl',
      actor: 'huodongxing-crawler',
      newStatus: 'approved',
    })
    imported++
  }

  return imported
}
