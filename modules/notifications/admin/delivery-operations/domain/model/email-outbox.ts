export interface EmailOutbox {
  id: string
  deliveryId: string
  provider: string
  status: string
  retryCount: number
  failureReason: string | null
  scheduledAt: string
  sentAt: string | null
}
