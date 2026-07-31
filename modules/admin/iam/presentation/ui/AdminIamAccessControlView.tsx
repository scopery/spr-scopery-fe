'use client'

import { ArrowLeft, ArrowRight, Play, Shield } from 'lucide-react'

import { useMemo, useState } from 'react'
import {
  Typography,
  Button,
  Stack,
  Select,
  Checkbox,
  ConfirmDialog,
  PageSkeleton, Card,
} from '@/shared/ui'
import { useGrantAccessWizard } from '../hooks/useGrantAccessWizard'
import type { IamRight } from '@/modules/auth/iam'
import { cn } from '@/utils/cn'
import { UserSearchSelect } from '@/modules/platform'
import { AdminOrganizationSearchSelect } from '@/modules/admin/organizations'
import { AdminWorkspaceSearchSelect } from '@/modules/admin/workspaces'
import { IamResourceSearchSelect } from './IamResourceSearchSelect'
import { IamRoleSearchSelect } from './IamRoleSearchSelect'
import { useIamIdentityDirectory } from '../hooks/useIamIdentityDirectory'

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
            <div className={cn('h-px w-8', n < current ? 'bg-primary' : 'bg-neutral-200')} />
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

export function AdminIamAccessControlView() {
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
  const { usersById, rolesById, resourcesById, workspacesById } = useIamIdentityDirectory({
    userIds: [form.subjectType === 'USER' ? form.subjectId : null],
    roleIds: [form.subjectType === 'ROLE' ? form.subjectId : null, form.roleId],
    resourceIds: [form.resourceId],
    workspaceIds: [form.workspaceId],
  })
  const subjectLabel =
    form.subjectType === 'USER'
      ? usersById[form.subjectId]?.fullName ||
        usersById[form.subjectId]?.username ||
        usersById[form.subjectId]?.email ||
        '—'
      : rolesById[form.subjectId]
        ? `${rolesById[form.subjectId].name} (${rolesById[form.subjectId].code})`
        : '—'
  const resourceLabel = resourcesById[form.resourceId]
    ? `${resourcesById[form.resourceId].name} (${resourcesById[form.resourceId].code})`
    : '—'
  const workspaceLabel = workspacesById[form.workspaceId]
    ? `${workspacesById[form.workspaceId].name} (${workspacesById[form.workspaceId].code})`
    : '—'
  const roleLabel = rolesById[form.roleId]
    ? `${rolesById[form.roleId].name} (${rolesById[form.roleId].code})`
    : '—'

  const handleSubmit = async () => {
    try {
      await submit()
      resetWizard()
    } catch {
      // error handled in hook
    } finally {
      setConfirmOpen(false)
    }
  }

  const STEP_LABELS = ['Select subject', 'Select scope', 'Select permissions', 'Review & confirm']

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Grant Access
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

        <Card className="mb-6 p-6">
          {step === 1 && (
            <Stack direction="vertical" spacing="md">
              <div>
                <Typography variant="small" tone="muted" className="mb-1.5">
                  Subject type
                </Typography>
                <Select
                  value={form.subjectType}
                  onValueChange={(v: string) => setField('subjectType', v as 'USER' | 'ROLE')}
                  options={SUBJECT_TYPE_OPTIONS}
                />
              </div>
              {form.subjectType === 'USER' ? (
                <UserSearchSelect
                  label="User"
                  value={form.subjectId}
                  onChange={(subjectId) => setField('subjectId', subjectId)}
                />
              ) : (
                <IamRoleSearchSelect
                  label="Subject role"
                  value={form.subjectId}
                  onChange={(subjectId) => setField('subjectId', subjectId)}
                />
              )}
            </Stack>
          )}

          {step === 2 && (
            <Stack direction="vertical" spacing="md">
              <IamResourceSearchSelect
                value={form.resourceId}
                onChange={(resourceId) => setField('resourceId', resourceId)}
              />
              <div>
                <Typography variant="small" tone="muted" className="mb-1.5">
                  Scope type
                </Typography>
                <Select
                  value={form.scopeType}
                  onValueChange={(v: string) => setField('scopeType', v)}
                  options={SCOPE_TYPE_OPTIONS}
                />
              </div>
              {form.scopeType === 'ORG' ? (
                <AdminOrganizationSearchSelect
                  value={form.scopeRefId}
                  onChange={(scopeRefId) => setField('scopeRefId', scopeRefId)}
                />
              ) : null}
              {form.scopeType === 'WORKSPACE' ? (
                <AdminWorkspaceSearchSelect
                  value={form.workspaceId}
                  onChange={(workspaceId) => {
                    setField('workspaceId', workspaceId)
                    setField('scopeRefId', workspaceId)
                  }}
                />
              ) : null}
              <div>
                <Typography variant="small" tone="muted" className="mb-1.5">
                  Effect
                </Typography>
                <Select
                  value={form.effect}
                  onValueChange={(v: string) => setField('effect', v as 'ALLOW' | 'DENY')}
                  options={EFFECT_OPTIONS}
                />
              </div>
              <IamRoleSearchSelect
                optional
                value={form.roleId}
                onChange={(roleId) => setField('roleId', roleId)}
              />
            </Stack>
          )}

          {step === 3 && (
            <div>
              {rightsLoading ? (
                <PageSkeleton variant="split" />
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
                      {form.rightIds.length} permission{form.rightIds.length !== 1 ? 's' : ''}{' '}
                      selected
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
                  { label: 'Subject', value: subjectLabel },
                  { label: 'Resource', value: resourceLabel },
                  { label: 'Scope type', value: form.scopeType },
                  ...(form.scopeRefId
                    ? [
                        {
                          label: 'Scope',
                          value:
                            form.scopeType === 'WORKSPACE'
                              ? workspaceLabel
                              : form.scopeType === 'ORG'
                                ? 'Selected organization'
                                : 'System',
                        },
                      ]
                    : []),
                  ...(form.workspaceId ? [{ label: 'Workspace', value: workspaceLabel }] : []),
                  { label: 'Effect', value: form.effect },
                  ...(form.roleId ? [{ label: 'Role', value: roleLabel }] : []),
                  {
                    label: 'Permissions',
                    value: form.rightIds.length > 0 ? `${form.rightIds.length} selected` : 'None',
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-4 px-4 py-3">
                    <Typography variant="small" tone="muted" className="w-32 shrink-0">
                      {label}
                    </Typography>
                    <Typography variant="small" weight="medium" className="flex-1 break-all">
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
        </Card>

        <Stack direction="horizontal" spacing="sm" className="justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={step === 1 || submitting}
            icon={<ArrowLeft size={16} />}
          >
            Back
          </Button>
          <Stack direction="horizontal" spacing="sm">
            {step < 4 ? (
              <Button
                variant="primary"
                onClick={nextStep}
                disabled={!canAdvance()}
                icon={<ArrowRight size={16} />}
              >
                Next
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  onClick={resetWizard}
                  disabled={submitting}
                  icon={<Play size={16} />}
                >
                  Start over
                </Button>
                <Button
                  variant="primary"
                  disabled={submitting}
                  onClick={() => setConfirmOpen(true)}
                  icon={<Shield size={16} />}
                >
                  {submitting ? 'Granting…' : 'Grant Access'}
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirm access grant"
        message={`Grant ${form.effect === 'ALLOW' ? 'access' : 'DENY'} to “${subjectLabel}” on “${resourceLabel}”? This action will take effect immediately.`}
        confirmLabel={submitting ? 'Granting…' : 'Grant Access'}
        onConfirm={() => void handleSubmit()}
        onClose={() => setConfirmOpen(false)}
        loading={submitting}
      />
    </div>
  )
}
