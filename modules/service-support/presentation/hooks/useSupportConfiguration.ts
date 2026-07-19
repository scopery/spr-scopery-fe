'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/support.api'
import type {
  CostInput,
  EscalationRule,
  HandoverPackage,
  ServiceProfile,
  SlaPolicy,
  SupportQueue,
  SupportRequestType,
  WarrantyCoverage,
} from '../../infrastructure/api/support.api'

export function useSupportConfiguration(workspaceId: string | null) {
  const [policies, setPolicies] = useState<SlaPolicy[]>([])
  const [queues, setQueues] = useState<SupportQueue[]>([])
  const [requestTypes, setRequestTypes] = useState<SupportRequestType[]>([])
  const [escalationRules, setEscalationRules] = useState<EscalationRule[]>([])
  const [warranties, setWarranties] = useState<WarrantyCoverage[]>([])
  const [handovers, setHandovers] = useState<HandoverPackage[]>([])
  const [serviceProfiles, setServiceProfiles] = useState<ServiceProfile[]>([])
  const [costInputs, setCostInputs] = useState<CostInput[]>([])
  const [efforts, setEfforts] = useState<Array<{ id: string; effortHours?: number; status?: string }>>([])
  const [knowledgeLinks, setKnowledgeLinks] = useState<Array<{ id: string; label?: string }>>([])
  const [workLinks, setWorkLinks] = useState<Array<{ id: string; label?: string }>>([])
  const [metricSnapshots, setMetricSnapshots] = useState<
    Array<{ id: string; metricCode?: string; value?: number }>
  >([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [p, q, r, e, w, h, sp, ci, ef, kl, wl, ms] = await Promise.all([
        api.listSlaPolicies(workspaceId),
        api.listSupportQueues(workspaceId),
        api.listRequestTypes(workspaceId),
        api.listEscalationRules(workspaceId),
        api.listWarranties(workspaceId),
        api.listHandoverPackages(workspaceId),
        api.listServiceProfiles(workspaceId),
        api.listCostInputs(workspaceId),
        api.listEfforts(workspaceId),
        api.listKnowledgeLinks(workspaceId),
        api.listWorkLinks(workspaceId),
        api.listMetricSnapshots(workspaceId),
      ])
      setPolicies(p.items)
      setQueues(q.items)
      setRequestTypes(r.items)
      setEscalationRules(e.items)
      setWarranties(w.items)
      setHandovers(h.items)
      setServiceProfiles(sp.items)
      setCostInputs(ci.items)
      setEfforts(ef.items)
      setKnowledgeLinks(kl.items)
      setWorkLinks(wl.items)
      setMetricSnapshots(ms.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load support config')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const createPolicy = useCallback(
    async (policyCode: string, name: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.createSlaPolicy(workspaceId, {
          policyCode,
          name,
          firstResponseMinutes: 240,
          resolveMinutes: 2880,
        })
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Create SLA failed')
      }
    },
    [workspaceId, load]
  )

  const enableRule = useCallback(
    async (ruleId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.enableEscalationRule(workspaceId, ruleId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Enable rule failed')
      }
    },
    [workspaceId, load]
  )

  const disableRule = useCallback(
    async (ruleId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.disableEscalationRule(workspaceId, ruleId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Disable rule failed')
      }
    },
    [workspaceId, load]
  )

  const expireWarranty = useCallback(
    async (warrantyId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.expireWarranty(workspaceId, warrantyId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Expire warranty failed')
      }
    },
    [workspaceId, load]
  )

  const finalizeHandover = useCallback(
    async (packageId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.finalizeHandoverPackage(workspaceId, packageId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Finalize handover failed')
      }
    },
    [workspaceId, load]
  )

  const approveCost = useCallback(
    async (inputId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.approveCostInput(workspaceId, inputId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Approve cost failed')
      }
    },
    [workspaceId, load]
  )

  return {
    policies,
    queues,
    requestTypes,
    escalationRules,
    warranties,
    handovers,
    serviceProfiles,
    costInputs,
    efforts,
    knowledgeLinks,
    workLinks,
    metricSnapshots,
    loading,
    error,
    actionError,
    refetch: load,
    createPolicy,
    enableRule,
    disableRule,
    expireWarranty,
    finalizeHandover,
    approveCost,
  }
}
