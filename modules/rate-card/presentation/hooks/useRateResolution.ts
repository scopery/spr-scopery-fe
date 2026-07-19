'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as resolutionApi from '../../infrastructure/api/resolution.api'
import type {
  PreviewTaskRatePayload,
  RateSnapshot,
  ResolveRatePayload,
  TaskRatePreview,
} from '../../domain/model/rate-resolution'

/** Rate resolution + task cost preview diagnostics. */
export function useRateResolution() {
  const [result, setResult] = useState<RateSnapshot | null>(null)
  const [preview, setPreview] = useState<TaskRatePreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resolve = useCallback(async (payload: ResolveRatePayload) => {
    setLoading(true)
    setError(null)
    try {
      const snapshot = await resolutionApi.resolveRate(payload)
      setResult(snapshot)
      setPreview(null)
      toast.success('Rate resolved')
      return snapshot
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resolve rate'
      setError(msg)
      toast.error(getProblemToastMessage(err))
      setResult(null)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const previewTask = useCallback(async (payload: PreviewTaskRatePayload) => {
    setLoading(true)
    setError(null)
    try {
      const next = await resolutionApi.previewTaskRate(payload)
      setPreview(next)
      setResult(null)
      toast.success('Task cost preview ready')
      return next
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to preview task rate'
      setError(msg)
      toast.error(getProblemToastMessage(err))
      setPreview(null)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setPreview(null)
    setError(null)
  }, [])

  return { result, preview, loading, error, resolve, previewTask, reset }
}
