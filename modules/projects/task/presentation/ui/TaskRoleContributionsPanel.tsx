'use client'

import { useState } from 'react'
import { Button, CurrencyAmount, Input, Spinner, Typography } from '@/shared/ui'
import { UserSearchSelect, type PersonIdentity } from '@/modules/platform'
import { memberCostRolesApi, costRolesApi, rateResolutionApi } from '@/modules/rate-card'
import { useTaskRoleContributions } from '../hooks/useTaskRoleContributions'
import type { CreateTaskRoleContributionPayload } from '../../domain/model/task-role-contribution'

interface Props {
  projectId: string
  taskId: string
  workspaceId: string
  assigneePeople?: PersonIdentity[]
}

const EMPTY_FORM: CreateTaskRoleContributionPayload = {
  userId: null,
  costRoleName: '',
  plannedHours: 0,
  rateSnapshotPerHour: null,
  currencyCode: '',
  notes: '',
}

export function TaskRoleContributionsPanel({
  projectId,
  taskId,
  workspaceId,
  assigneePeople = [],
}: Props) {
  const { items, loading, error, add, remove } = useTaskRoleContributions(projectId, taskId)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateTaskRoleContributionPayload>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [lookingUpRate, setLookingUpRate] = useState(false)

  const handleUserSelect = async (userId: string) => {
    setForm((f) => ({ ...f, userId: userId || null, costRoleName: '', rateSnapshotPerHour: null, currencyCode: '' }))
    if (!userId || !workspaceId) return

    setLookingUpRate(true)
    try {
      const memberRoles = await memberCostRolesApi.listMemberCostRoles({
        workspaceId,
        userId,
        status: 'ACTIVE',
        size: 10,
      })
      const assignment = memberRoles.items.find((r) => r.isDefault) ?? memberRoles.items[0]
      if (!assignment) return

      const today = new Date().toISOString().slice(0, 10)
      const [costRoleResult, rateResult] = await Promise.allSettled([
        costRolesApi.getCostRole(assignment.costRoleId),
        rateResolutionApi.resolveRate({
          workspaceId,
          costRoleId: assignment.costRoleId,
          targetDate: today,
        }),
      ])

      setForm((f) => ({
        ...f,
        costRoleName:
          costRoleResult.status === 'fulfilled' ? costRoleResult.value.name : f.costRoleName,
        rateSnapshotPerHour:
          rateResult.status === 'fulfilled' ? rateResult.value.baseCostRate : f.rateSnapshotPerHour,
        currencyCode:
          rateResult.status === 'fulfilled' ? rateResult.value.currencyCode : f.currencyCode,
      }))
    } catch {
      // allow manual entry if lookup fails
    } finally {
      setLookingUpRate(false)
    }
  }

  const handleAdd = async () => {
    if (!form.plannedHours || form.plannedHours <= 0) {
      setFormError('Planned hours must be greater than 0')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      await add({
        ...form,
        userId: form.userId || null,
        costRoleName: (form.costRoleName as string | undefined)?.trim() || null,
        currencyCode: (form.currencyCode as string | undefined)?.trim() || null,
        notes: (form.notes as string | undefined)?.trim() || null,
      })
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to add contribution')
    } finally {
      setSaving(false)
    }
  }

  const handleRemove = async (id: string) => {
    setRemovingId(id)
    try {
      await remove(id)
    } finally {
      setRemovingId(null)
    }
  }

  const totalHours = items.reduce((sum, c) => sum + c.plannedHours, 0)
  const totalCost = items.reduce((sum, c) => sum + (c.estimatedCost ?? 0), 0)
  const defaultCurrency = items.find((c) => c.currencyCode)?.currencyCode ?? 'USD'

  return (
    <div className="space-y-sm">
      <div className="flex items-center justify-between">
        <Typography variant="caption" weight="medium" tone="muted" className="uppercase tracking-wide">
          Cost Contributors
        </Typography>
        {!showForm ? (
          <Button size="sm" variant="ghost" onClick={() => setShowForm(true)}>
            + Add
          </Button>
        ) : null}
      </div>

      {loading ? (
        <div className="flex items-center gap-xs py-sm">
          <Spinner size="xs" />
          <Typography variant="caption" tone="muted">Loading…</Typography>
        </div>
      ) : null}

      {error ? <Typography variant="caption" tone="error">{error}</Typography> : null}

      {!loading && items.length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 text-left">
              <th className="pb-xs pr-sm font-normal text-neutral-500">Role</th>
              <th className="pb-xs pr-sm text-right font-normal text-neutral-500">Hours</th>
              <th className="pb-xs pr-sm text-right font-normal text-neutral-500">Rate/hr</th>
              <th className="pb-xs text-right font-normal text-neutral-500">Est. Cost</th>
              <th className="pb-xs" />
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-b border-neutral-100">
                <td className="py-xs pr-sm">
                  <span>{c.costRoleName ?? c.costRoleCode ?? '—'}</span>
                  {c.notes ? (
                    <Typography variant="caption" tone="muted" className="block">
                      {c.notes}
                    </Typography>
                  ) : null}
                </td>
                <td className="py-xs pr-sm text-right">{c.plannedHours}h</td>
                <td className="py-xs pr-sm text-right">
                  {c.rateSnapshotPerHour != null ? (
                    <CurrencyAmount
                      amount={c.rateSnapshotPerHour}
                      currency={c.currencyCode ?? 'USD'}
                      size="sm"
                    />
                  ) : '—'}
                </td>
                <td className="py-xs text-right">
                  {c.estimatedCost != null ? (
                    <CurrencyAmount
                      amount={c.estimatedCost}
                      currency={c.currencyCode ?? 'USD'}
                      size="sm"
                    />
                  ) : '—'}
                </td>
                <td className="py-xs pl-sm">
                  <button
                    className="text-neutral-400 hover:text-red-500 disabled:opacity-40"
                    disabled={removingId === c.id}
                    onClick={() => void handleRemove(c.id)}
                    aria-label="Remove"
                  >
                    {removingId === c.id ? <Spinner size="xs" /> : '×'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-neutral-200 font-medium">
              <td className="pt-xs pr-sm text-neutral-600">Total</td>
              <td className="pt-xs pr-sm text-right text-neutral-600">{totalHours}h</td>
              <td />
              <td className="pt-xs text-right text-neutral-600">
                <CurrencyAmount amount={totalCost} currency={defaultCurrency} size="sm" />
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      ) : null}

      {!loading && items.length === 0 && !showForm ? (
        <Typography variant="caption" tone="muted">No cost contributors yet.</Typography>
      ) : null}

      {showForm ? (
        <div className="space-y-sm border border-neutral-200 bg-neutral-50 p-sm">
          {formError ? (
            <Typography variant="caption" tone="error">{formError}</Typography>
          ) : null}
          <UserSearchSelect
            label="Member (optional)"
            value={form.userId ?? ''}
            onChange={(userId) => void handleUserSelect(userId)}
            seedPeople={assigneePeople}
            allowRemoteSearch={false}
          />
          {lookingUpRate ? (
            <div className="flex items-center gap-xs">
              <Spinner size="xs" />
              <Typography variant="caption" tone="muted">Looking up rate…</Typography>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-sm">
            <Input
              label="Role name"
              size="sm"
              value={(form.costRoleName as string | undefined) ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, costRoleName: e.target.value }))}
              placeholder="e.g. Senior Dev"
            />
            <Input
              label="Planned hours"
              size="sm"
              type="number"
              min={0.01}
              step={0.5}
              value={form.plannedHours || ''}
              onChange={(e) =>
                setForm((f) => ({ ...f, plannedHours: parseFloat(e.target.value) || 0 }))
              }
            />
            <Input
              label="Rate / hr"
              size="sm"
              type="number"
              min={0}
              value={form.rateSnapshotPerHour ?? ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  rateSnapshotPerHour: e.target.value ? parseFloat(e.target.value) : null,
                }))
              }
              placeholder="0.00"
            />
            <Input
              label="Currency"
              size="sm"
              value={(form.currencyCode as string | undefined) ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value.toUpperCase() }))}
              placeholder="USD"
              maxLength={3}
            />
          </div>
          <Input
            label="Notes"
            size="sm"
            value={(form.notes as string | undefined) ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Optional"
          />
          <div className="flex gap-xs">
            <Button size="sm" disabled={saving} onClick={() => void handleAdd()}>
              {saving ? <Spinner size="xs" className="mr-xs" /> : null}
              Add
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={saving}
              onClick={() => {
                setShowForm(false)
                setForm(EMPTY_FORM)
                setFormError(null)
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
