'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { Typography, Button, Stack, Input, Select } from '@/shared/ui'
import { useIamDelegationCreate } from '../hooks/useIamDelegationCreate'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

const SUBJECT_TYPE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'ROLE', label: 'Role' },
  { value: 'TEAM', label: 'Team' },
]

export function AdminIamDelegationCreateView() {
  const searchParams = useSearchParams()
  const initialResourceRefId = useMemo(
    () => searchParams.get('resourceRefId') ?? searchParams.get('sourceGrantId') ?? '',
    [searchParams]
  )

  const { createDelegation, submitting, error } = useIamDelegationCreate()
  const [form, setForm] = useState({
    subjectType: 'USER',
    subjectId: '',
    resourceType: 'WORKSPACE',
    resourceRefId: initialResourceRefId,
    delegationDepth: '1',
    expiresAt: '',
    reason: '',
  })
  const [actions, setActions] = useState([{ permissionCode: '', actionCode: '' }])

  const canSubmit =
    form.subjectId.trim() &&
    form.resourceType.trim() &&
    form.resourceRefId.trim() &&
    Number.isFinite(Number(form.delegationDepth)) &&
    Number(form.delegationDepth) >= 0 &&
    actions.some((a) => a.permissionCode.trim() && a.actionCode.trim())

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      await createDelegation({
        subjectType: form.subjectType,
        subjectId: form.subjectId.trim(),
        resourceType: form.resourceType.trim().toUpperCase(),
        resourceRefId: form.resourceRefId.trim(),
        delegationDepth: Number(form.delegationDepth),
        expiresAt: form.expiresAt.trim()
          ? new Date(form.expiresAt).toISOString()
          : undefined,
        reason: form.reason.trim() || undefined,
        actions: actions
          .filter((a) => a.permissionCode.trim() && a.actionCode.trim())
          .map((a) => ({
            permissionCode: a.permissionCode.trim().toUpperCase(),
            actionCode: a.actionCode.trim().toUpperCase(),
          })),
      })
    } catch {
      // error already toasted in hook
    }
  }

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.iamDelegations}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to Delegations
      </NextLink>

      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Create delegation
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Delegate permission actions to another subject on a specific resource.
        </Typography>
      </div>

      <div className="max-w-xl border border-neutral-200 bg-white p-6">
        <Stack direction="vertical" spacing="md">
          <div>
            <Typography variant="small" tone="muted" className="mb-1.5">
              Subject type
            </Typography>
            <Select
              value={form.subjectType}
              onValueChange={(v: string) => setForm((f) => ({ ...f, subjectType: v }))}
              options={SUBJECT_TYPE_OPTIONS}
            />
          </div>
          <Input
            label="Subject ID"
            value={form.subjectId}
            onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
            placeholder="User, role, or team ID"
          />
          <Input
            label="Resource type"
            value={form.resourceType}
            onChange={(e) => setForm((f) => ({ ...f, resourceType: e.target.value }))}
            placeholder="WORKSPACE, PROJECT, …"
          />
          <Input
            label="Resource ref ID"
            value={form.resourceRefId}
            onChange={(e) => setForm((f) => ({ ...f, resourceRefId: e.target.value }))}
            placeholder="Target resource UUID"
          />
          <Input
            label="Delegation depth"
            type="number"
            min={0}
            value={form.delegationDepth}
            onChange={(e) => setForm((f) => ({ ...f, delegationDepth: e.target.value }))}
          />
          <Input
            label="Expires at (optional)"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
          />
          <Input
            label="Reason (optional)"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Typography variant="small" tone="muted">
                Actions
              </Typography>
              <Button
                variant="ghost"
                onClick={() =>
                  setActions((prev) => [...prev, { permissionCode: '', actionCode: '' }])
                }
              >
                <Plus size={14} className="mr-1" /> Add action
              </Button>
            </div>
            <Stack direction="vertical" spacing="sm">
              {actions.map((action, index) => (
                <div key={index} className="flex items-end gap-2">
                  <Input
                    label={index === 0 ? 'Permission code' : undefined}
                    value={action.permissionCode}
                    onChange={(e) =>
                      setActions((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, permissionCode: e.target.value } : row
                        )
                      )
                    }
                    placeholder="PROJECT_READ"
                    className="flex-1"
                  />
                  <Input
                    label={index === 0 ? 'Action code' : undefined}
                    value={action.actionCode}
                    onChange={(e) =>
                      setActions((prev) =>
                        prev.map((row, i) =>
                          i === index ? { ...row, actionCode: e.target.value } : row
                        )
                      )
                    }
                    placeholder="VIEW"
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    tone="error"
                    disabled={actions.length === 1}
                    onClick={() => setActions((prev) => prev.filter((_, i) => i !== index))}
                    aria-label="Remove action"
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </Stack>
          </div>

          {error && (
            <div className="border border-red-200 bg-red-50 p-3">
              <Typography variant="small" className="text-red-700">
                {error}
              </Typography>
            </div>
          )}

          <Stack direction="horizontal" spacing="sm">
            <Button
              variant="primary"
              disabled={submitting || !canSubmit}
              onClick={() => void handleSubmit()}
              icon={<Plus size={16} />}
            >
              {submitting ? 'Creating…' : 'Create delegation'}
            </Button>
            <NextLink
              href={ADMIN_ROUTES.iamDelegations}
              className="inline-flex items-center px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              Cancel
            </NextLink>
          </Stack>
        </Stack>
      </div>
    </div>
  )
}
