'use client'

import { useCallback, useEffect, useState } from 'react'
import * as decisionsApi from '../../infrastructure/api/decisions.api'
import type {
  CreateDecisionLinkPayload,
  DecisionImpact,
  DecisionLink,
  DecisionOption,
  DecisionRecord,
  UpdateDecisionImpactPayload,
  UpdateDecisionOptionPayload,
} from '../../domain/model/decision'

/** Loads options, impact, links + lifecycle actions for a decision shown in the detail drawer. */
export function useDecisionDetail(projectId: string | null, decisionId: string | null) {
  const [options, setOptions] = useState<DecisionOption[]>([])
  const [impact, setImpact] = useState<DecisionImpact | null>(null)
  const [links, setLinks] = useState<DecisionLink[]>([])
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)

  const loadOptions = useCallback(async () => {
    if (!projectId || !decisionId) {
      setOptions([])
      return
    }
    setLoading(true)
    try {
      const [opts, imp, lnks] = await Promise.all([
        decisionsApi.listDecisionOptions(projectId, decisionId),
        decisionsApi.getDecisionImpact(projectId, decisionId).catch(() => null),
        decisionsApi.listDecisionLinks(projectId, decisionId).catch(() => []),
      ])
      setOptions(opts ?? [])
      setImpact(imp)
      setLinks(lnks ?? [])
    } catch {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [projectId, decisionId])

  useEffect(() => {
    void loadOptions()
  }, [loadOptions])

  const decide = useCallback(
    async (outcome?: string): Promise<DecisionRecord | null> => {
      if (!projectId || !decisionId) return null
      setActing(true)
      try {
        return await decisionsApi.decideDecision(projectId, decisionId, { outcome })
      } finally {
        setActing(false)
      }
    },
    [projectId, decisionId]
  )

  const reject = useCallback(
    async (reason?: string): Promise<DecisionRecord | null> => {
      if (!projectId || !decisionId) return null
      setActing(true)
      try {
        return await decisionsApi.rejectDecision(projectId, decisionId, { reason })
      } finally {
        setActing(false)
      }
    },
    [projectId, decisionId]
  )

  const supersede = useCallback(
    async (reason?: string): Promise<DecisionRecord | null> => {
      if (!projectId || !decisionId) return null
      setActing(true)
      try {
        return await decisionsApi.supersedeDecision(projectId, decisionId, { reason })
      } finally {
        setActing(false)
      }
    },
    [projectId, decisionId]
  )

  const archive = useCallback(async (): Promise<DecisionRecord | null> => {
    if (!projectId || !decisionId) return null
    setActing(true)
    try {
      return await decisionsApi.archiveDecision(projectId, decisionId)
    } finally {
      setActing(false)
    }
  }, [projectId, decisionId])

  const updateOption = useCallback(
    async (optionId: string, body: UpdateDecisionOptionPayload): Promise<DecisionOption | null> => {
      if (!projectId || !decisionId) return null
      const result = await decisionsApi.updateDecisionOption(projectId, decisionId, optionId, body)
      await loadOptions()
      return result
    },
    [projectId, decisionId, loadOptions]
  )

  const deleteOption = useCallback(
    async (optionId: string): Promise<void> => {
      if (!projectId || !decisionId) return
      await decisionsApi.deleteDecisionOption(projectId, decisionId, optionId)
      await loadOptions()
    },
    [projectId, decisionId, loadOptions]
  )

  const updateImpact = useCallback(
    async (body: UpdateDecisionImpactPayload): Promise<DecisionImpact | null> => {
      if (!projectId || !decisionId) return null
      const result = await decisionsApi.updateDecisionImpact(projectId, decisionId, body)
      setImpact(result)
      return result
    },
    [projectId, decisionId]
  )

  const addLink = useCallback(
    async (body: CreateDecisionLinkPayload): Promise<DecisionLink | null> => {
      if (!projectId || !decisionId) return null
      const created = await decisionsApi.createDecisionLink(projectId, decisionId, body)
      setLinks((prev) => [...prev, created])
      return created
    },
    [projectId, decisionId]
  )

  const removeLink = useCallback(
    async (linkId: string): Promise<void> => {
      if (!projectId || !decisionId) return
      await decisionsApi.deleteDecisionLink(projectId, decisionId, linkId)
      setLinks((prev) => prev.filter((l) => l.id !== linkId))
    },
    [projectId, decisionId]
  )

  return {
    options,
    impact,
    links,
    loading,
    acting,
    refetchOptions: loadOptions,
    decide,
    reject,
    supersede,
    archive,
    updateOption,
    deleteOption,
    updateImpact,
    addLink,
    removeLink,
  }
}
