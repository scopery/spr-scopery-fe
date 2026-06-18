'use client'

import { useCallback, useEffect, useState } from 'react'
import * as governanceService from '@/services/governance.service'
import type { GovernancePolicy, GovernanceRule } from '@/types/governance'

export function useGovernancePolicy(orgId: string | null, policyId: string | null) {
  const [policy, setPolicy] = useState<GovernancePolicy | null>(null)
  const [rules, setRules] = useState<GovernanceRule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId || !policyId) return
    setLoading(true)
    setError(null)
    try {
      const detail = await governanceService.getGovernancePolicy(orgId, policyId)
      setPolicy(detail.policy)
      setRules(detail.rules)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policy')
    } finally {
      setLoading(false)
    }
  }, [orgId, policyId])

  useEffect(() => { load() }, [load])

  return { policy, rules, loading, error, refetch: load }
}
