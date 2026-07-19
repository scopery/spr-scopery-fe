'use client'

import { useCallback, useEffect, useState } from 'react'
import * as policyApi from '../../infrastructure/api/utilization-policy.api'
import { isThresholdOrderValid } from '../../domain/rules/capacity.rules'
import type {
  UpdateUtilizationThresholdPolicyPayload,
  UtilizationThresholdPolicy,
} from '../../domain/model/utilization-threshold-policy'

const EMPTY_FORM: UpdateUtilizationThresholdPolicyPayload = {
  underAllocatedPercent: 50,
  healthyMinPercent: 50,
  healthyMaxPercent: 80,
  watchMaxPercent: 90,
  overloadedPercent: 100,
  criticalOverloadPercent: 120,
}

export function useUtilizationPolicy(workspaceId: string | null) {
  const [policy, setPolicy] = useState<UtilizationThresholdPolicy | null>(null)
  const [form, setForm] = useState<UpdateUtilizationThresholdPolicyPayload>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await policyApi.getWorkspaceUtilizationPolicy(workspaceId)
      setPolicy(res)
      setForm({
        underAllocatedPercent: res.underAllocatedPercent,
        healthyMinPercent: res.healthyMinPercent,
        healthyMaxPercent: res.healthyMaxPercent,
        watchMaxPercent: res.watchMaxPercent,
        overloadedPercent: res.overloadedPercent,
        criticalOverloadPercent: res.criticalOverloadPercent,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load utilization policy')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const updateField = useCallback(
    (key: keyof UpdateUtilizationThresholdPolicyPayload, value: number) => {
      setForm((prev) => ({ ...prev, [key]: value }))
      setValidationError(null)
    },
    []
  )

  const save = useCallback(async () => {
    if (!workspaceId) return
    if (!isThresholdOrderValid(form)) {
      setValidationError(
        'Thresholds must be ordered: under ≤ healthy min ≤ healthy max ≤ watch ≤ overloaded ≤ critical'
      )
      return
    }
    setSaving(true)
    setValidationError(null)
    try {
      const updated = await policyApi.updateWorkspaceUtilizationPolicy(workspaceId, form)
      setPolicy(updated)
    } finally {
      setSaving(false)
    }
  }, [workspaceId, form])

  return {
    policy,
    form,
    loading,
    saving,
    error,
    validationError,
    refetch: load,
    updateField,
    save,
  }
}
