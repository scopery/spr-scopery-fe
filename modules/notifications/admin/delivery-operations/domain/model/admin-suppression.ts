export interface AdminSuppression {
  id: string
  userId: string
  channel: string
  category: string | null
  reason: string
  source: string
  suppressedAt: string
  expiresAt: string | null
}
