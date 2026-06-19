'use client'

import { useState, useCallback } from 'react'
import { getProblemToastMessage, isConflictCode } from '@/shared/lib/errorHandling'
import { toast } from 'sonner'
import * as aiQuestionsApi from '../api/ai-questions.api'
import type { QuestionsCommitBody, QuestionsGenerateBody } from '../model/ai-questions'

export function useQuestionsGenerate() {
  const [loading, setLoading] = useState(false)
  const mutateAsync = useCallback(
    async (orgId: string, projectId: string, body: QuestionsGenerateBody) => {
      setLoading(true)
      try {
        return await aiQuestionsApi.questionsGenerate(orgId, projectId, body)
      } catch (err) {
        if (isConflictCode(err, 'AI_BATCH_EXPIRED')) toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )
  return { mutateAsync, isPending: loading }
}

export function useQuestionsCommit() {
  const [loading, setLoading] = useState(false)
  const mutateAsync = useCallback(
    async (
      orgId: string,
      projectId: string,
      body: QuestionsCommitBody,
      options?: { onSuccess?: () => void }
    ) => {
      setLoading(true)
      try {
        await aiQuestionsApi.questionsCommit(orgId, projectId, body)
        options?.onSuccess?.()
      } catch (err) {
        if (isConflictCode(err, 'AI_BATCH_EXPIRED')) toast.error(getProblemToastMessage(err))
        else toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setLoading(false)
      }
    },
    []
  )
  return { mutateAsync, isPending: loading }
}
