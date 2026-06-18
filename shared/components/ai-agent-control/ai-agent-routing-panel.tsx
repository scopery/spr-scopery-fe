'use client'

import { useCallback, useEffect, useState } from 'react'
import { Typography, Button, ContentLoader, Input, Select } from '@/shared/ui'
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog'
import * as aiRoutingService from '@/services/ai-routing.service'
import * as aiAgentService from '@/services/ai-agent-control.service'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type { AIRoutingDryRunResult, AIRoutingListItem } from '@/types/ai-routing'
import type { AIModelSelectItem } from '@/types/ai-agent-control'

interface AIAgentRoutingPanelProps {
  agentId: string
  agentKey: string
  orgId?: string
}

export function AIAgentRoutingPanel({ agentId, agentKey, orgId }: AIAgentRoutingPanelProps) {
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
        aiRoutingService.listRoutingRules({ agent_id: agentId, org_id: orgId }),
        aiAgentService.listModels(),
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
    load()
  }, [load])

  const handleCreate = async () => {
    if (!form.name.trim() || !form.target_model_id) {
      toast.error('Name and target model are required.')
      return
    }
    try {
      await aiRoutingService.createRoutingRule({
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
      await aiRoutingService.updateRoutingRule(rule.ruleId, { active: false })
      toast.success('Rule deactivated.')
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const confirmActivate = async () => {
    if (!activateTarget) return
    try {
      await aiRoutingService.updateRoutingRule(activateTarget.ruleId, { active: true })
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
      const result = await aiRoutingService.dryRunRouting({
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

  const budgetStateOptions = [
    { value: '', label: 'Any budget state' },
    { value: 'normal', label: 'Normal' },
    { value: 'warning', label: 'Warning' },
  ]

  const fallbackModelOptions = [
    { value: '', label: 'Select fallback model' },
    ...modelOptions,
  ]

  if (loading) return <ContentLoader />

  return (
    <div className="space-y-6">
      <Typography variant="small" tone="muted">
        Routing rules can change which model future AI runs use. Higher priority (lower number) rules
        are evaluated first. Fallback is used only for provider/model failures, not validation or
        budget errors. Dry run does not call the AI provider.
      </Typography>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => setFormOpen(true)}>
          Create routing rule
        </Button>
        <Button size="sm" variant="outline" onClick={runDryRun} disabled={dryRunning}>
          {dryRunning ? 'Dry running…' : 'Dry-run routing'}
        </Button>
      </div>

      {dryRunResult ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <Typography weight="medium" className="mb-2">
            Dry-run result
          </Typography>
          <p>Default: {dryRunResult.defaultModelName}</p>
          <p>Selected: {dryRunResult.selectedModelName}</p>
          <p>Routing applied: {dryRunResult.routingApplied ? 'Yes' : 'No'}</p>
          <p>{dryRunResult.routingReason}</p>
        </div>
      ) : null}

      {rules.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
          <Typography tone="muted">No routing rules for this agent.</Typography>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Rule</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Conditions</th>
                <th className="px-4 py-3 font-medium">Target</th>
                <th className="px-4 py-3 font-medium">Fallback</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.ruleId} className="border-b border-neutral-100">
                  <td className="px-4 py-3">{rule.name}</td>
                  <td className="px-4 py-3">{rule.priority}</td>
                  <td className="px-4 py-3">{rule.conditionSummary}</td>
                  <td className="px-4 py-3">{rule.targetModelName ?? rule.targetModelId}</td>
                  <td className="px-4 py-3">
                    {rule.fallbackEnabled ? rule.fallbackModelName ?? '—' : '—'}
                  </td>
                  <td className="px-4 py-3">{rule.active ? 'Active' : 'Inactive'}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(rule)}>
                      {rule.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-lg">
            <Typography as="h2" size="lg" weight="semibold" className="mb-4">
              Create routing rule
            </Typography>
            <div className="space-y-3">
              <Input
                placeholder="Rule name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Select
                options={[{ value: '', label: 'Select target model' }, ...modelOptions]}
                value={form.target_model_id}
                onValueChange={(v: string) => setForm((f) => ({ ...f, target_model_id: v }))}
                className="w-full"
                size="sm"
              />
              <Input
                type="number"
                placeholder="Priority (lower = first)"
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
              />
              <Select
                options={budgetStateOptions}
                value={form.budget_state}
                onValueChange={(v: string) => setForm((f) => ({ ...f, budget_state: v }))}
                className="w-full"
                size="sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.fallback_enabled}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, fallback_enabled: e.target.checked }))
                  }
                />
                Enable fallback on provider failure
              </label>
              {form.fallback_enabled ? (
                <Select
                  options={fallbackModelOptions}
                  value={form.fallback_model_id}
                  onValueChange={(v: string) => setForm((f) => ({ ...f, fallback_model_id: v }))}
                  className="w-full"
                  size="sm"
                />
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate}>Save</Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={activateTarget != null}
        onClose={() => setActivateTarget(null)}
        title="Activate routing rule?"
        message="Active rules can change which model future AI runs use for this agent. Review conditions and target model before activating."
        confirmLabel="Activate"
        onConfirm={confirmActivate}
      />
    </div>
  )
}
