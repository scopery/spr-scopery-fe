export interface IntegrationConnection {
  id: string
  name: string
  provider: string
  status: string
}

export interface ImportJob {
  id: string
  name: string
  status: string
  successCount?: number
  failureCount?: number
}
