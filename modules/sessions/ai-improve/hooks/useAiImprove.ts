'use client'

import { useState, useCallback } from 'react'
import { getProblemToastMessage, isConflictCode } from '@/shared/lib/errorHandling'
import { getProblemCode, isProblem } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import * as aiImproveApi from '../api/ai-improve.api'
import type { ImproveCommitBody } from '../model/ai-improve'

export function useImproveAnswer() {
  const [loading, setLoading] = useState(false)
  const mutateAsync = useCallback(
    async (
      orgId: string,
      projectId: string,
      sessionId: string,
      body: {
        question_id: string
        current_value?: string | Record<string, unknown> | null
        user_instruction?: string
      }
    ) => {
      setLoading(true)
      try {
        return await aiImproveApi.improveAnswer(orgId, projectId, sessionId, body)
      } finally {
        setLoading(false)
      }
    },
    []
  )
  return { mutateAsync, isPending: loading }
}

export function useImproveCommit() {
  const [loading, setLoading] = useState(false)
  const mutateAsync = useCallback(
    async (
      orgId: string,
      projectId: string,
      sessionId: string,
      body: ImproveCommitBody,
      options?: { onSuccess?: () => void }
    ) => {
      setLoading(true)
      try {
        await aiImproveApi.improveCommit(orgId, projectId, sessionId, body)
        options?.onSuccess?.()
      } catch (err) {
        if (isConflictCode(err, 'SESSION_LOCKED')) {
          toast.error(getProblemToastMessage(err))
          options?.onSuccess?.()
        } else if (isConflictCode(err, 'AI_BATCH_EXPIRED')) {
          toast.error(getProblemToastMessage(err))
        } else if (
          isProblem(err) &&
          err.status === 502 &&
          getProblemCode(err) === 'AI_BAD_OUTPUT'
        ) {
          toast.error(getProblemToastMessage(err))
        } else {
          toast.error(getProblemToastMessage(err))
        }
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )
  return { mutateAsync, isPending: loading }
}
