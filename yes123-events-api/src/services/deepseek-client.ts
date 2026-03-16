// DeepSeek / 硅基流动 API 客户端

import type { Env } from '../env'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatResponse {
  choices: Array<{
    message: { content: string }
  }>
}

export async function chatCompletion(
  env: Env,
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number },
): Promise<string> {
  const response = await fetch(`${env.DEEPSEEK_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: env.DEEPSEEK_MODEL,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 2000,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`DeepSeek API 错误 ${response.status}: ${text}`)
  }

  const data = (await response.json()) as ChatResponse
  return data.choices[0]?.message?.content || ''
}
