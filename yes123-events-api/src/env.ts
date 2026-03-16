// Cloudflare Workers 环境变量接口

export interface Env {
  DB: D1Database
  DEEPSEEK_API_KEY: string
  DEEPSEEK_BASE_URL: string
  DEEPSEEK_MODEL: string
  ADMIN_API_KEY: string
  AMAP_KEY: string
}
