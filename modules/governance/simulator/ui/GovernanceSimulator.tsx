'use client'

import { useGovernanceSimulator } from '../hooks/useGovernanceSimulator'
import { GovernanceSimulatorView } from './GovernanceSimulatorView'

interface GovernanceSimulatorProps {
  orgId: string
  canViewRuleDetails: boolean
}

export function GovernanceSimulator({ orgId, canViewRuleDetails }: GovernanceSimulatorProps) {
  const {
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
  } = useGovernanceSimulator(orgId)

  return (
    <GovernanceSimulatorView
      canViewRuleDetails={canViewRuleDetails}
      form={form}
      loading={loading}
      error={error}
      result={result}
      scenarioOptions={scenarioOptions}
      actionKeyOptions={actionKeyOptions}
      onScenarioSelect={loadScenario}
      onFormFieldChange={updateFormField}
      onEvaluate={() => void evaluate()}
      onReset={reset}
    />
  )
}
