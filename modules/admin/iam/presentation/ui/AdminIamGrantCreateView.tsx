'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'
import { ArrowLeft, ArrowRight, Play, Plus } from 'lucide-react'
import { Typography, Button, Stack, Input, Select, Checkbox, ConfirmDialog, PageSkeleton } from '@/shared/ui'
import { useGrantAccessWizard } from '../hooks/useGrantAccessWizard'
import type { IamRight } from '@/modules/auth/iam'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { cn } from '@/utils/cn'

const SUBJECT_TYPE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'ROLE', label: 'Role' },
]

const SCOPE_TYPE_OPTIONS = [
  { value: 'SYSTEM', label: 'System' },
  { value: 'ORG', label: 'Organization' },
  { value: 'WORKSPACE', label: 'Workspace' },
]

const EFFECT_OPTIONS = [
  { value: 'ALLOW', label: 'Allow' },
  { value: 'DENY', label: 'Deny' },
]

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="mb-8 flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div
            className={cn(
              'flex h-7 w-7 items-center justify-center text-xs font-semibold',
              n < current
                ? 'bg-primary text-white'
                : n === current
                  ? 'border-2 border-primary text-primary'
                  : 'border border-neutral-300 text-neutral-400'
            )}
          >
            {n}
          </div>
          {n < total && (
            <div
              className={cn('h-px w-8', n < current ? 'bg-primary' : 'bg-neutral-200')}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function groupByModule(items: IamRight[]): [string, IamRight[]][] {
  const map = new Map<string, IamRight[]>()
  for (const right of items) {
    const key = right.module ?? 'Other'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(right)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}

export function AdminIamGrantCreateView() {
  const router = useRouter()
  const {
    step,
    form,
    setField,
    toggleRight,
    nextStep,
    prevStep,
    canAdvance,
    submitting,
    submitError,
    submit,
    resetWizard,
    availableRights,
    rightsLoading,
  } = useGrantAccessWizard()

  const [confirmOpen, setConfirmOpen] = useState(false)

  const groupedRights = useMemo(() => groupByModule(availableRights), [availableRights])

  const handleSubmit = async () => {
    try {
      await submit()
      resetWizard()
      router.push(ADMIN_ROUTES.iamGrants)
    } catch {
      // error handled in hook
    } finally {
      setConfirmOpen(false)
    }
  }

  const STEP_LABELS = ['Select subject', 'Select scope', 'Select permissions', 'Review & confirm']

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.iamGrants}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to Grants
      </NextLink>

      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Create access grant
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Assign access in 4 steps: select who, select scope, select permissions, then review.
        </Typography>
      </div>

      <div className="mx-auto max-w-2xl">
        <StepIndicator current={step} total={4} />

        <div className="mb-2">
          <Typography as="h2" size="lg" weight="semibold">
            Step {step}: {STEP_LABELS[step - 1]}
          </Typography>
        </div>

        <div className="mb-6 border border-neutral-200 bg-white p-6">
          {step === 1 && (
            <Stack direction="vertical" spacing="md">
              <div>
                <Typography variant="small" tone="muted" className="mb-1.5">Subject type</Typography>
                <Select
                  value={form.subjectType}
                  onValueChange={(v: string) => setField('subjectType', v as 'USER' | 'ROLE')}
                  options={SUBJECT_TYPE_OPTIONS}
                />
              </div>
              <Input
                label={form.subjectType === 'USER' ? 'User ID' : 'Role ID'}
                value={form.subjectId}
                onChange={(e) => setField('subjectId', e.target.value)}
                placeholder={`Enter ${form.subjectType === 'USER' ? 'user' : 'role'} ID`}
              />
            </Stack>
          )}

          {step === 2 && (
            <Stack direction="vertical" spacing="md">
              <Input
                label="Resource ID"
                value={form.resourceId}
                onChange={(e) => setField('resourceId', e.target.value)}
                placeholder="Enter resource ID"
              />
              <div>
                <Typography variant="small" tone="muted" className="mb-1.5">Scope type</Typography>
                <Select
                  value={form.scopeType}
                  onValueChange={(v: string) => setField('scopeType', v)}
                  options={SCOPE_TYPE_OPTIONS}
                />
              </div>
              {(form.scopeType === 'ORG' || form.scopeType === 'WORKSPACE') && (
                <Input
                  label="Scope reference ID"
                  value={form.scopeRefId}
                  onChange={(e) => setField('scopeRefId', e.target.value)}
                  placeholder="Enter org or workspace ID"
                />
              )}
              {form.scopeType === 'WORKSPACE' && (
                <Input
                  label="Workspace ID (required for workspace scope)"
                  value={form.workspaceId}
                  onChange={(e) => setField('workspaceId', e.target.value)}
                  placeholder="Enter workspace ID"
                />
              )}
              <div>
                <Typography variant="small" tone="muted" className="mb-1.5">Effect</Typography>
                <Select
                  value={form.effect}
                  onValueChange={(v: string) => setField('effect', v as 'ALLOW' | 'DENY')}
                  options={EFFECT_OPTIONS}
                />
              </div>
              <Input
                label="Role ID (optional)"
                value={form.roleId}
                onChange={(e) => setField('roleId', e.target.value)}
                placeholder="Leave empty to grant directly"
              />
            </Stack>
          )}

          {step === 3 && (
            <div>
              {rightsLoading ? (
                <PageSkeleton variant="list" />
              ) : (
                <div className="space-y-4">
                  <Typography variant="small" tone="muted">
                    Select the permissions to include in this grant. Leave empty to create a grant
                    without specific rights.
                  </Typography>
                  {groupedRights.map(([module, rights]) => (
                    <div key={module} className="border border-neutral-200">
                      <div className="border-b border-neutral-100 bg-neutral-50 px-3 py-2">
                        <Typography size="sm" weight="semibold" className="uppercase tracking-wide">
                          {module}
                        </Typography>
                      </div>
                      <div className="divide-y divide-neutral-50">
                        {rights.map((right) => (
                          <label
                            key={right.id}
                            className="flex cursor-pointer items-start gap-3 px-3 py-2 hover:bg-neutral-50"
                          >
                            <Checkbox
                              checked={form.rightIds.includes(right.id)}
                              onChange={() => toggleRight(right.id)}
                              className="mt-0.5"
                            />
                            <div>
                              <Typography size="sm" weight="medium" className="font-mono">
                                {right.code}
                              </Typography>
                              {right.name && (
                                <Typography variant="small" tone="muted">
                                  {right.name}
                                </Typography>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  {form.rightIds.length > 0 && (
                    <Typography variant="small" className="text-primary">
                      {form.rightIds.length} permission{form.rightIds.length !== 1 ? 's' : ''} selected
                    </Typography>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <Typography variant="small" tone="muted">
                Review the access grant before confirming. This action cannot be undone without
                revoking the grant manually.
              </Typography>
              <div className="divide-y divide-neutral-100 border border-neutral-200">
                {[
                  { label: 'Subject type', value: form.subjectType },
                  { label: 'Subject ID', value: form.subjectId, mono: true },
                  { label: 'Resource ID', value: form.resourceId, mono: true },
                  { label: 'Scope type', value: form.scopeType },
                  ...(form.scopeRefId ? [{ label: 'Scope ref ID', value: form.scopeRefId, mono: true }] : []),
                  ...(form.workspaceId ? [{ label: 'Workspace ID', value: form.workspaceId, mono: true }] : []),
                  { label: 'Effect', value: form.effect },
                  ...(form.roleId ? [{ label: 'Role ID', value: form.roleId, mono: true }] : []),
                  {
                    label: 'Permissions',
                    value: form.rightIds.length > 0 ? `${form.rightIds.length} selected` : 'None',
                  },
                ].map(({ label, value, mono }) => (
                  <div key={label} className="flex items-start gap-4 px-4 py-3">
                    <Typography variant="small" tone="muted" className="w-32 shrink-0">
                      {label}
                    </Typography>
                    <Typography
                      variant="small"
                      weight="medium"
                      className={cn('flex-1 break-all', mono && 'font-mono text-xs')}
                    >
                      {value}
                    </Typography>
                  </div>
                ))}
              </div>

              {form.effect === 'DENY' && (
                <div className="border border-orange-200 bg-orange-50 p-3">
                  <Typography variant="small" className="text-orange-700">
                    Warning: You are creating a DENY grant. This will explicitly block the subject
                    from the specified resource.
                  </Typography>
                </div>
              )}

              {submitError && (
                <div className="border border-red-200 bg-red-50 p-3">
                  <Typography variant="small" className="text-red-700">
                    {submitError}
                  </Typography>
                </div>
              )}
            </div>
          )}
        </div>

        <Stack direction="horizontal" spacing="sm" className="justify-between">
          <Button variant="outline" onClick={prevStep} disabled={step === 1 || submitting} icon={<ArrowLeft size={16} />}>
            Back
          </Button>
          <Stack direction="horizontal" spacing="sm">
            {step < 4 ? (
              <Button
                variant="primary"
                onClick={nextStep}
                disabled={!canAdvance()} icon={<ArrowRight size={16} />}>
                Next
              </Button>
            ) : (
              <>
                <Button variant="ghost" onClick={resetWizard} disabled={submitting} icon={<Play size={16} />}>
                  Start over
                </Button>
                <Button
                  variant="primary"
                  disabled={submitting}
                  onClick={() => setConfirmOpen(true)}
                  icon={<Plus size={16} />}
                >
                  {submitting ? 'Granting…' : 'Create grant'}
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm access grant"
        message={`Grant ${form.effect === 'ALLOW' ? 'access' : 'DENY'} to subject "${form.subjectId}" on resource "${form.resourceId}"? This action will take effect immediately.`}
        confirmLabel={submitting ? 'Granting…' : 'Create grant'}
        onConfirm={() => void handleSubmit()}
        onClose={() => setConfirmOpen(false)}
        loading={submitting}
      />
    </div>
  )
}
