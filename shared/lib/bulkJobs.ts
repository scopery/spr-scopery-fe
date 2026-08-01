import { apiPath } from './api-paths'
import { apiClient } from './apiClient'

export const BulkJobStatus = {
  Queued: 'QUEUED',
  Running: 'RUNNING',
  Succeeded: 'SUCCEEDED',
  Partial: 'PARTIAL',
  Failed: 'FAILED',
} as const
export type BulkJobStatus = (typeof BulkJobStatus)[keyof typeof BulkJobStatus]

/** Matches OpenAPI BulkJobFailure.errorCode enum. */
export const BulkJobErrorCode = {
  DuplicateKey: 'DUPLICATE_KEY',
  NotFound: 'NOT_FOUND',
  Validation: 'VALIDATION',
  Forbidden: 'FORBIDDEN',
  Unknown: 'UNKNOWN',
} as const
export type BulkJobErrorCode = (typeof BulkJobErrorCode)[keyof typeof BulkJobErrorCode]

/** Matches OpenAPI schema BulkJobFailure. */
export interface BulkJobFailure {
  /** 0-based index in the original request items array. */
  index: number
  /** Best-effort business identity (key, code, or title). */
  identity: string | null
  errorCode: BulkJobErrorCode | string | null
  /** Human-readable failure reason (truncated to 500 chars on BE). */
  message: string
  /** Original item payload — re-submittable to the same POST …/bulk. */
  item: Record<string, unknown>
}

export interface BulkJobResponse {
  id: string
  jobType: string
  status: BulkJobStatus | string
  totalItems: number
  succeededItems: number
  failedItems: number
  resultSummary: string | null
  errorMessage: string | null
  /** Per-item failures — empty on SUCCEEDED; growing during RUNNING; complete on PARTIAL/FAILED. */
  failures?: BulkJobFailure[] | null
  createdAt: string
  updatedAt: string
}

const TERMINAL_STATUSES = new Set<string>([
  BulkJobStatus.Succeeded,
  BulkJobStatus.Partial,
  BulkJobStatus.Failed,
])

export const BULK_MAX_ITEMS = 500
/** At or above this count, use POST /bulk + poll; below uses sync /batch. */
export const BULK_ASYNC_THRESHOLD = 50
export const BULK_POLL_INTERVAL_MS = 2500
export const BULK_POLL_TIMEOUT_MS = 10 * 60 * 1000

export function isBulkJobTerminal(status: string): boolean {
  return TERMINAL_STATUSES.has(status)
}

export function bulkJobProgressPercent(job: Pick<
  BulkJobResponse,
  'succeededItems' | 'failedItems' | 'totalItems'
>): number {
  if (!job.totalItems || job.totalItems <= 0) return 0
  return Math.round(((job.succeededItems + job.failedItems) / job.totalItems) * 100)
}

/** Drop null/undefined keys so clipboard JSON is clean for agent fix / re-import. */
export function stripNullishDeep<T>(value: T): T {
  if (value === null || value === undefined) return value
  if (Array.isArray(value)) {
    return value.map((v) => stripNullishDeep(v)) as T
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === null || v === undefined) continue
      out[k] = stripNullishDeep(v)
    }
    return out as T
  }
  return value
}

export function getBulkJobFailures(job: BulkJobResponse | null | undefined): BulkJobFailure[] {
  return Array.isArray(job?.failures) ? job.failures : []
}

/**
 * Clipboard / re-import payload: only failed item bodies.
 * Shape matches JSON Import: `{ "items": [ ... ] }`.
 */
export function buildFailedItemsImportPayload(job: BulkJobResponse): {
  items: Record<string, unknown>[]
} {
  const items = getBulkJobFailures(job)
    .map((f) => stripNullishDeep(f.item))
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
  return { items }
}

/** Human-readable failure report for copy (agent / debugging). */
export function formatBulkJobFailuresReport(job: BulkJobResponse): string {
  const failures = getBulkJobFailures(job)
  if (failures.length === 0) {
    return job.errorMessage?.trim() || job.resultSummary?.trim() || 'No per-item failures.'
  }
  const lines = failures.map((f) => {
    const id = f.identity?.trim() || `#${f.index}`
    const code = f.errorCode?.trim() || 'UNKNOWN'
    return `[${f.index}] ${id} · ${code}\n  ${f.message}`
  })
  return [
    `Job ${job.id} · ${job.status}`,
    job.resultSummary ? `Summary: ${job.resultSummary}` : null,
    `${failures.length} failed item${failures.length === 1 ? '' : 's'}:`,
    '',
    ...lines,
  ]
    .filter((l) => l != null)
    .join('\n')
}

export function getBulkJob(jobId: string): Promise<BulkJobResponse> {
  // Polling must not drive the global top loading bar — progress UI owns feedback.
  return apiClient.get<BulkJobResponse>(apiPath(`/bulk-jobs/${jobId}`), {
    skipGlobalLoading: true,
  })
}

export type PollBulkJobOptions = {
  intervalMs?: number
  timeoutMs?: number
  onProgress?: (job: BulkJobResponse) => void
  signal?: AbortSignal
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('Aborted', 'AbortError'))
      return
    }
    const timer = setTimeout(resolve, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/**
 * Poll GET /api/bulk-jobs/{jobId} until SUCCEEDED | PARTIAL | FAILED.
 * Defaults: 2.5s interval, 10 minute timeout (BE bulk-job guide).
 */
export async function pollBulkJobUntilDone(
  jobId: string,
  {
    intervalMs = BULK_POLL_INTERVAL_MS,
    timeoutMs = BULK_POLL_TIMEOUT_MS,
    onProgress,
    signal,
  }: PollBulkJobOptions = {}
): Promise<BulkJobResponse> {
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

    const job = await getBulkJob(jobId)
    onProgress?.(job)

    if (isBulkJobTerminal(job.status)) return job

    await sleep(intervalMs, signal)
  }

  throw new Error('Bulk job timed out after 10 minutes')
}

export function assertBulkItemCount(count: number): void {
  if (count < 1) throw new Error('At least one item is required')
  if (count > BULK_MAX_ITEMS) {
    throw new Error(`Maximum ${BULK_MAX_ITEMS} items per bulk request`)
  }
}
