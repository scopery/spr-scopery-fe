'use client'

import { Typography, Button, ContentLoader, Input, Select, ConfirmDialog } from '@/shared/ui'
import { useAIAgentRoutingPanel } from '../hooks/useAIAgentRoutingPanel'

interface AIAgentRoutingPanelProps {
  agentId: string
  agentKey: string
  orgId?: string
}

export function AIAgentRoutingPanel({ agentId, agentKey, orgId }: AIAgentRoutingPanelProps) {
  const panel = useAIAgentRoutingPanel({ agentId, agentKey, orgId })

  const budgetStateOptions = [
    { value: '', label: 'Any budget state' },
    { value: 'normal', label: 'Normal' },
    { value: 'warning', label: 'Warning' },
  ]

  const fallbackModelOptions = [{ value: '', label: 'Select fallback model' }, ...panel.modelOptions]

  if (panel.loading) return <ContentLoader />

  return (
    <div className="space-y-6">
      <Typography variant="small" tone="muted">
        Routing rules can change which model future AI runs use. Higher priority (lower number)
        rules are evaluated first. Fallback is used only for provider/model failures, not validation
        or budget errors. Dry run does not call the AI provider.
      </Typography>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={() => panel.setFormOpen(true)}>
          Create routing rule
        </Button>
        <Button size="sm" variant="outline" onClick={() => void panel.runDryRun()} disabled={panel.dryRunning}>
          {panel.dryRunning ? 'Dry running…' : 'Dry-run routing'}
        </Button>
      </div>

      {panel.dryRunResult ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm">
          <Typography weight="medium" className="mb-2">
            Dry-run result
          </Typography>
          <p>Default: {panel.dryRunResult.defaultModelName}</p>
          <p>Selected: {panel.dryRunResult.selectedModelName}</p>
          <p>Routing applied: {panel.dryRunResult.routingApplied ? 'Yes' : 'No'}</p>
          <p>{panel.dryRunResult.routingReason}</p>
        </div>
      ) : null}

      {panel.rules.length === 0 ? (
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
              {panel.rules.map((rule) => (
                <tr key={rule.ruleId} className="border-b border-neutral-100">
                  <td className="px-4 py-3">{rule.name}</td>
                  <td className="px-4 py-3">{rule.priority}</td>
                  <td className="px-4 py-3">{rule.conditionSummary}</td>
                  <td className="px-4 py-3">{rule.targetModelName ?? rule.targetModelId}</td>
                  <td className="px-4 py-3">
                    {rule.fallbackEnabled ? (rule.fallbackModelName ?? '—') : '—'}
                  </td>
                  <td className="px-4 py-3">{rule.active ? 'Active' : 'Inactive'}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => void panel.toggleActive(rule)}>
                      {rule.active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {panel.formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-lg">
            <Typography as="h2" size="lg" weight="semibold" className="mb-4">
              Create routing rule
            </Typography>
            <div className="space-y-3">
              <Input
                placeholder="Rule name"
                value={panel.form.name}
                onChange={(e) => panel.setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Select
                options={[{ value: '', label: 'Select target model' }, ...panel.modelOptions]}
                value={panel.form.target_model_id}
                onValueChange={(v: string) => panel.setForm((f) => ({ ...f, target_model_id: v }))}
                className="w-full"
                size="sm"
              />
              <Input
                type="number"
                placeholder="Priority (lower = first)"
                value={panel.form.priority}
                onChange={(e) => panel.setForm((f) => ({ ...f, priority: e.target.value }))}
              />
              <Select
                options={budgetStateOptions}
                value={panel.form.budget_state}
                onValueChange={(v: string) => panel.setForm((f) => ({ ...f, budget_state: v }))}
                className="w-full"
                size="sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={panel.form.fallback_enabled}
                  onChange={(e) => panel.setForm((f) => ({ ...f, fallback_enabled: e.target.checked }))}
                />
                Enable fallback on provider failure
              </label>
              {panel.form.fallback_enabled ? (
                <Select
                  options={fallbackModelOptions}
                  value={panel.form.fallback_model_id}
                  onValueChange={(v: string) => panel.setForm((f) => ({ ...f, fallback_model_id: v }))}
                  className="w-full"
                  size="sm"
                />
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => panel.setFormOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => void panel.handleCreate()}>Save</Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={panel.activateTarget != null}
        onClose={() => panel.setActivateTarget(null)}
        title="Activate routing rule?"
        message="Active rules can change which model future AI runs use for this agent. Review conditions and target model before activating."
        confirmLabel="Activate"
        onConfirm={() => void panel.confirmActivate()}
      />
    </div>
  )
}
