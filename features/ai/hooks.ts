/**
 * AI mutations. Caller passes onSuccess to refetch (e.g. loadSession, loadData).
 * Query keys exported for future React Query adoption.
 */

import { useState, useCallback } from 'react'
import { getProblemToastMessage, isConflictCode } from '@/shared/lib/errorHandling'
import { getProblemCode, isProblem } from '@/types/api'
import { toast } from 'sonner'
import * as aiApi from './api'
import type {
  ImproveCommitBody,
  QuestionsGenerateBody,
  QuestionsCommitBody,
  IntakesCreateBody,
  ImpactAnalysisBody,
  ImpactCommitBody,
} from './schemas'

export { aiQueryKeys } from './queryKeys'

export function useImproveAnswer() {
  const [loading, setLoading] = useState(false)
  const mutateAsync = useCallback(
    async (
      orgId: string,
      projectId: string,
      sessionId: string,
      body: { question_id: string; current_value?: string | Record<string, unknown> | null; user_instruction?: string }
    ) => {
      setLoading(true)
      try {
        return await aiApi.improveAnswer(orgId, projectId, sessionId, body)
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
        await aiApi.improveCommit(orgId, projectId, sessionId, body)
        options?.onSuccess?.()
      } catch (err) {
        if (isConflictCode(err, 'SESSION_LOCKED')) {
          toast.error(getProblemToastMessage(err))
          options?.onSuccess?.()
        } else if (isConflictCode(err, 'AI_BATCH_EXPIRED')) {
          toast.error(getProblemToastMessage(err))
        } else if (isProblem(err) && err.status === 502 && getProblemCode(err) === 'AI_BAD_OUTPUT') {
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

export function useQuestionsGenerate() {
  const [loading, setLoading] = useState(false)
  const mutateAsync = useCallback(
    async (
      orgId: string,
      projectId: string,
      body: QuestionsGenerateBody
    ) => {
      setLoading(true)
      try {
        return await aiApi.questionsGenerate(orgId, projectId, body)
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
        await aiApi.questionsCommit(orgId, projectId, body)
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

export function useIntakesUploadUrl() {
  const [loading, setLoading] = useState(false)
  const mutateAsync = useCallback(
    async (
      orgId: string,
      projectId: string,
      body: { file_name: string; mime_type: string }
    ) => {
      setLoading(true)
      try {
        return await aiApi.getIntakesUploadUrl(orgId, projectId, body)
      } finally {
        setLoading(false)
      }
    },
    []
  )
  return { mutateAsync, isPending: loading }
}

export function useCreateIntake() {
  const [loading, setLoading] = useState(false)
  const mutateAsync = useCallback(
    async (
      orgId: string,
      projectId: string,
      body: IntakesCreateBody
    ) => {
      setLoading(true)
      try {
        return await aiApi.createIntake(orgId, projectId, body)
      } finally {
        setLoading(false)
      }
    },
    []
  )
  return { mutateAsync, isPending: loading }
}

export function useImpactAnalysis() {
  const [loading, setLoading] = useState(false)
  const mutateAsync = useCallback(
    async (
      orgId: string,
      projectId: string,
      body: ImpactAnalysisBody
    ) => {
      setLoading(true)
      try {
        return await aiApi.runImpactAnalysis(orgId, projectId, body)
      } catch (err) {
        if (isConflictCode(err, 'AI_BATCH_EXPIRED')) toast.error(getProblemToastMessage(err))
        else if (isProblem(err) && err.status === 502 && getProblemCode(err) === 'AI_BAD_OUTPUT') {
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

export function useImpactAnalysisCommit() {
  const [loading, setLoading] = useState(false)
  const mutateAsync = useCallback(
    async (
      orgId: string,
      projectId: string,
      body: ImpactCommitBody,
      options?: { onSuccess?: () => void; skipAuthRedirect?: boolean }
    ) => {
      setLoading(true)
      try {
        const res = await aiApi.impactAnalysisCommit(orgId, projectId, body, {
          skipAuthRedirect: options?.skipAuthRedirect,
        })
        try {
          options?.onSuccess?.()
        } catch {
          // Don't let onSuccess (e.g. loadData) failure prevent returning res to caller
        }
        return res
      } catch (err) {
        if (options?.skipAuthRedirect && isProblem(err) && (err.status === 401 || err.isAuthError)) {
          // Caller handles 401 (e.g. redirect to login)
        } else if (isConflictCode(err, 'AI_BATCH_EXPIRED')) toast.error(getProblemToastMessage(err))
        else if (isProblem(err) && err.status === 502 && getProblemCode(err) === 'AI_BAD_OUTPUT') {
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
