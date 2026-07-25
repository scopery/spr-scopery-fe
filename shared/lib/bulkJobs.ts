import { apiPath } from './api-paths'
import { apiClient } from './apiClient'

export interface BulkJobResponse {
  id: string
  jobType: string
  status: string
  totalItems: number
  succeededItems: number
  failedItems: number
  resultSummary: string | null
  errorMessage: string | null
  createdAt: string
  updatedAt: string
}

const TERMINAL_STATUSES = new Set(['SUCCEEDED', 'PARTIAL', 'FAILED'])

export function getBulkJob(jobId: string): Promise<BulkJobResponse> {
  return apiClient.get<BulkJobResponse>(apiPath(`/bulk-jobs/${jobId}`))
}

export async function pollBulkJobUntilDone(
  jobId: string,
  { intervalMs = 2000, maxAttempts = 60 }: { intervalMs?: number; maxAttempts?: number } = {}
): Promise<BulkJobResponse> {
  for (let i = 0; i < maxAttempts; i++) {
    const job = await getBulkJob(jobId)
    if (TERMINAL_STATUSES.has(job.status)) return job
    await new Promise<void>((r) => setTimeout(r, intervalMs))
  }
  throw new Error('Bulk job timed out after 2 minutes')
}
