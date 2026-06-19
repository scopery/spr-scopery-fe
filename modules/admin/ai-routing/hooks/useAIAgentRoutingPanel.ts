'use client'

import { useCallback, useEffect, useState } from 'react'
import * as aiRoutingApi from '../api/ai-routing.api'
import * as aiAgentsApi from '@/modules/admin/ai-agents/api/ai-agents.api'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type { AIRoutingDryRunResult, AIRoutingListItem } from '@/modules/admin/ai-routing'
import type { AIModelSelectItem } from '@/modules/admin/ai-agents'

interface UseAIAgentRoutingPanelParams {
  agentId: string
  agentKey: string
  orgId?: string
}

export function useAIAgentRoutingPanel({ agentId, agentKey, orgId }: UseAIAgentRoutingPanelParams) {
  const [rules, setRules] = useState<AIRoutingListItem[]>([])
  const [models, setModels] = useState<AIModelSelectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [dryRunResult, setDryRunResult] = useState<AIRoutingDryRunResult | null>(null)
  const [dryRunning, setDryRunning] = useState(false)
  const [activateTarget, setActivateTarget] = useState<AIRoutingListItem | null>(null)
  const [form, setForm] = useState({
    name: '',
    target_model_id: '',
    priority: '100',
    budget_state: '',
    fallback_enabled: false,
    fallback_model_id: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rulesRes, modelsRes] = await Promise.all([
        aiRoutingApi.listRoutingRules({ agent_id: agentId, org_id: orgId }),
        aiAgentsApi.listModels(),
      ])
      setRules(rulesRes.items)
      setModels(modelsRes.items.filter((m) => m.active))
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [agentId, orgId])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.target_model_id) {
      toast.error('Name and target model are required.')
      return
    }
    try {
      await aiRoutingApi.createRoutingRule({
        org_id: orgId ?? null,
        agent_id: agentId,
        name: form.name.trim(),
        target_model_id: form.target_model_id,
        priority: Number(form.priority) || 100,
        condition_json: form.budget_state
          ? { budgetState: form.budget_state as 'normal' | 'warning' }
          : {},
        fallback_enabled: form.fallback_enabled,
        fallback_model_id: form.fallback_enabled ? form.fallback_model_id || null : null,
        active: false,
      })
      toast.success('Routing rule created (inactive by default).')
      setFormOpen(false)
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const toggleActive = async (rule: AIRoutingListItem) => {
    if (!rule.active) {
      setActivateTarget(rule)
      return
    }
    try {
      await aiRoutingApi.updateRoutingRule(rule.ruleId, { active: false })
      toast.success('Rule deactivated.')
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const confirmActivate = async () => {
    if (!activateTarget) return
    try {
      await aiRoutingApi.updateRoutingRule(activateTarget.ruleId, { active: true })
      toast.success('Rule activated.')
      setActivateTarget(null)
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const runDryRun = async () => {
    setDryRunning(true)
    setDryRunResult(null)
    try {
      const result = await aiRoutingApi.dryRunRouting({
        agent_key: agentKey,
        mode: 'generate',
        org_id: orgId,
        budget_state: form.budget_state || undefined,
      })
      setDryRunResult(result)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setDryRunning(false)
    }
  }

  const modelOptions = models.map((m) => ({
    value: m.id,
    label: `${m.displayName ?? m.modelName} (${m.modelTier})`,
  }))

  return {
    rules,
    models,
    loading,
    formOpen,
    dryRunResult,
    dryRunning,
    activateTarget,
    form,
    modelOptions,
    setFormOpen,
    setForm,
    setActivateTarget,
    handleCreate,
    toggleActive,
    confirmActivate,
    runDryRun,
  }
}
