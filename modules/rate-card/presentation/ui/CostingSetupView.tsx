'use client'

import { Archive, Ban, Check, Plus, UserPlus } from 'lucide-react'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Modal,
  Select,
  Stack,
  Typography,
  PageSkeleton,
} from '@/shared/ui'
import { useCostingSetup } from '../hooks/useCostingSetup'
import { CompoundFrequency, RateCardEntityStatus } from '../../domain/enums/rate-card.enum'
import {
  isCostRoleActive,
  isInflationPolicyActive,
  isMemberCostRoleActive,
} from '../../domain/rules/rate-card.rules'
import { useWorkspaceMembers } from '@/modules/admin/workspaces'
import { PersonReferenceSelect, useResolveUsers } from '@/modules/platform'

type SetupTab = 'cost-roles' | 'member-assignments' | 'inflation-policies'

const TABS: { id: SetupTab; label: string }[] = [
  { id: 'cost-roles', label: 'Cost Roles' },
  { id: 'member-assignments', label: 'Member Assignments' },
  { id: 'inflation-policies', label: 'Inflation Policies' },
]

const COMPOUND_FREQUENCY_OPTIONS = [
  { value: CompoundFrequency.Annual, label: 'Annual' },
  { value: CompoundFrequency.Monthly, label: 'Monthly' },
  { value: CompoundFrequency.None, label: 'None' },
]

