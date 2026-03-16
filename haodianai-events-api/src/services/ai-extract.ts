// AI 提取服务 — 从小红书笔记/文本中提取结构化活动信息

import type { Env } from '../env'
import type { AIExtractResult, EventInput } from '../types'
import { chatCompletion } from './deepseek-client'

const EXTRACT_SYSTEM_PROMPT = `你是一个活动信息提取助手。用户会粘贴一段小红书笔记或其他文本，你需要从中提取 AI 相关的线下活动信息。

提取要求：
1. 尽可能提取标题、日期、城市、地址、主办方、主题、标签等信息
2. 日期格式统一为 YYYY-MM-DD
3. 如果有多个活动，全部提取
4. 无法确定的字段留空

你必须以 JSON 格式输出：
{
  "events": [
    {
      "title": "活动标题",
      "date": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD 或 null",
      "city": "城市名",
      "address": "详细地址",
      "category": "conference | meetup | salon | workshop | hackathon",
      "tags": ["标签1", "标签2"],
      "organizer": "主办方",
      "theme": "活动主题",
      "free": true/false,
      "url": "报名链接（如有）"
    }
  ]
}

只输出 JSON，不要输出其他内容。`

export async function extractEvents(env: Env, text: string): Promise<AIExtractResult> {
  const userMessage = `请从以下文本中提取 AI 活动信息：

${text}`

  try {
    const raw = await chatCompletion(env, [
      { role: 'system', content: EXTRACT_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ], { maxTokens: 4000 })

    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleaned) as { events: EventInput[] }

    return {
      events: result.events || [],
      raw_response: raw,
    }
  } catch (e) {
    console.error('AI 提取失败:', e)
    return { events: [], raw_response: `提取失败: ${e}` }
  }
}
