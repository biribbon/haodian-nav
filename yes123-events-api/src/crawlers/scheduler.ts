// 爬虫调度器 + 高德地理编码

import type { Env } from '../env'
import { crawlHuodongxing } from './huodongxing'
import { crawlJuejin } from './juejin'

interface GeocodeResult {
  lng: number
  lat: number
  city: string
}

/** 高德地理编码 — 地址 → 经纬度 */
export async function geocodeAddress(env: Env, address: string): Promise<GeocodeResult | null> {
  try {
    const url = `https://restapi.amap.com/v3/geocode/geo?key=${env.AMAP_KEY}&address=${encodeURIComponent(address)}`
    const resp = await fetch(url)
    const data = (await resp.json()) as {
      status: string
      geocodes: Array<{
        location: string
        city: string | string[]
      }>
    }

    if (data.status === '1' && data.geocodes?.length > 0) {
      const [lng, lat] = data.geocodes[0].location.split(',').map(Number)
      const city = Array.isArray(data.geocodes[0].city)
        ? data.geocodes[0].city[0]
        : data.geocodes[0].city

      return { lng, lat, city: city || '' }
    }
  } catch (e) {
    console.error('高德地理编码失败:', e)
  }
  return null
}

/** 定时爬虫入口 — Cron 触发 */
export async function runScheduledCrawl(env: Env): Promise<void> {
  console.log('[Scheduler] 开始定时爬虫任务')

  const hdxCount = await crawlHuodongxing(env)
  console.log(`[Scheduler] 活动行爬取完成，新增 ${hdxCount} 条`)

  const jjCount = await crawlJuejin(env)
  console.log(`[Scheduler] 掘金爬取完成，新增 ${jjCount} 条`)

  console.log(`[Scheduler] 爬虫任务完成，共新增 ${hdxCount + jjCount} 条`)
}
