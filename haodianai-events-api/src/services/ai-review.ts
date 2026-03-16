// AI 审核服务 — 判断投稿是否为合法 AI 活动

import type { Env } from '../env'
import type { AIReviewResult, EventInput } from '../types'
import { chatCompletion } from './deepseek-client'

const REVIEW_SYSTEM_PROMPT = `你是一个 AI 活动审核助手。用户会提交一个活动信息，你需要判断它是否是一个合法的、与 AI/人工智能相关的线下活动。

审核标准：
1. 必须是真实的线下活动（会议、沙龙、Meetup、展览等），不接受纯线上活动
2. 必须与 AI、人工智能、大模型、机器学习等科技话题相关
3. 标题和描述不含广告、垃圾信息或违规内容
4. 日期和城市信息基本合理

你必须以 JSON 格式输出：
{
  "status": "approved" | "pending" | "rejected",
  "reason": "简要说明审核理由",
  "confidence": 0.0 到 1.0 之间的置信度
}

规则：
- confidence >= 0.8 且内容明确合规 → approved（自动上线）
- confidence >= 0.5 但存在疑虑 → pending（需人工审核）
- confidence < 0.5 或明显不合规 → rejected
- 只输出 JSON，不要输出其他内容`

export async function reviewEvent(env: Env, input: EventInput): Promise<AIReviewResult> {
  const userMessage = `请审核以下活动投稿：

标题：${input.title}
日期：${input.date}${input.endDate ? ` 至 ${input.endDate}` : ''}
城市：${input.city}
地址：${input.address || '未填写'}
类别：${input.category || '未分类'}
标签：${(input.tags || []).join('、') || '无'}
主办方：${input.organizer || '未填写'}
主题：${input.theme || '未填写'}
是否免费：${input.free ? '是' : '否'}
链接：${input.url || '无'}`

  try {
    const raw = await chatCompletion(env, [
      { role: 'system', content: REVIEW_SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ])

    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const result = JSON.parse(cleaned) as AIReviewResult

    // 安全校验：确保 status 值合法
    if (!['approved', 'pending', 'rejected'].includes(result.status)) {
      result.status = 'pending'
    }
    result.confidence = Math.max(0, Math.min(1, result.confidence || 0.5))

    return result
  } catch (e) {
    console.error('AI 审核失败:', e)
    // AI 审核失败时默认待审
    return { status: 'pending', reason: 'AI 审核服务异常，转人工审核', confidence: 0 }
  }
}
