'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as decisionsApi from '../../infrastructure/api/decisions.api'
import type {
  CreateDecisionPayload,
  DecisionRecord,
  RejectDecisionPayload,
  SupersedeDecisionPayload,
  UpdateDecisionPayload,
} from '../../domain/model/decision'

export function useDecisions(projectId: string | null) {
  const [decisions, setDecisions] = useState<DecisionRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await decisionsApi.listDecisions(projectId)
      setDecisions(res ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load decisions')
      setDecisions([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const createDecision = useCallback(
    async (body: CreateDecisionPayload) => {
      if (!projectId) return null
      const created = await decisionsApi.createDecision(projectId, body)
      await load()
      return created
    },
    [projectId, load]
  )

  const decideDecision = useCallback(
    async (decisionId: string, outcome: string) => {
      if (!projectId) return null
      setActingId(decisionId)
      try {
        const result = await decisionsApi.decideDecision(projectId, decisionId, { outcome })
        await load()
        return result
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  const updateDecision = useCallback(
    async (decisionId: string, body: UpdateDecisionPayload) => {
      if (!projectId) return null
      const updated = await decisionsApi.updateDecision(projectId, decisionId, body)
      await load()
      return updated
    },
    [projectId, load]
  )

  const rejectDecision = useCallback(
    async (decisionId: string, body?: RejectDecisionPayload) => {
      if (!projectId) return null
      setActingId(decisionId)
      try {
        const result = await decisionsApi.rejectDecision(projectId, decisionId, body)
        await load()
        return result
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  const supersedeDecision = useCallback(
    async (decisionId: string, body?: SupersedeDecisionPayload) => {
      if (!projectId) return null
      setActingId(decisionId)
      try {
        const result = await decisionsApi.supersedeDecision(projectId, decisionId, body)
        await load()
        return result
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  const archiveDecision = useCallback(
    async (decisionId: string) => {
      if (!projectId) return null
      setActingId(decisionId)
      try {
        const result = await decisionsApi.archiveDecision(projectId, decisionId)
        await load()
        return result
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  return {
    decisions,
    loading,
    error,
    forbidden,
    actingId,
    refetch: load,
    createDecision,
    updateDecision,
    decideDecision,
    rejectDecision,
    supersedeDecision,
    archiveDecision,
  }
}
