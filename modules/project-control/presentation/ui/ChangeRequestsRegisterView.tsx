'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Modal,
  PageSkeleton,
  Select,
  Textarea,
  Typography,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ROUTES } from '@/constants/routes'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import { useChangeRequests } from '../hooks/useChangeRequests'
import * as api from '../../infrastructure/api/project-control.api'
import {
  changeTypeLabel,
  crStatusBadgeVariant,
  crStatusLabel,
  crStatusTone,
  priorityLabel,
  priorityTone,
} from '../../domain/rules/project-control.rules'
import {
  ChangePriority,
  ChangeRequestStatus,
  ChangeType,
} from '../../domain/enums/project-control.enum'
import type { CreateChangeRequestPayload } from '../../domain/model/project-control'

const BOARD_COLUMNS = [
  ChangeRequestStatus.Draft,
  ChangeRequestStatus.Submitted,
  ChangeRequestStatus.Approved,
  ChangeRequestStatus.Rejected,
  ChangeRequestStatus.Applied,
] as const

export function ChangeRequestsRegisterView() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const [createOpen, setCreateOpen] = useState(false)
  const [baselines, setBaselines] = useState<Array<{ id: string; label: string }>>([])
  const { project } = useProject(workspaceId, projectId)
  const {
    items,
    allItems,
    loading,
    error,
    forbidden,
    statusFilter,
    setStatusFilter,
    view,
    setView,
    create,
  } = useChangeRequests(projectId)

  useEffect(() => {
    if (!projectId) return
    void api
      .listBaselines(projectId)
      .then((list) =>
        setBaselines(
          list.map((b) => ({
            id: b.id,
            label: `${b.name} (#${b.baselineNumber})`,
          }))
        )
      )
      .catch(() => setBaselines([]))
  }, [projectId])

  if (loading && allItems.length === 0) return <PageSkeleton variant="list" />
  if (forbidden) {
    return (
      <Card className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to change requests</Typography>
      </Card>
    )
  }

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Change Requests"
      />

      <div className="mb-2 mt-1 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Change Requests
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-0.5">
            Draft → submit → approve → apply against a baseline
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={view === 'register' ? 'primary' : 'ghost'}
            onClick={() => setView('register')}
          >
            Register
          </Button>
          <Button
            size="sm"
            variant={view === 'board' ? 'primary' : 'ghost'}
            onClick={() => setView('board')}
          >
            Board
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Create CR
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      {view === 'register' ? (
        <>
          <div className="mb-4 max-w-xs">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All statuses' },
                ...Object.values(ChangeRequestStatus).map((s) => ({
                  value: s,
                  label: crStatusLabel(s),
                })),
              ]}
            />
          </div>
          <DataTable
            ariaLabel="Change requests"
            rows={items}
            rowKey={(request) => request.id}
            emptyMessage="No change requests"
            columns={[
              {
                id: 'codeTitle',
                header: 'Code / Title',
                kind: 'code',
                cell: (cr) => (
                  <NextLink
                    href={ROUTES.workspace.projectChangeRequest(workspaceId, projectId, cr.id)}
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {cr.code} · {cr.title}
                  </NextLink>
                ),
              },
              { id: 'type', header: 'Type', accessor: (cr) => changeTypeLabel(cr.changeType) },
              {
                id: 'priority',
                header: 'Priority',
                cell: (cr) => (
                  <Badge size="sm" variant="solid" tone={priorityTone(cr.priority)}>
                    {cr.priority}
                  </Badge>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                cell: (cr) => (
                  <Badge
                    variant={crStatusBadgeVariant(cr.status)}
                    tone={crStatusTone(cr.status)}
                  >
                    {crStatusLabel(cr.status)}
                  </Badge>
                ),
              },
              {
                id: 'updated',
                header: 'Updated',
                accessor: (cr) => new Date(cr.updatedAt).toLocaleString(),
              },
            ]}
          />
        </>
      ) : (
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {BOARD_COLUMNS.map((col) => {
            const colItems = allItems.filter((i) => i.status === col)
            return (
              <Card key={col} className="border border-neutral-200 bg-neutral-50 p-2">
                <Typography variant="small" weight="semibold" className="mb-2 px-1">
                  {crStatusLabel(col)} ({colItems.length})
                </Typography>
                <div className="space-y-2">
                  {colItems.map((cr) => (
                    <Card
                      as={NextLink}
                      key={cr.id}
                      href={ROUTES.workspace.projectChangeRequest(workspaceId, projectId, cr.id)}
                      className="block border border-neutral-200 bg-white p-2 hover:border-primary"
                    >
                      <Typography variant="small" weight="medium">
                        {cr.code}
                      </Typography>
                      <Typography variant="caption" tone="muted" className="block">
                        {cr.title}
                      </Typography>
                    </Card>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <CreateChangeRequestModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        baselines={baselines}
        onSubmit={async (body) => {
          try {
            const created = await create(body)
            toast.success('Change request created')
            if (created) {
              router.push(ROUTES.workspace.projectChangeRequest(workspaceId, projectId, created.id))
            }
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}

function CreateChangeRequestModal({
  open,
  onClose,
  baselines,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  baselines: Array<{ id: string; label: string }>
  onSubmit: (body: CreateChangeRequestPayload) => Promise<void>
}) {
  const [code, setCode] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [reason, setReason] = useState('')
  const [baselineId, setBaselineId] = useState('')
  const [changeType, setChangeType] = useState<string>(ChangeType.ScopeChange)
  const [priority, setPriority] = useState<string>(ChangePriority.Medium)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setCode('')
    setTitle('')
    setDescription('')
    setReason('')
    setBaselineId(baselines[0]?.id ?? '')
    setChangeType(ChangeType.ScopeChange)
    setPriority(ChangePriority.Medium)
  }, [open, baselines])

  const canSubmit = code.trim() && title.trim() && reason.trim() && baselineId

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create change request"
      size="lg"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Create',
          variant: 'primary',
          loading,
          disabled: !canSubmit,
          onClick: () => {
            void (async () => {
              setLoading(true)
              try {
                await onSubmit({
                  code: code.trim(),
                  title: title.trim(),
                  description: description.trim() || null,
                  changeType: changeType as CreateChangeRequestPayload['changeType'],
                  priority: priority as CreateChangeRequestPayload['priority'],
                  baselineId,
                  reason: reason.trim(),
                })
                onClose()
              } finally {
                setLoading(false)
              }
            })()
          },
        },
      ]}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Code"
            fullWidth
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="CR-001"
          />
          <Input
            label="Title"
            fullWidth
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Baseline
          </Typography>
          <Select
            value={baselineId}
            onValueChange={setBaselineId}
            options={baselines.map((b) => ({ value: b.id, label: b.label }))}
            placeholder={baselines.length ? 'Select baseline' : 'No baselines'}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Type
            </Typography>
            <Select
              value={changeType}
              onValueChange={setChangeType}
              options={Object.values(ChangeType).map((t) => ({
                value: t,
                label: changeTypeLabel(t),
              }))}
            />
          </div>
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Priority
            </Typography>
            <Select
              value={priority}
              onValueChange={setPriority}
              options={Object.values(ChangePriority).map((p) => ({
                value: p,
                label: priorityLabel(p),
              }))}
            />
          </div>
        </div>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="Reason (required)"
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description"
        />
      </div>
    </Modal>
  )
}
