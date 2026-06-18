'use client'

import { useCallback, useState } from 'react'
import { GOVERNANCE_ACTION_KEYS, GOVERNANCE_SIMULATOR_SCENARIOS } from '@/constants/governance.constants'
import * as governanceService from '@/services/governance.service'
import type { GovernanceEvaluateResult } from '@/types/governance'
import { ApiError } from '@/types/api'
import type { GovernanceSimulatorFormState } from '@/types/governance/governance-simulator'
import {
  buildGovernanceEvaluatePayload,
  DEFAULT_GOVERNANCE_SIMULATOR_FORM,
  scenarioPayloadToForm,
} from '@/utils/governance/governance-simulator.mapper'

export function useGovernanceSimulator(orgId: string) {
  const [form, setForm] = useState<GovernanceSimulatorFormState>(DEFAULT_GOVERNANCE_SIMULATOR_FORM)
  const [result, setResult] = useState<GovernanceEvaluateResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateFormField = useCallback(
    (field: keyof GovernanceSimulatorFormState, value: string) => {
      setForm((current) => ({ ...current, [field]: value }))
    },
    []
  )

  const evaluate = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await governanceService.evaluateGovernance(
        orgId,
        buildGovernanceEvaluatePayload(form)
      )
      setResult(response)
    } catch (err) {
      setResult(null)
      setError(err instanceof ApiError ? err.message : 'Evaluation failed')
    } finally {
      setLoading(false)
    }
  }, [orgId, form])

  const loadScenario = useCallback((key: string) => {
    const scenario = GOVERNANCE_SIMULATOR_SCENARIOS.find((item) => item.key === key)
    if (!scenario) return
    setForm(scenarioPayloadToForm(scenario.payload))
    setResult(null)
    setError(null)
  }, [])

  const reset = useCallback(() => {
    setForm(DEFAULT_GOVERNANCE_SIMULATOR_FORM)
    setResult(null)
    setError(null)
  }, [])

  const scenarioOptions = [
    { value: '', label: 'Load sample…' },
    ...GOVERNANCE_SIMULATOR_SCENARIOS.map((scenario) => ({
      value: scenario.key,
      label: scenario.label,
    })),
  ]

  const actionKeyOptions = GOVERNANCE_ACTION_KEYS.map((key) => ({
    value: key,
    label: key,
  }))

  return {
    form,
    result,
    loading,
    error,
    scenarioOptions,
    actionKeyOptions,
    updateFormField,
    evaluate,
    loadScenario,
    reset,
  }
}
