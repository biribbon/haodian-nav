// haodianai-events-api 入口 — 路由分发 + scheduled handler

import type { Env } from './env'
import { handleCORS } from './utils/cors'
import { error } from './utils/response'
import { handleGetEvents } from './routes/events'
import { handleSubmit } from './routes/submit'
import { handleExtract } from './routes/extract'
import { handleHealth } from './routes/health'
import {
  handleAdminGetEvents,
  handleAdminUpdateEvent,
  handleAdminDeleteEvent,
  handleAdminReview,
  handleAdminBatch,
} from './routes/admin'
import { runScheduledCrawl, runCleanup } from './crawlers/scheduler'
import ADMIN_HTML from '../admin/index.html'

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS 预检
    const corsResponse = handleCORS(request)
    if (corsResponse) return corsResponse

    const url = new URL(request.url)
    const path = url.pathname
    const method = request.method

    try {
      // ---- 公开路由 ----
      if (path === '/api/health' && method === 'GET') {
        return handleHealth(request)
      }
      if (path === '/api/events' && method === 'GET') {
        return handleGetEvents(request, env)
      }
      if (path === '/api/events/submit' && method === 'POST') {
        return handleSubmit(request, env)
      }

      // ---- 管理路由 ----
      if (path === '/api/admin/events' && method === 'GET') {
        return handleAdminGetEvents(request, env)
      }
      if (path === '/api/admin/events/batch' && method === 'POST') {
        return handleAdminBatch(request, env)
      }
      if (path === '/api/admin/extract' && method === 'POST') {
        return handleExtract(request, env)
      }

      // /api/admin/events/:id 系列
      const adminEventMatch = path.match(/^\/api\/admin\/events\/([^/]+)$/)
      if (adminEventMatch) {
        const id = adminEventMatch[1]
        if (method === 'PUT') return handleAdminUpdateEvent(request, env, id)
        if (method === 'DELETE') return handleAdminDeleteEvent(request, env, id)
      }

      // /api/admin/events/:id/review
      const reviewMatch = path.match(/^\/api\/admin\/events\/([^/]+)\/review$/)
      if (reviewMatch && method === 'POST') {
        return handleAdminReview(request, env, reviewMatch[1])
      }

      // ---- 管理后台静态页面 ----
      if (path === '/admin' || path === '/admin/') {
        return new Response(ADMIN_HTML, {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        })
      }

      return error('Not Found', 404, request.headers.get('Origin'))
    } catch (e) {
      console.error('请求处理异常:', e)
      return error('Internal Server Error', 500, request.headers.get('Origin'))
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    if (event.cron === '0 18 * * *') {
      ctx.waitUntil(runCleanup(env))
    } else {
      ctx.waitUntil(runScheduledCrawl(env))
    }
  },
}
