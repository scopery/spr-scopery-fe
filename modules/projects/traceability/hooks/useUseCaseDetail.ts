'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/use-case.api'
import type {
  AddFlowStepBody,
  AddSupportingFunctionBody,
  AddUseCaseAcceptanceCriterionBody,
  AddUseCaseBusinessRuleBody,
  AddUseCaseConditionBody,
  CreateUseCaseFlowBody,
  LinkRequirementBody,
  ReorderFlowStepsBody,
  UpdateFlowStepBody,
  UpdateUseCaseAcceptanceCriterionBody,
  UpdateUseCaseBody,
  UpdateUseCaseBusinessRuleBody,
  UpdateUseCaseConditionBody,
  UpdateUseCaseFlowBody,
  UseCaseDetail,
} from '../model/use-case'

export function useUseCaseDetail(projectId: string | null, useCaseId: string | null) {
  const [detail, setDetail] = useState<UseCaseDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !useCaseId) {
      setDetail(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await api.getUseCaseDetail(projectId, useCaseId)
      setDetail(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load use case detail')
    } finally {
      setLoading(false)
    }
  }, [projectId, useCaseId])

  useEffect(() => {
    void load()
  }, [load])

  const updateOverview = useCallback(
    async (body: UpdateUseCaseBody) => {
      if (!projectId || !useCaseId) return
      await api.updateUseCase(projectId, useCaseId, body)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const createFlow = useCallback(
    async (body: CreateUseCaseFlowBody) => {
      if (!projectId || !useCaseId) return
      const result = await api.createUseCaseFlow(projectId, useCaseId, body)
      await load()
      return result
    },
    [projectId, useCaseId, load]
  )

  const updateFlow = useCallback(
    async (flowId: string, body: UpdateUseCaseFlowBody) => {
      if (!projectId || !useCaseId) return
      await api.updateUseCaseFlow(projectId, useCaseId, flowId, body)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const deleteFlow = useCallback(
    async (flowId: string) => {
      if (!projectId || !useCaseId) return
      await api.deleteUseCaseFlow(projectId, useCaseId, flowId)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const addStep = useCallback(
    async (flowId: string, body: AddFlowStepBody) => {
      if (!projectId || !useCaseId) return
      await api.addFlowStep(projectId, useCaseId, flowId, body)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const updateStep = useCallback(
    async (flowId: string, stepId: string, body: UpdateFlowStepBody) => {
      if (!projectId || !useCaseId) return
      await api.updateFlowStep(projectId, useCaseId, flowId, stepId, body)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const deleteStep = useCallback(
    async (flowId: string, stepId: string) => {
      if (!projectId || !useCaseId) return
      await api.deleteFlowStep(projectId, useCaseId, flowId, stepId)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const reorderSteps = useCallback(
    async (flowId: string, body: ReorderFlowStepsBody) => {
      if (!projectId || !useCaseId) return
      await api.reorderFlowSteps(projectId, useCaseId, flowId, body)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const addCondition = useCallback(
    async (body: AddUseCaseConditionBody) => {
      if (!projectId || !useCaseId) return
      await api.addUseCaseCondition(projectId, useCaseId, body)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const updateCondition = useCallback(
    async (conditionId: string, body: UpdateUseCaseConditionBody) => {
      if (!projectId || !useCaseId) return
      await api.updateUseCaseCondition(projectId, useCaseId, conditionId, body)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const deleteCondition = useCallback(
    async (conditionId: string) => {
      if (!projectId || !useCaseId) return
      await api.deleteUseCaseCondition(projectId, useCaseId, conditionId)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const addRule = useCallback(
    async (body: AddUseCaseBusinessRuleBody) => {
      if (!projectId || !useCaseId) return
      await api.addUseCaseBusinessRule(projectId, useCaseId, body)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const updateRule = useCallback(
    async (ruleId: string, body: UpdateUseCaseBusinessRuleBody) => {
      if (!projectId || !useCaseId) return
      await api.updateUseCaseBusinessRule(projectId, useCaseId, ruleId, body)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const deleteRule = useCallback(
    async (ruleId: string) => {
      if (!projectId || !useCaseId) return
      await api.deleteUseCaseBusinessRule(projectId, useCaseId, ruleId)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const addCriterion = useCallback(
    async (body: AddUseCaseAcceptanceCriterionBody) => {
      if (!projectId || !useCaseId) return
      await api.addUseCaseAcceptanceCriterion(projectId, useCaseId, body)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const updateCriterion = useCallback(
    async (criterionId: string, body: UpdateUseCaseAcceptanceCriterionBody) => {
      if (!projectId || !useCaseId) return
      await api.updateUseCaseAcceptanceCriterion(projectId, useCaseId, criterionId, body)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const deleteCriterion = useCallback(
    async (criterionId: string) => {
      if (!projectId || !useCaseId) return
      await api.deleteUseCaseAcceptanceCriterion(projectId, useCaseId, criterionId)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const addSupportingFunction = useCallback(
    async (body: AddSupportingFunctionBody) => {
      if (!projectId || !useCaseId) return
      await api.addSupportingFunction(projectId, useCaseId, body)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const removeSupportingFunction = useCallback(
    async (functionId: string) => {
      if (!projectId || !useCaseId) return
      await api.removeSupportingFunction(projectId, useCaseId, functionId)
      await load()
    },
    [projectId, useCaseId, load]
  )

  const linkRequirement = useCallback(
    async (body: LinkRequirementBody) => {
      if (!projectId || !useCaseId) return
      await api.linkRequirementToUseCase(projectId, useCaseId, body)
    },
    [projectId, useCaseId]
  )

  const unlinkRequirement = useCallback(
    async (requirementId: string) => {
      if (!projectId || !useCaseId) return
      await api.unlinkRequirementFromUseCase(projectId, useCaseId, requirementId)
    },
    [projectId, useCaseId]
  )

  return {
    detail,
    loading,
    error,
    refetch: load,
    updateOverview,
    createFlow,
    updateFlow,
    deleteFlow,
    addStep,
    updateStep,
    deleteStep,
    reorderSteps,
    addCondition,
    updateCondition,
    deleteCondition,
    addRule,
    updateRule,
    deleteRule,
    addCriterion,
    updateCriterion,
    deleteCriterion,
    addSupportingFunction,
    removeSupportingFunction,
    linkRequirement,
    unlinkRequirement,
  }
}
