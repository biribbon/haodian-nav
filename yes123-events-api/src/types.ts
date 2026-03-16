// 活动数据类型定义

export interface EventRecord {
  id: string
  title: string
  date: string
  end_date: string | null
  city: string
  address: string | null
  lng: number | null
  lat: number | null
  category: string
  tags: string  // JSON string
  url: string
  source: string
  source_platform: string
  source_url: string
  organizer: string
  theme: string
  free: number  // 0 or 1 in D1
  status: 'approved' | 'pending' | 'rejected'
  created_at: string
  updated_at: string
}

export interface EventInput {
  title: string
  date: string
  endDate?: string
  city: string
  address?: string
  lng?: number
  lat?: number
  category?: string
  tags?: string[]
  url?: string
  source?: string
  sourcePlatform?: string
  sourceUrl?: string
  organizer?: string
  theme?: string
  free?: boolean
}

export interface EventOutput {
  id: string
  title: string
  date: string
  endDate: string | null
  city: string
  address: string | null
  lng: number | null
  lat: number | null
  category: string
  tags: string[]
  url: string
  source: string
  organizer: string
  theme: string
  free: boolean
  status: string
}

export interface AuditLogRecord {
  id: number
  event_id: string
  action: string
  actor: string
  old_status: string | null
  new_status: string | null
  ai_reason: string | null
  ai_confidence: number | null
  raw_input: string | null
  ip_address: string | null
  created_at: string
}

export interface AIReviewResult {
  status: 'approved' | 'pending' | 'rejected'
  reason: string
  confidence: number
}

export interface AIExtractResult {
  events: EventInput[]
  raw_response: string
}

export interface EventQuery {
  city?: string
  date_from?: string
  date_to?: string
  category?: string
  status?: string
  page?: number
  limit?: number
}
