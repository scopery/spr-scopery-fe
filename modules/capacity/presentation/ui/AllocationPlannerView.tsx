'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Archive, Ban, Check, Plus, RefreshCw } from 'lucide-react'
import { Badge, Button, Input, Modal, PageSkeleton, Select, Typography, Card } from '@/shared/ui'
import { PersonReferenceSelect } from '@/modules/platform'
import { useAllocationPlanner } from '../hooks/useAllocationPlanner'
import {
  allocationBarStyle,
  canEditAllocation,
  formatPercent,
  isAllocationActive,
  isAllocationArchived,
} from '../../domain/rules/capacity.rules'
import { AllocationType, CapacityEntityStatus } from '../../domain/enums/capacity.enum'
import type { CreateProjectAllocationPayload } from '../../domain/model/project-allocation'

const ALLOCATION_TYPE_OPTIONS = [
  { value: AllocationType.FullTime, label: 'Full time' },
  { value: AllocationType.PartTime, label: 'Part time' },
  { value: AllocationType.OnDemand, label: 'On demand' },
]

export function AllocationPlannerView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    projectFilter,
    setProjectFilter,
    statusFilter,
    setStatusFilter,
    groupedByMember,
    overAllocations,
    projects,
    memberOptions,
    selected,
    selectedId,
    setSelectedId,
    loading,
    error,
    saving,
    refetch,
    projectName,
    memberLabel,
    validateCreate,
    createAllocation,
    activate,
    deactivate,
    archive,
  } = useAllocationPlanner(workspaceId)

  const [showCreate, setShowCreate] = useState(false)
  const [formWarning, setFormWarning] = useState<string | null>(null)
  const [form, setForm] = useState({
    projectId: '',
    workspaceMemberId: '',
    allocationPercent: '50',
    allocationType: AllocationType.PartTime as string,
    startDate: fromDate,
    endDate: toDate,
    notes: '',
  })

  if (loading && groupedByMember.length === 0) return <PageSkeleton variant="split" />

  if (error) {
    return (
      <div className="border-error/30 bg-error/5 border p-4">
        <Typography variant="small" tone="error">
          {error}
        </Typography>
      </div>
    )
  }

  const projectOptions = [
    { value: 'ALL', label: 'All projects' },
    ...projects.map((p) => ({ value: p.id, label: `${p.name} (${p.code})` })),
  ]

  const statusOptions = [
    { value: CapacityEntityStatus.Active, label: 'Active' },
    { value: CapacityEntityStatus.Inactive, label: 'Inactive' },
    { value: CapacityEntityStatus.Archived, label: 'Archived' },
    { value: 'ALL', label: 'All statuses' },
  ]

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Allocation Planner
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Assign members to projects over time. Bars show schedule within the selected window;
            edit via form (no drag-resize in this slice).
          </Typography>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => {
            setFormWarning(null)
            setForm({
              projectId: '',
              workspaceMemberId: '',
              allocationPercent: '50',
              allocationType: AllocationType.PartTime,
              startDate: fromDate,
              endDate: toDate,
              notes: '',
            })
            setShowCreate(true)
          }}
        >
          Create allocation
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-sm">
        <Input
          label="From"
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <Input label="To" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        <div className="w-48">
          <Typography variant="small" weight="medium" className="mb-1">
            Project
          </Typography>
          <Select
            value={projectFilter}
            onValueChange={(v: string) => setProjectFilter(v)}
            options={projectOptions}
          />
        </div>
        <div className="w-40">
          <Typography variant="small" weight="medium" className="mb-1">
            Status
          </Typography>
          <Select
            value={statusFilter}
            onValueChange={(v: string) => setStatusFilter(v)}
            options={statusOptions}
          />
        </div>
        <Button
          variant="secondary"
          icon={<RefreshCw size={14} />}
          loading={loading}
          onClick={() => void refetch()}
        >
          Recalculate
        </Button>
      </div>

      <div className="grid gap-md xl:grid-cols-[1.7fr_1fr]">
        <Card className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-100 px-4 py-3">
            <Typography weight="semibold" variant="small">
              Resource allocations
            </Typography>
            <Typography variant="caption" tone="muted">
              Window {fromDate} → {toDate}
            </Typography>
          </div>

          {groupedByMember.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <Typography tone="muted" variant="small">
                No project allocations in this period.
              </Typography>
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {groupedByMember.map((group) => (
                <li key={group.memberId} className="px-4 py-3">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-sm">
                    <Typography weight="semibold" variant="small">
                      {memberLabel(group.memberId)}
                    </Typography>
                    <Badge size="sm" tone={group.totalPercent > 100 ? 'error' : 'neutral'}>
                      {formatPercent(group.totalPercent)} active
                    </Badge>
                  </div>
                  <div className="relative mb-2 h-8 bg-neutral-100">
                    {group.items.map((alloc) => {
                      const style = allocationBarStyle(
                        alloc.startDate,
                        alloc.endDate,
                        fromDate,
                        toDate
                      )
                      if (!style) return null
                      const overloaded = group.totalPercent > 100
                      return (
                        <button
                          key={alloc.id}
                          type="button"
                          title={`${projectName(alloc.projectId)} · ${alloc.allocationPercent}%`}
                          className={`absolute top-1 h-6 truncate px-1 text-left text-[10px] text-white ${
                            selectedId === alloc.id ? 'ring-2 ring-neutral-900' : ''
                          } ${
                            overloaded
                              ? 'bg-error'
                              : isAllocationActive(alloc)
                                ? 'bg-primary'
                                : 'bg-neutral-400'
                          }`}
                          style={{ left: style.left, width: style.width }}
                          onClick={() => setSelectedId(alloc.id)}
                        >
                          {alloc.allocationPercent}%
                        </button>
                      )
                    })}
                  </div>
                  <ul className="space-y-1">
                    {group.items.map((alloc) => (
                      <li key={`${alloc.id}-row`}>
                        <button
                          type="button"
                          className={`flex w-full items-center justify-between gap-sm px-1 py-1 text-left text-sm hover:bg-neutral-50 ${
                            selectedId === alloc.id ? 'bg-neutral-50' : ''
                          }`}
                          onClick={() => setSelectedId(alloc.id)}
                        >
                          <span className="truncate">
                            {projectName(alloc.projectId)} · {alloc.allocationType}
                          </span>
                          <span className="shrink-0 text-neutral-600">
                            {alloc.startDate} → {alloc.endDate} · {alloc.allocationPercent}%
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <aside className="flex flex-col gap-md">
          <Card className="border border-neutral-200 bg-white p-md">
            <Typography weight="semibold" variant="small" className="mb-sm">
              Selection
            </Typography>
            {!selected ? (
              <Typography tone="muted" variant="small">
                Select an allocation bar or row to inspect.
              </Typography>
            ) : (
              <div className="flex flex-col gap-sm">
                <Typography weight="medium">{projectName(selected.projectId)}</Typography>
                <Typography variant="small" tone="muted">
                  {memberLabel(selected.workspaceMemberId)}
                </Typography>
                <div className="flex flex-wrap gap-xs">
                  <Badge size="sm" tone="neutral">
                    {selected.allocationType}
                  </Badge>
                  <Badge
                    size="sm"
                    tone={selected.status === CapacityEntityStatus.Active ? 'success' : 'neutral'}
                  >
                    {selected.status}
                  </Badge>
                </div>
                <Typography variant="small">
                  {selected.allocationPercent}% · {selected.startDate} → {selected.endDate}
                </Typography>
                {selected.notes ? (
                  <Typography variant="caption" tone="muted">
                    {selected.notes}
                  </Typography>
                ) : null}
                <div className="mt-sm flex flex-wrap gap-1">
                  {canEditAllocation(selected) && !isAllocationActive(selected) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Check size={14} />}
                      onClick={() => void activate(selected.id)}
                    >
                      Activate
                    </Button>
                  ) : null}
                  {isAllocationActive(selected) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Ban size={14} />}
                      onClick={() => void deactivate(selected.id)}
                    >
                      Deactivate
                    </Button>
                  ) : null}
                  {!isAllocationArchived(selected) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<Archive size={14} />}
                      onClick={() => void archive(selected.id)}
                    >
                      Archive
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </Card>

          <Card className="border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-4 py-3">
              <Typography weight="semibold" variant="small">
                Over-allocations ({overAllocations.length})
              </Typography>
            </div>
            {overAllocations.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Typography tone="muted" variant="small">
                  No over-allocations in this window.
                </Typography>
              </div>
            ) : (
              <ul className="max-h-64 divide-y divide-neutral-100 overflow-y-auto">
                {overAllocations.map((row, i) => (
                  <li key={`${row.resourceProfileId}-${row.projectId}-${i}`} className="px-4 py-2">
                    <Typography variant="small" weight="medium">
                      {row.resourceDisplayName ?? 'Resource'}
                    </Typography>
                    <Typography variant="caption" tone="muted">
                      {row.projectName ?? 'Project'} · {formatPercent(row.utilizationPercent)}
                    </Typography>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create allocation"
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setShowCreate(false), variant: 'ghost' },
          {
            label: formWarning?.startsWith('Warning') ? 'Create anyway' : 'Create',
            variant: 'primary',
            loading: saving,
            onClick: async () => {
              const body: CreateProjectAllocationPayload = {
                projectId: form.projectId,
                workspaceMemberId: form.workspaceMemberId,
                allocationPercent: Number(form.allocationPercent),
                allocationType: form.allocationType as typeof AllocationType.PartTime,
                startDate: form.startDate,
                endDate: form.endDate,
                notes: form.notes.trim() || null,
              }
              const warning = validateCreate(body)
              if (warning && !warning.startsWith('Warning')) {
                setFormWarning(warning)
                return
              }
              if (warning?.startsWith('Warning') && formWarning !== warning) {
                setFormWarning(warning)
                return
              }
              await createAllocation(body)
              setShowCreate(false)
              setFormWarning(null)
            },
          },
        ]}
      >
        <div className="flex flex-col gap-3">
          {formWarning ? (
            <div
              className={`border p-3 ${
                formWarning.startsWith('Warning')
                  ? 'border-warning/40 bg-warning/10'
                  : 'border-error/30 bg-error/5'
              }`}
            >
              <Typography
                variant="small"
                tone={formWarning.startsWith('Warning') ? 'warning' : 'error'}
              >
                {formWarning}
              </Typography>
            </div>
          ) : null}
          <PersonReferenceSelect
            label="Member"
            value={form.workspaceMemberId}
            onChange={(v: string) => {
              setFormWarning(null)
              setForm((f) => ({ ...f, workspaceMemberId: v }))
            }}
            options={memberOptions}
            placeholder="Select member"
          />
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Project
            </Typography>
            <Select
              value={form.projectId}
              onValueChange={(v: string) => {
                setFormWarning(null)
                setForm((f) => ({ ...f, projectId: v }))
              }}
              options={projects.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.code})`,
              }))}
              placeholder="Select project"
            />
          </div>
          <Input
            label="Allocation percent"
            type="number"
            value={form.allocationPercent}
            onChange={(e) => {
              setFormWarning(null)
              setForm((f) => ({ ...f, allocationPercent: e.target.value }))
            }}
          />
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Type
            </Typography>
            <Select
              value={form.allocationType}
              onValueChange={(v: string) => setForm((f) => ({ ...f, allocationType: v }))}
              options={ALLOCATION_TYPE_OPTIONS}
            />
          </div>
          <Input
            label="Start"
            type="date"
            value={form.startDate}
            onChange={(e) => {
              setFormWarning(null)
              setForm((f) => ({ ...f, startDate: e.target.value }))
            }}
          />
          <Input
            label="End"
            type="date"
            value={form.endDate}
            onChange={(e) => {
              setFormWarning(null)
              setForm((f) => ({ ...f, endDate: e.target.value }))
            }}
          />
          <Input
            label="Notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
