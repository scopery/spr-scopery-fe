'use client'

import { useState, useCallback } from 'react'
import { getProblemToastMessage, isConflictCode } from '@/shared/lib/errorHandling'
import { getProblemCode, isProblem } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import * as aiImpactApi from '../api/ai-impact.api'
import type { ImpactAnalysisBody, ImpactCommitBody, IntakesCreateBody } from '../model/ai-impact'

export function useIntakesUploadUrl() {
  const [loading, setLoading] = useState(false)
  const mutateAsync = useCallback(
    async (orgId: string, projectId: string, body: { file_name: string; mime_type: string }) => {
      setLoading(true)
      try {
        return await aiImpactApi.getIntakesUploadUrl(orgId, projectId, body)
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
    async (orgId: string, projectId: string, body: IntakesCreateBody) => {
      setLoading(true)
      try {
        return await aiImpactApi.createIntake(orgId, projectId, body)
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
    async (orgId: string, projectId: string, body: ImpactAnalysisBody) => {
      setLoading(true)
      try {
        return await aiImpactApi.runImpactAnalysis(orgId, projectId, body)
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
        const res = await aiImpactApi.impactAnalysisCommit(orgId, projectId, body, {
          skipAuthRedirect: options?.skipAuthRedirect,
        })
        try {
          options?.onSuccess?.()
        } catch {
          // Don't let onSuccess failure prevent returning res to caller
        }
        return res
      } catch (err) {
        if (
          options?.skipAuthRedirect &&
          isProblem(err) &&
          (err.status === 401 || err.isAuthError)
        ) {
          // Caller handles 401
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
