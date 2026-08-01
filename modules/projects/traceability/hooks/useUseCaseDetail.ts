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
import type { UseCaseNestedImportPayload } from '../model/use-case-nested-import'
import type { PrimaryFunctionChangeImpact } from '../model/flow-mention'
import { invalidateUseCaseFlowScope } from './useUseCaseFlowScope'

export function useUseCaseDetail(projectId: string | null, useCaseId: string | null) {
  const [detail, setDetail] = useState<UseCaseDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    if (!projectId || !useCaseId) {
      setDetail(null)
      return
    }
    if (!opts?.quiet) setLoading(true)
    setError(null)
    try {
      const data = await api.getUseCaseDetail(projectId, useCaseId)
      setDetail(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load use case detail')
    } finally {
      if (!opts?.quiet) setLoading(false)
    }
  }, [projectId, useCaseId])

  // Drop stale detail when switching Use Cases so the panel can show a true initial load.
  useEffect(() => {
    setDetail(null)
    setError(null)
  }, [projectId, useCaseId])

  useEffect(() => {
    void load()
  }, [load])

  const quietReload = useCallback(() => load({ quiet: true }), [load])

  const updateOverview = useCallback(
    async (body: UpdateUseCaseBody) => {
      if (!projectId || !useCaseId) return
      await api.updateUseCase(projectId, useCaseId, body)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const createFlow = useCallback(
    async (body: CreateUseCaseFlowBody) => {
      if (!projectId || !useCaseId) return
      const result = await api.createUseCaseFlow(projectId, useCaseId, body)
      await quietReload()
      return result
    },
    [projectId, useCaseId, quietReload]
  )

  const updateFlow = useCallback(
    async (flowId: string, body: UpdateUseCaseFlowBody) => {
      if (!projectId || !useCaseId) return
      await api.updateUseCaseFlow(projectId, useCaseId, flowId, body)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const deleteFlow = useCallback(
    async (flowId: string) => {
      if (!projectId || !useCaseId) return
      await api.deleteUseCaseFlow(projectId, useCaseId, flowId)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const addStep = useCallback(
    async (flowId: string, body: AddFlowStepBody) => {
      if (!projectId || !useCaseId) return
      await api.addFlowStep(projectId, useCaseId, flowId, body)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const updateStep = useCallback(
    async (flowId: string, stepId: string, body: UpdateFlowStepBody) => {
      if (!projectId || !useCaseId) return
      await api.updateFlowStep(projectId, useCaseId, flowId, stepId, body)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const deleteStep = useCallback(
    async (flowId: string, stepId: string) => {
      if (!projectId || !useCaseId) return
      await api.deleteFlowStep(projectId, useCaseId, flowId, stepId)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const reorderSteps = useCallback(
    async (flowId: string, body: ReorderFlowStepsBody) => {
      if (!projectId || !useCaseId) return
      await api.reorderFlowSteps(projectId, useCaseId, flowId, body)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const addCondition = useCallback(
    async (body: AddUseCaseConditionBody) => {
      if (!projectId || !useCaseId) return
      await api.addUseCaseCondition(projectId, useCaseId, body)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const updateCondition = useCallback(
    async (conditionId: string, body: UpdateUseCaseConditionBody) => {
      if (!projectId || !useCaseId) return
      await api.updateUseCaseCondition(projectId, useCaseId, conditionId, body)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const deleteCondition = useCallback(
    async (conditionId: string) => {
      if (!projectId || !useCaseId) return
      await api.deleteUseCaseCondition(projectId, useCaseId, conditionId)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const addRule = useCallback(
    async (body: AddUseCaseBusinessRuleBody) => {
      if (!projectId || !useCaseId) return
      await api.addUseCaseBusinessRule(projectId, useCaseId, body)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const updateRule = useCallback(
    async (ruleId: string, body: UpdateUseCaseBusinessRuleBody) => {
      if (!projectId || !useCaseId) return
      await api.updateUseCaseBusinessRule(projectId, useCaseId, ruleId, body)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const deleteRule = useCallback(
    async (ruleId: string) => {
      if (!projectId || !useCaseId) return
      await api.deleteUseCaseBusinessRule(projectId, useCaseId, ruleId)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const addCriterion = useCallback(
    async (body: AddUseCaseAcceptanceCriterionBody) => {
      if (!projectId || !useCaseId) return
      await api.addUseCaseAcceptanceCriterion(projectId, useCaseId, body)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const updateCriterion = useCallback(
    async (criterionId: string, body: UpdateUseCaseAcceptanceCriterionBody) => {
      if (!projectId || !useCaseId) return
      await api.updateUseCaseAcceptanceCriterion(projectId, useCaseId, criterionId, body)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const deleteCriterion = useCallback(
    async (criterionId: string) => {
      if (!projectId || !useCaseId) return
      await api.deleteUseCaseAcceptanceCriterion(projectId, useCaseId, criterionId)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const addSupportingFunction = useCallback(
    async (body: AddSupportingFunctionBody) => {
      if (!projectId || !useCaseId) return
      await api.addSupportingFunction(projectId, useCaseId, body)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const removeSupportingFunction = useCallback(
    async (functionId: string) => {
      if (!projectId || !useCaseId) return
      await api.removeSupportingFunction(projectId, useCaseId, functionId)
      await quietReload()
    },
    [projectId, useCaseId, quietReload]
  )

  const previewPrimaryFunctionChange = useCallback(
    async (functionId: string): Promise<PrimaryFunctionChangeImpact | null> => {
      if (!projectId || !useCaseId) return null
      return api.getPrimaryFunctionChangeImpact(projectId, useCaseId, functionId)
    },
    [projectId, useCaseId]
  )

  const setPrimaryFunction = useCallback(
    async (functionId: string) => {
      if (!projectId || !useCaseId || !detail) return
      const overview = detail.overview
      await api.updateUseCase(projectId, useCaseId, {
        name: overview.name,
        goal: overview.goal ?? null,
        primaryActorName: overview.primaryActorName ?? null,
        triggerText: overview.triggerText ?? null,
        status: overview.status,
        primaryFunctionId: functionId,
      })
      invalidateUseCaseFlowScope(projectId, useCaseId)
      await quietReload()
    },
    [detail, projectId, useCaseId, quietReload]
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

  /** One POST …/nested-import — BE applies all nested parts. */
  const importNested = useCallback(
    async (payload: UseCaseNestedImportPayload) => {
      if (!projectId || !useCaseId) throw new Error('Use case required')
      const supportingFunctionIds = (payload.supportingFunctions ?? [])
        .map((s) => s.functionId)
        .filter(Boolean)
      const result = await api.importUseCaseNested(projectId, useCaseId, {
        flows: payload.flows,
        conditions: payload.conditions,
        businessRules: payload.businessRules,
        acceptanceCriteria: payload.acceptanceCriteria,
        supportingFunctionIds: supportingFunctionIds.length ? supportingFunctionIds : undefined,
      })
      await quietReload()
      return result
    },
    [projectId, useCaseId, quietReload]
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
    previewPrimaryFunctionChange,
    setPrimaryFunction,
    linkRequirement,
    unlinkRequirement,
    importNested,
  }
}
