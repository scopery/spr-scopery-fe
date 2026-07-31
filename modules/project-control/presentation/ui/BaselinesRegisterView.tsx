'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
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
import * as scheduleApi from '@/modules/projects/schedule/infrastructure/api/schedule.api'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import { estimationApi } from '@/modules/estimation'
import { financeApi } from '@/modules/finance'
import { quotesApi } from '@/modules/quotes'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useBaselines } from '../hooks/useBaselines'
import {
  baselineStatusLabel,
  baselineStatusTone,
  canApproveBaseline,
  canCaptureBaselineSnapshot,
  canMarkBaselineCurrent,
  canValidateBaseline,
} from '../../domain/rules/project-control.rules'
import type { CreateBaselinePayload } from '../../domain/model/project-control'

function fmt(value: string | null | undefined): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export function BaselinesRegisterView() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const [createOpen, setCreateOpen] = useState(false)
  const { project } = useProject(workspaceId, projectId)

  useEffect(() => {
    if (searchParams.get('create') === '1') setCreateOpen(true)
  }, [searchParams])
  const {
    baselines,
    current,
    loading,
    error,
    forbidden,
    create,
    refresh,
    validate,
    approve,
    markCurrent,
    archive,
  } = useBaselines(projectId)

  const run = async (ok: string, fn: () => Promise<unknown>) => {
    try {
      await fn()
      toast.success(ok)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (loading && baselines.length === 0) return <PageSkeleton variant="list" />
  if (forbidden) {
    return (
      <Card className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to baselines</Typography>
      </Card>
    )
  }

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Baselines"
      />

      <div className="mb-2 mt-1 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Baselines
          </Typography>
          {current ? (
            <Typography variant="caption" tone="muted" className="mt-0.5">
              Active baseline: {current.name} (#{current.baselineNumber})
            </Typography>
          ) : (
            <Typography variant="caption" tone="muted" className="mt-0.5">
              No active baseline yet
            </Typography>
          )}
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          Create baseline
        </Button>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <DataTable
        ariaLabel="Baselines"
        rows={baselines}
        rowKey={(baseline) => baseline.id}
        emptyMessage="No baselines yet"
        columns={[
          {
            id: 'baseline',
            header: 'Baseline',
            cell: (b) => (
              <NextLink
                href={ROUTES.workspace.projectBaseline(workspaceId, projectId, b.id)}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {b.name}
              </NextLink>
            ),
          },
          { id: 'number', header: '#', accessor: 'baselineNumber' },
          {
            id: 'status',
            header: 'Status',
            cell: (b) => (
              <Badge variant="solid" tone={baselineStatusTone(b.status)}>
                {baselineStatusLabel(b.status)}
              </Badge>
            ),
          },
          {
            id: 'active',
            header: 'Active',
            cell: (b) =>
              b.currentFlag ? (
                <Badge variant="solid" tone="success" size="sm">
                  Yes
                </Badge>
              ) : (
                '—'
              ),
          },
          { id: 'approved', header: 'Approved', accessor: (b) => fmt(b.approvedAt) },
          { id: 'updated', header: 'Updated', accessor: (b) => fmt(b.updatedAt) },
          {
            id: 'actions',
            header: 'Actions',
            cell: (b) => (
              <div className="flex flex-wrap gap-1">
                {canCaptureBaselineSnapshot(b) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void run('Latest project state captured', () => refresh(b.id))}
                  >
                    Capture
                  </Button>
                ) : null}
                {canValidateBaseline(b) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void run('Baseline checked', () => validate(b.id))}
                  >
                    Check
                  </Button>
                ) : null}
                {canApproveBaseline(b) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void run('Approved', () => approve(b.id))}
                  >
                    Approve
                  </Button>
                ) : null}
                {canMarkBaselineCurrent(b) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void run('Now the active baseline', () => markCurrent(b.id))}
                  >
                    Use as active
                  </Button>
                ) : null}
                {b.status !== 'ARCHIVED' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (!window.confirm(`Archive “${b.name}”?`)) return
                      void run('Archived', () => archive(b.id))
                    }}
                  >
                    Archive
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <CreateBaselineModal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false)
          if (searchParams.get('create') === '1') {
            router.replace(ROUTES.workspace.projectBaselines(workspaceId, projectId))
          }
        }}
        projectId={projectId}
        onSubmit={async (body) => {
          try {
            const created = await create(body)
            toast.success('Baseline created')
            if (created) {
              router.push(ROUTES.workspace.projectBaseline(workspaceId, projectId, created.id))
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

function CreateBaselineModal({
  open,
  onClose,
  projectId,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  projectId: string
  onSubmit: (body: CreateBaselinePayload) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scheduleId, setScheduleId] = useState('')
  const [estimationId, setEstimationId] = useState('')
  const [financeId, setFinanceId] = useState('')
  const [quoteVersionId, setQuoteVersionId] = useState('')
  const [scheduleOpts, setScheduleOpts] = useState<Array<{ value: string; label: string }>>([])
  const [estimationOpts, setEstimationOpts] = useState<Array<{ value: string; label: string }>>([])
  const [financeOpts, setFinanceOpts] = useState<Array<{ value: string; label: string }>>([])
  const [quoteOpts, setQuoteOpts] = useState<Array<{ value: string; label: string }>>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setDescription('')
    void Promise.all([
      scheduleApi.listScheduleRuns(projectId).catch(() => []),
      estimationApi.listEstimationRuns(projectId).catch(() => []),
      financeApi.listFinanceScenarios(projectId).catch(() => []),
      quotesApi.listQuotes(projectId).catch(() => []),
    ]).then(async ([schedules, estimations, finances, quotes]) => {
      setScheduleOpts(
        schedules.map((s) => ({
          value: s.id,
          label: `${s.status}${s.planningStartDate ? ` · ${s.planningStartDate}` : ''}`,
        }))
      )
      setEstimationOpts(estimations.map((e) => ({ value: e.id, label: `${e.name} · ${e.status}` })))
      setFinanceOpts(finances.map((f) => ({ value: f.id, label: `${f.name} (${f.code})` })))
      const qv: Array<{ value: string; label: string }> = []
      for (const q of quotes.slice(0, 8)) {
        try {
          const vers = await quotesApi.listQuoteVersions(projectId, q.id)
          for (const v of vers) {
            qv.push({ value: v.id, label: `${q.code} v${v.versionNumber}` })
          }
        } catch {
          /* skip */
        }
      }
      setQuoteOpts(qv)
      setScheduleId(schedules[0]?.id ?? '')
      setEstimationId(estimations[0]?.id ?? '')
      setFinanceId(finances[0]?.id ?? '')
      setQuoteVersionId(qv[0]?.value ?? '')
    })
  }, [open, projectId])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create baseline"
      size="lg"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Create',
          variant: 'primary',
          loading,
          disabled: !name.trim(),
          onClick: () => {
            void (async () => {
              setLoading(true)
              try {
                await onSubmit({
                  name: name.trim(),
                  description: description.trim() || null,
                  sourceScheduleRunId: scheduleId || null,
                  sourceEstimationRunId: estimationId || null,
                  sourceFinanceScenarioId: financeId || null,
                  sourceQuoteVersionId: quoteVersionId || null,
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
        <Input
          label="Name"
          fullWidth
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Description"
        />
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Schedule run
          </Typography>
          <Select
            value={scheduleId}
            onValueChange={setScheduleId}
            options={[{ value: '', label: 'None' }, ...scheduleOpts]}
          />
        </div>
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Estimation run
          </Typography>
          <Select
            value={estimationId}
            onValueChange={setEstimationId}
            options={[{ value: '', label: 'None' }, ...estimationOpts]}
          />
        </div>
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Finance scenario
          </Typography>
          <Select
            value={financeId}
            onValueChange={setFinanceId}
            options={[{ value: '', label: 'None' }, ...financeOpts]}
          />
        </div>
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Quote version
          </Typography>
          <Select
            value={quoteVersionId}
            onValueChange={setQuoteVersionId}
            options={[{ value: '', label: 'None' }, ...quoteOpts]}
          />
        </div>
      </div>
    </Modal>
  )
}
