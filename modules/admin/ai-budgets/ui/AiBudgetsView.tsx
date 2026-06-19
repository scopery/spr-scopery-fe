'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CircleArrowOutUpLeft, Plus, Pencil } from 'lucide-react'
import { Typography, Button, ContentLoader, Input, ConfirmDialog } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { FEATURES } from '@/config/features'
import { useAuth } from '@/modules/auth'
import { aiBudgetsApi } from '@/modules/admin'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import {
  AIBudgetStatusBadge,
  formatBudgetAmount,
  formatUsagePercent,
  useAiBudgets,
} from '@/modules/admin'
import type { AIBudgetListItem } from '@/modules/admin'

type FormState = {
  monthly_limit_amount: string
  monthly_limit_tokens: string
  warning_threshold_percent: string
  hard_limit_enabled: boolean
}

const EMPTY_FORM: FormState = {
  monthly_limit_amount: '',
  monthly_limit_tokens: '',
  warning_threshold_percent: '80',
  hard_limit_enabled: false,
}

export function AiBudgetsView() {
  const router = useRouter()
  const { profile } = useAuth()
  const orgId = profile?.default_org_id ?? ''

  const { overview, items, loading, refetch: refetchBudgets } = useAiBudgets(orgId || null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AIBudgetListItem | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [deactivateTarget, setDeactivateTarget] = useState<AIBudgetListItem | null>(null)
  const [hardLimitConfirmOpen, setHardLimitConfirmOpen] = useState(false)

  useEffect(() => {
    if (!FEATURES.aiAdminAgents) {
      router.replace(ROUTES.admin.templates)
    }
  }, [router])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  const openEdit = (item: AIBudgetListItem) => {
    setEditing(item)
    setForm({
      monthly_limit_amount: item.monthlyLimitAmount != null ? String(item.monthlyLimitAmount) : '',
      monthly_limit_tokens: item.monthlyLimitTokens != null ? String(item.monthlyLimitTokens) : '',
      warning_threshold_percent: String(item.warningThresholdPercent),
      hard_limit_enabled: item.hardLimitEnabled,
    })
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!orgId) return
    const amount = form.monthly_limit_amount.trim() ? Number(form.monthly_limit_amount) : null
    const tokens = form.monthly_limit_tokens.trim() ? Number(form.monthly_limit_tokens) : null
    if (amount == null && tokens == null) {
      toast.error('Enter a monthly amount limit and/or token quota.')
      return
    }
    if (amount != null && (Number.isNaN(amount) || amount < 0)) {
      toast.error('Monthly amount must be a non-negative number.')
      return
    }
    if (tokens != null && (Number.isNaN(tokens) || tokens < 0 || !Number.isInteger(tokens))) {
      toast.error('Monthly token quota must be a non-negative integer.')
      return
    }
    const threshold = Number(form.warning_threshold_percent)
    if (Number.isNaN(threshold) || threshold < 1 || threshold > 100) {
      toast.error('Warning threshold must be between 1 and 100.')
      return
    }

    const enablingHardLimit =
      form.hard_limit_enabled && (editing == null || !editing.hardLimitEnabled)
    if (enablingHardLimit) {
      setHardLimitConfirmOpen(true)
      return
    }

    await persistBudget()
  }

  const persistBudget = async () => {
    if (!orgId) return
    const amount = form.monthly_limit_amount.trim() ? Number(form.monthly_limit_amount) : null
    const tokens = form.monthly_limit_tokens.trim() ? Number(form.monthly_limit_tokens) : null
    const threshold = Number(form.warning_threshold_percent)

    setSaving(true)
    try {
      const payload = {
        monthly_limit_amount: amount,
        monthly_limit_tokens: tokens,
        warning_threshold_percent: threshold,
        hard_limit_enabled: form.hard_limit_enabled,
      }
      if (editing) {
        await aiBudgetsApi.updateBudget(orgId, editing.budgetId, payload)
        toast.success('Budget updated.')
      } else {
        await aiBudgetsApi.createBudget(orgId, payload)
        toast.success('Budget created.')
      }
      setFormOpen(false)
      await refetchBudgets()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async () => {
    if (!orgId || !deactivateTarget) return
    try {
      await aiBudgetsApi.deactivateBudget(orgId, deactivateTarget.budgetId)
      toast.success('Budget deactivated.')
      setDeactivateTarget(null)
      await refetchBudgets()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (!FEATURES.aiAdminAgents) return null

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl">
        <ContentLoader />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Link href="/" className="mb-2 inline-flex items-center gap-1 text-primary hover:underline">
          <CircleArrowOutUpLeft size={20} />
        </Link>
        <Typography as="h1" size="xl" weight="bold">
          AI Budgets
        </Typography>
        <Typography variant="small" tone="muted" className="mt-0.5">
          Configure monthly estimated cost and token guardrails for AI usage. Costs are estimated,
          not billed.
        </Typography>
      </div>

      {!orgId ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
          <Typography tone="muted">Select a default organization to manage AI budgets.</Typography>
        </div>
      ) : (
        <>
          {overview && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'Active budgets', value: overview.activeBudgets },
                { label: 'In warning', value: overview.budgetsInWarning },
                { label: 'Exceeded', value: overview.budgetsExceeded },
                {
                  label: 'Est. cost this month',
                  value: formatBudgetAmount(overview.totalCurrentEstimatedCost, overview.currency),
                },
              ].map((card) => (
                <div key={card.label} className="rounded-lg border border-neutral-200 bg-white p-4">
                  <Typography variant="xs" className="mb-1 uppercase text-neutral-500">
                    {card.label}
                  </Typography>
                  <Typography variant="lg" className="font-semibold">
                    {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                  </Typography>
                </div>
              ))}
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <Typography variant="small" tone="muted">
              Hard limits block AI runs after the budget is exceeded. Warning thresholds surface
              alerts without blocking unless hard limit is enabled and exceeded.
            </Typography>
            <Button size="sm" onClick={openCreate}>
              <Plus size={16} className="mr-1" />
              Create budget
            </Button>
          </div>

          {items.length === 0 ? (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-8 text-center">
              <Typography tone="muted">No AI budgets configured yet.</Typography>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
              <table className="min-w-full text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Scope</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Est. cost / limit</th>
                    <th className="px-4 py-3 font-medium">Tokens / quota</th>
                    <th className="px-4 py-3 font-medium">Threshold</th>
                    <th className="px-4 py-3 font-medium">Hard limit</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.budgetId}
                      className="border-b border-neutral-100 hover:bg-neutral-50"
                    >
                      <td className="px-4 py-3">
                        <Typography weight="medium">{item.scope.label}</Typography>
                        {item.scope.projectName ? (
                          <Typography variant="xs" tone="muted">
                            {item.scope.projectName}
                          </Typography>
                        ) : null}
                        {item.scope.agentName ? (
                          <Typography variant="xs" tone="muted">
                            {item.scope.agentName}
                          </Typography>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <AIBudgetStatusBadge status={item.statusLabel} />
                      </td>
                      <td className="px-4 py-3">
                        {formatBudgetAmount(item.currentMonthCost)} /{' '}
                        {formatBudgetAmount(item.monthlyLimitAmount)}
                        <Typography variant="xs" tone="muted" className="block">
                          {formatUsagePercent(item.costUsagePercent)}
                        </Typography>
                      </td>
                      <td className="px-4 py-3">
                        {item.currentMonthTokens.toLocaleString()} /{' '}
                        {item.monthlyLimitTokens?.toLocaleString() ?? '—'}
                        <Typography variant="xs" tone="muted" className="block">
                          {formatUsagePercent(item.tokenUsagePercent)}
                        </Typography>
                      </td>
                      <td className="px-4 py-3">{item.warningThresholdPercent}%</td>
                      <td className="px-4 py-3">{item.hardLimitEnabled ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {item.active ? (
                            <>
                              <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                                <Pencil size={14} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeactivateTarget(item)}
                              >
                                Deactivate
                              </Button>
                            </>
                          ) : (
                            <Typography variant="xs" tone="muted">
                              Inactive
                            </Typography>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-lg">
            <Typography as="h2" size="lg" weight="semibold" className="mb-4">
              {editing ? 'Edit budget' : 'Create budget'}
            </Typography>
            <div className="space-y-4">
              <div>
                <Typography variant="small" className="mb-1">
                  Monthly amount limit (USD, estimated)
                </Typography>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="e.g. 100"
                  value={form.monthly_limit_amount}
                  onChange={(e) => setForm((f) => ({ ...f, monthly_limit_amount: e.target.value }))}
                />
              </div>
              <div>
                <Typography variant="small" className="mb-1">
                  Monthly token quota
                </Typography>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  placeholder="e.g. 500000"
                  value={form.monthly_limit_tokens}
                  onChange={(e) => setForm((f) => ({ ...f, monthly_limit_tokens: e.target.value }))}
                />
              </div>
              <div>
                <Typography variant="small" className="mb-1">
                  Warning threshold (%)
                </Typography>
                <Input
                  type="number"
                  min={1}
                  max={100}
                  value={form.warning_threshold_percent}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, warning_threshold_percent: e.target.value }))
                  }
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.hard_limit_enabled}
                  onChange={(e) => setForm((f) => ({ ...f, hard_limit_enabled: e.target.checked }))}
                />
                Hard limit — block AI runs when exceeded
              </label>
              <Typography variant="xs" tone="muted">
                When enabled, AI runs are blocked after this budget is exceeded. Costs are estimated
                from token usage and model pricing when available.
              </Typography>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFormOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deactivateTarget)}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate budget?"
        message="This budget will no longer enforce limits. Existing usage data is unchanged."
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={handleDeactivate}
      />

      <ConfirmDialog
        open={hardLimitConfirmOpen}
        onClose={() => setHardLimitConfirmOpen(false)}
        title="Enable hard limit?"
        message="When enabled, AI runs are blocked after this budget is exceeded. This affects all matching AI features immediately."
        confirmLabel="Enable hard limit"
        onConfirm={async () => {
          setHardLimitConfirmOpen(false)
          await persistBudget()
        }}
        loading={saving}
      />
    </div>
  )
}
