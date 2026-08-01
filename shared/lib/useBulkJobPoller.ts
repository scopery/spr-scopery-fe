'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  bulkJobProgressPercent,
  pollBulkJobUntilDone,
  type BulkJobResponse,
} from './bulkJobs'

export type UseBulkJobPollerResult = {
  job: BulkJobResponse | null
  percent: number
  isPolling: boolean
  error: string | null
  /**
   * Poll until terminal. Pass `seed` from the 202 Accepted body so the progress
   * panel paints immediately (QUEUED) without waiting for the first poll tick.
   */
  start: (jobId: string, seed?: BulkJobResponse) => Promise<BulkJobResponse>
  cancel: () => void
  reset: () => void
}

/**
 * React wrapper around pollBulkJobUntilDone — cancels on unmount.
 */
export function useBulkJobPoller(): UseBulkJobPollerResult {
  const [job, setJob] = useState<BulkJobResponse | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsPolling(false)
  }, [])

  const reset = useCallback(() => {
    cancel()
    setJob(null)
    setError(null)
  }, [cancel])

  useEffect(() => () => abortRef.current?.abort(), [])

  const start = useCallback(async (jobId: string, seed?: BulkJobResponse) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsPolling(true)
    setError(null)
    if (seed) setJob(seed)

    try {
      const done = await pollBulkJobUntilDone(jobId, {
        signal: controller.signal,
        onProgress: setJob,
      })
      setJob(done)
      return done
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw err
      }
      const message = err instanceof Error ? err.message : 'Bulk job failed'
      setError(message)
      throw err
    } finally {
      if (abortRef.current === controller) abortRef.current = null
      setIsPolling(false)
    }
  }, [])

  return {
    job,
    percent: job ? bulkJobProgressPercent(job) : 0,
    isPolling,
    error,
    start,
    cancel,
    reset,
  }
}
