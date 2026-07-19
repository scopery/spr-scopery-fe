'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as trustApi from '../../infrastructure/api/trust.api'
import type { PrivacyRequest } from '../../domain/model/trust'
import type { AnonymizationPlan, LegalHold } from '../../infrastructure/api/trust.api'

export function usePrivacyRequests(workspaceId: string | null) {
  const [items, setItems] = useState<PrivacyRequest[]>([])
  const [holds, setHolds] = useState<LegalHold[]>([])
  const [plans, setPlans] = useState<AnonymizationPlan[]>([])
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null)
  const [dryRunOk, setDryRunOk] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [reqRes, holdRes, planRes] = await Promise.all([
        trustApi.listPrivacyRequests(workspaceId),
        trustApi.listLegalHolds(workspaceId),
        trustApi.listAnonymizationPlans(workspaceId),
      ])
      setItems(reqRes.items)
      setHolds(holdRes.items)
      setPlans(planRes.items)
      if (!selectedPlanId && planRes.items[0]) {
        setSelectedPlanId(planRes.items[0].id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load privacy requests')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, selectedPlanId])

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per workspace
  }, [workspaceId])

  const activeHolds = useMemo(
    () => holds.filter((h) => h.status === 'ACTIVE' || h.status === 'HELD'),
    [holds]
  )
  const hasActiveLegalHold = activeHolds.length > 0

  const runDryRun = useCallback(async () => {
    if (!workspaceId || !selectedPlanId) return
    setActionError(null)
    setDryRunOk(false)
    try {
      const res = await trustApi.dryRunAnonymization(workspaceId, selectedPlanId)
      if (res.blockedByLegalHold || hasActiveLegalHold) {
        setActionError('Blocked by active legal hold — release holds before execute')
        setDryRunOk(false)
        return
      }
      setDryRunOk(true)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Dry-run failed')
    }
  }, [workspaceId, selectedPlanId, hasActiveLegalHold])

  const execute = useCallback(async () => {
    if (!workspaceId || !selectedPlanId || !dryRunOk || hasActiveLegalHold) return
    setActionError(null)
    try {
      await trustApi.executeAnonymization(workspaceId, selectedPlanId)
      setDryRunOk(false)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Execute failed')
    }
  }, [workspaceId, selectedPlanId, dryRunOk, hasActiveLegalHold, load])

  return {
    items,
    holds,
    plans,
    selectedPlanId,
    setSelectedPlanId,
    dryRunOk,
    hasActiveLegalHold,
    loading,
    error,
    actionError,
    refetch: load,
    runDryRun,
    execute,
  }
}
