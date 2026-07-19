'use client'

import { useCallback, useState } from 'react'
import * as reviewsApi from '../../infrastructure/api/reviews.api'
import type { DeliverableReview } from '../../domain/model/review'
import { ApiError } from '@/shared/lib/api-types'

export function useDeliverableReview(
  projectId: string | null,
  deliverableId: string | null
) {
  const [review, setReview] = useState<DeliverableReview | null>(null)
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const submit = useCallback(
    async (comment?: string) => {
      if (!projectId || !deliverableId) return
      setActing(true)
      setError(null)
      try {
        const result = await reviewsApi.submitDeliverableForReview(projectId, deliverableId, { comment })
        setReview(result)
        return result
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true)
        }
        setError(err instanceof Error ? err.message : 'Failed to submit for review')
        throw err
      } finally {
        setActing(false)
      }
    },
    [projectId, deliverableId]
  )

  const approve = useCallback(
    async (reviewId: string, comment?: string) => {
      if (!projectId) return
      setActing(true)
      setError(null)
      try {
        const result = await reviewsApi.approveReview(projectId, reviewId, { comment })
        setReview(result)
        return result
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true)
        }
        setError(err instanceof Error ? err.message : 'Failed to approve review')
        throw err
      } finally {
        setActing(false)
      }
    },
    [projectId]
  )

  const reject = useCallback(
    async (reviewId: string, comment?: string) => {
      if (!projectId) return
      setActing(true)
      setError(null)
      try {
        const result = await reviewsApi.rejectReview(projectId, reviewId, { comment })
        setReview(result)
        return result
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true)
        }
        setError(err instanceof Error ? err.message : 'Failed to reject review')
        throw err
      } finally {
        setActing(false)
      }
    },
    [projectId]
  )

  const requestRework = useCallback(
    async (reviewId: string, comment?: string) => {
      if (!projectId) return
      setActing(true)
      setError(null)
      try {
        const result = await reviewsApi.requestRework(projectId, reviewId, { comment })
        setReview(result)
        return result
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true)
        }
        setError(err instanceof Error ? err.message : 'Failed to request rework')
        throw err
      } finally {
        setActing(false)
      }
    },
    [projectId]
  )

  return {
    review,
    loading,
    acting,
    error,
    forbidden,
    submit,
    approve,
    reject,
    requestRework,
  }
}