export function CostingSetupView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    costRoles,
    inflationPolicies,
    memberCostRoles,
    loading,
    error,
    creatingCostRole,
    creatingInflationPolicy,
    creatingMemberCostRole,
    createCostRole,
    createInflationPolicy,
    createMemberCostRole,
    archiveCostRole,
    activateCostRole,
    deactivateCostRole,
    archiveInflationPolicy,
    activateInflationPolicy,
    deactivateInflationPolicy,
    archiveMemberCostRole,
  } = useCostingSetup(workspaceId)

  const [tab, setTab] = useState<SetupTab>('cost-roles')
  const [showCostRoleModal, setShowCostRoleModal] = useState(false)
  const [showInflationModal, setShowInflationModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)

  const [costRoleForm, setCostRoleForm] = useState({
    code: '',
    name: '',
    description: '',
    category: '',
  })
  const [inflationForm, setInflationForm] = useState({
    code: '',
    name: '',
    inflationPercent: '',
    compoundFrequency: CompoundFrequency.Annual as string,
    effectiveFrom: '',
    effectiveTo: '',
  })
  const [memberForm, setMemberForm] = useState({
    workspaceMemberId: '',
    costRoleId: '',
    isDefault: false,
    effectiveFrom: '',
    effectiveTo: '',
  })

  const costRoleOptions = useMemo(
    () => costRoles.map((role) => ({ value: role.id, label: `${role.name} (${role.code})` })),
    [costRoles]
  )
  const { items: workspaceMembers } = useWorkspaceMembers(workspaceId, {
    status: 'ACTIVE',
    page: 0,
    size: 200,
  })
  const { personFor } = useResolveUsers(workspaceMembers.map((member) => member.userId))
  const memberOptions = useMemo(
    () =>
      workspaceMembers.flatMap((member) => {
        const person = personFor(member.userId)
        return person ? [{ value: member.id, person }] : []
      }),
    [personFor, workspaceMembers]
  )

  if (loading) {
    return <PageSkeleton variant="list" />
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 p-4">
        <Typography variant="small" className="text-red-700">
          {error}
        </Typography>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-2">
        <Typography as="h1" size="md" weight="medium">
          Costing Setup
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Manage cost roles, member cost role assignments, and inflation policies for this
          workspace.
        </Typography>
      </div>

      <div className="mb-4 w-56">
        <Select
          value={tab}
          onValueChange={(v: string) => setTab(v as SetupTab)}
          options={TABS.map((t) => ({ value: t.id, label: t.label }))}
          placeholder="Select section"
        />
      </div>

      {tab === 'cost-roles' && (
        <Card className="border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <Typography weight="semibold" variant="small">
              Cost Roles ({costRoles.length})
            </Typography>
            <Button
              variant="primary"
              onClick={() => setShowCostRoleModal(true)}
              icon={<Plus size={16} />}
            >
              Add cost role
            </Button>
          </div>
          <DataTable
            ariaLabel="Cost roles"
            rows={costRoles}
            rowKey={(role) => role.id}
            emptyMessage="No cost roles yet."
            columns={[
              { id: 'code', header: 'Code', accessor: (role) => role.code || '—', kind: 'code' },
              { id: 'name', header: 'Name', accessor: (role) => role.name || '—' },
              { id: 'category', header: 'Category', accessor: (role) => role.category ?? '—' },
              {
                id: 'status',
                header: 'Status',
                cell: (role) => (
                  <Badge variant="solid" tone={isCostRoleActive(role) ? 'success' : 'neutral'}>
                    {role.status === RateCardEntityStatus.Active
                      ? 'Active'
                      : role.status === RateCardEntityStatus.Inactive
                        ? 'Inactive'
                        : 'Archived'}
                  </Badge>
                ),
              },
              {
                id: 'actions',
                header: 'Actions',
                align: 'right',
                cell: (role) => (
                  <div className="flex flex-nowrap items-center justify-end gap-1">
                    {isCostRoleActive(role) ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => void deactivateCostRole(role.id)}
                          icon={<Ban size={16} />}
                        >
                          Deactivate
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => void archiveCostRole(role.id)}
                          icon={<Archive size={16} />}
                        >
                          Archive
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => void activateCostRole(role.id)}
                        icon={<Check size={16} />}
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      {tab === 'member-assignments' && (
        <Card className="border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <Typography weight="semibold" variant="small">
              Member Assignments ({memberCostRoles.length})
            </Typography>
            <Button
              variant="primary"
              disabled={costRoles.length === 0}
              onClick={() => setShowMemberModal(true)}
              icon={<UserPlus size={16} />}
            >
              Assign cost role
            </Button>
          </div>
          <DataTable
            ariaLabel="Member cost role assignments"
            rows={memberCostRoles}
            rowKey={(assignment) => assignment.id}
            emptyMessage="No member cost role assignments yet."
            columns={[
              {
                id: 'member',
                header: 'Member',
                accessor: (assignment) =>
                  memberOptions.find((member) => member.value === assignment.workspaceMemberId)
                    ?.person.fullName ?? '—',
                kind: 'reference',
              },
              {
                id: 'role',
                header: 'Cost Role',
                accessor: (assignment) => {
                  const role = costRoles.find((item) => item.id === assignment.costRoleId)
                  return role ? `${role.name} (${role.code})` : '—'
                },
                kind: 'reference',
              },
              {
                id: 'effective',
                header: 'Effective',
                accessor: (assignment) =>
                  `${assignment.effectiveFrom} → ${assignment.effectiveTo ?? '∞'}`,
              },
              {
                id: 'default',
                header: 'Default',
                accessor: (assignment) => (assignment.isDefault ? 'Yes' : '—'),
              },
              {
                id: 'status',
                header: 'Status',
                cell: (assignment) => (
                  <Badge
                    variant="solid"
                    tone={isMemberCostRoleActive(assignment) ? 'success' : 'neutral'}
                  >
                    {isMemberCostRoleActive(assignment) ? 'Active' : 'Archived'}
                  </Badge>
                ),
              },
              {
                id: 'actions',
                header: 'Actions',
                align: 'right',
                cell: (assignment) =>
                  isMemberCostRoleActive(assignment) ? (
                    <Button
                      variant="ghost"
                      onClick={() => void archiveMemberCostRole(assignment.id)}
                      icon={<Archive size={16} />}
                    >
                      Archive
                    </Button>
                  ) : (
                    '—'
                  ),
              },
            ]}
          />
        </Card>
      )}

      {tab === 'inflation-policies' && (
        <Card className="border border-neutral-200 bg-white">
          <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
            <Typography weight="semibold" variant="small">
              Inflation Policies ({inflationPolicies.length})
            </Typography>
            <Button
              variant="primary"
              onClick={() => setShowInflationModal(true)}
              icon={<Plus size={16} />}
            >
              Add inflation policy
            </Button>
          </div>
          <DataTable
            ariaLabel="Inflation policies"
            rows={inflationPolicies}
            rowKey={(policy) => policy.id}
            emptyMessage="No inflation policies yet."
            columns={[
              {
                id: 'code',
                header: 'Code',
                accessor: (policy) => policy.code || '—',
                kind: 'code',
              },
              { id: 'name', header: 'Name', accessor: (policy) => policy.name || '—' },
              { id: 'rate', header: 'Rate', accessor: (policy) => `${policy.inflationPercent}%` },
              { id: 'frequency', header: 'Frequency', accessor: 'compoundFrequency' },
              {
                id: 'effective',
                header: 'Effective',
                accessor: (policy) => `${policy.effectiveFrom} → ${policy.effectiveTo ?? '∞'}`,
              },
              {
                id: 'status',
                header: 'Status',
                cell: (policy) => (
                  <Badge
                    variant="solid"
                    tone={isInflationPolicyActive(policy) ? 'success' : 'neutral'}
                  >
                    {policy.status === RateCardEntityStatus.Active
                      ? 'Active'
                      : policy.status === RateCardEntityStatus.Inactive
                        ? 'Inactive'
                        : 'Archived'}
                  </Badge>
                ),
              },
              {
                id: 'actions',
                header: 'Actions',
                align: 'right',
                cell: (policy) => (
                  <div className="flex flex-nowrap items-center justify-end gap-1">
                    {isInflationPolicyActive(policy) ? (
                      <>
                        <Button
                          variant="ghost"
                          onClick={() => void deactivateInflationPolicy(policy.id)}
                          icon={<Ban size={16} />}
                        >
                          Deactivate
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => void archiveInflationPolicy(policy.id)}
                          icon={<Archive size={16} />}
                        >
                          Archive
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        onClick={() => void activateInflationPolicy(policy.id)}
                        icon={<Check size={16} />}
                      >
                        Activate
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      )}

      <Modal
        open={showCostRoleModal}
        onClose={() => setShowCostRoleModal(false)}
        title="Add cost role"
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setShowCostRoleModal(false), variant: 'ghost' },
          {
            label: creatingCostRole ? 'Creating…' : 'Create',
            onClick: async () => {
              await createCostRole({
                code: costRoleForm.code.trim(),
                name: costRoleForm.name.trim(),
                description: costRoleForm.description.trim() || undefined,
                category: costRoleForm.category.trim() || undefined,
              })
              setShowCostRoleModal(false)
              setCostRoleForm({ code: '', name: '', description: '', category: '' })
            },
            variant: 'primary',
            loading: creatingCostRole,
            disabled: !costRoleForm.code.trim() || !costRoleForm.name.trim(),
          },
        ]}
      >
        <Stack direction="vertical" spacing="md">
          <Input
            label="Code"
            value={costRoleForm.code}
            onChange={(e) => setCostRoleForm((f) => ({ ...f, code: e.target.value }))}
          />
          <Input
            label="Name"
            value={costRoleForm.name}
            onChange={(e) => setCostRoleForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Category (optional)"
            value={costRoleForm.category}
            onChange={(e) => setCostRoleForm((f) => ({ ...f, category: e.target.value }))}
          />
          <Input
            label="Description (optional)"
            value={costRoleForm.description}
            onChange={(e) => setCostRoleForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Stack>
      </Modal>

      <Modal
        open={showInflationModal}
        onClose={() => setShowInflationModal(false)}
        title="Add inflation policy"
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setShowInflationModal(false), variant: 'ghost' },
          {
            label: creatingInflationPolicy ? 'Creating…' : 'Create',
            onClick: async () => {
              await createInflationPolicy({
                code: inflationForm.code.trim(),
                name: inflationForm.name.trim(),
                inflationPercent: Number(inflationForm.inflationPercent),
                compoundFrequency: inflationForm.compoundFrequency,
                effectiveFrom: inflationForm.effectiveFrom,
                effectiveTo: inflationForm.effectiveTo || undefined,
              })
              setShowInflationModal(false)
              setInflationForm({
                code: '',
                name: '',
                inflationPercent: '',
                compoundFrequency: CompoundFrequency.Annual,
                effectiveFrom: '',
                effectiveTo: '',
              })
            },
            variant: 'primary',
            loading: creatingInflationPolicy,
            disabled:
              !inflationForm.code.trim() ||
              !inflationForm.name.trim() ||
              !inflationForm.inflationPercent ||
              !inflationForm.effectiveFrom,
          },
        ]}
      >
        <Stack direction="vertical" spacing="md">
          <Input
            label="Code"
            value={inflationForm.code}
            onChange={(e) => setInflationForm((f) => ({ ...f, code: e.target.value }))}
          />
          <Input
            label="Name"
            value={inflationForm.name}
            onChange={(e) => setInflationForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            label="Inflation percent"
            type="number"
            step="0.01"
            value={inflationForm.inflationPercent}
            onChange={(e) => setInflationForm((f) => ({ ...f, inflationPercent: e.target.value }))}
          />
          <div>
            <Typography variant="small" tone="muted" className="mb-1.5">
              Compound frequency
            </Typography>
            <Select
              value={inflationForm.compoundFrequency}
              onValueChange={(v: string) =>
                setInflationForm((f) => ({ ...f, compoundFrequency: v }))
              }
              options={COMPOUND_FREQUENCY_OPTIONS}
            />
          </div>
          <Input
            label="Effective from"
            type="date"
            value={inflationForm.effectiveFrom}
            onChange={(e) => setInflationForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
          />
          <Input
            label="Effective to (optional)"
            type="date"
            value={inflationForm.effectiveTo}
            onChange={(e) => setInflationForm((f) => ({ ...f, effectiveTo: e.target.value }))}
          />
        </Stack>
      </Modal>

      <Modal
        open={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        title="Assign cost role to member"
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setShowMemberModal(false), variant: 'ghost' },
          {
            label: creatingMemberCostRole ? 'Assigning…' : 'Assign',
            onClick: async () => {
              await createMemberCostRole({
                workspaceMemberId: memberForm.workspaceMemberId.trim(),
                costRoleId: memberForm.costRoleId,
                isDefault: memberForm.isDefault,
                effectiveFrom: memberForm.effectiveFrom,
                effectiveTo: memberForm.effectiveTo || undefined,
              })
              setShowMemberModal(false)
              setMemberForm({
                workspaceMemberId: '',
                costRoleId: '',
                isDefault: false,
                effectiveFrom: '',
                effectiveTo: '',
              })
            },
            variant: 'primary',
            loading: creatingMemberCostRole,
            disabled:
              !memberForm.workspaceMemberId.trim() ||
              !memberForm.costRoleId ||
              !memberForm.effectiveFrom,
          },
        ]}
      >
        <Stack direction="vertical" spacing="md">
          <PersonReferenceSelect
            label="Workspace member"
            value={memberForm.workspaceMemberId}
            options={memberOptions}
            onChange={(workspaceMemberId) =>
              setMemberForm((current) => ({ ...current, workspaceMemberId }))
            }
          />
          <div>
            <Typography variant="small" tone="muted" className="mb-1.5">
              Cost role
            </Typography>
            <Select
              value={memberForm.costRoleId}
              onValueChange={(v: string) => setMemberForm((f) => ({ ...f, costRoleId: v }))}
              options={costRoleOptions}
              placeholder="Select a cost role"
            />
          </div>
          <Input
            label="Effective from"
            type="date"
            value={memberForm.effectiveFrom}
            onChange={(e) => setMemberForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
          />
          <Input
            label="Effective to (optional)"
            type="date"
            value={memberForm.effectiveTo}
            onChange={(e) => setMemberForm((f) => ({ ...f, effectiveTo: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={memberForm.isDefault}
              onChange={(e) => setMemberForm((f) => ({ ...f, isDefault: e.target.checked }))}
            />
            Default assignment
          </label>
        </Stack>
      </Modal>
    </div>
  )
}
