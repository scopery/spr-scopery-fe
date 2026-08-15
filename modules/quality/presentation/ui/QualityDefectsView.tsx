'use client'

import { useEffect, useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  DataTable,
  DetailDrawer,
  Input,
  PageSkeleton,
  Select,
  Typography,
} from '@/shared/ui'
import { useDefects } from '../hooks/useDefects'
import { QualityAddBar } from './QualityAddBar'
import type { QualityCreateInput } from './quality-bulk.model'
import {
  allowedDefectLifecycleActions,
  caseKindLabel,
  defectLifecycleActionLabel,
  defectSourceSummary,
  defectStatusLabel,
  mapDefectStatusToWorkflow,
  testExecutionResultLabel,
  type DefectLifecycleAction,
} from '../../domain/rules/quality.rules'
import type { Defect } from '../../domain/model/quality'
import * as qualityApi from '../../infrastructure/api/quality.api'
import { qualityCasesHref, qualityRunsHref } from '../quality-routes'

function ageDays(createdAt?: string): number | null {
  if (!createdAt) return null
  const created = new Date(createdAt)
  if (Number.isNaN(created.getTime())) return null
  return Math.floor((Date.now() - created.getTime()) / (1000 * 60 * 60 * 24))
}

function matchesStatusFilter(item: Defect, statusFilter: string): boolean {
  if (!statusFilter) return true
  if (item.status === statusFilter) return true
  const workflow = mapDefectStatusToWorkflow(item.status)
  if (workflow === statusFilter) return true
  const aliases: Record<string, string[]> = {
    OPEN: ['OPEN', 'TRIAGED', 'ASSIGNED', 'REOPENED'],
    IN_PROGRESS: ['IN_PROGRESS'],
    FIXED: ['FIXED', 'RESOLVED', 'VERIFIED'],
    READY_FOR_RETEST: ['READY_FOR_RETEST', 'RETEST', 'RETESTING'],
    CLOSED: ['CLOSED', 'ARCHIVED'],
    REJECTED: ['REJECTED'],
  }
  return aliases[statusFilter]?.includes(item.status) ?? false
}

function statusTone(status: string): 'neutral' | 'success' | 'warning' | 'error' | 'info' {
  const workflow = mapDefectStatusToWorkflow(status)
  if (workflow === 'CLOSED' || workflow === 'RESOLVED') return 'success'
  if (workflow === 'REJECTED') return 'error'
  if (workflow === 'IN_PROGRESS' || workflow === 'RETEST') return 'info'
  if (workflow === 'OPEN') return 'warning'
  return 'neutral'
}

function resultTone(result?: string | null): 'neutral' | 'success' | 'warning' | 'error' | 'info' {
  if (result === 'PASSED') return 'success'
  if (result === 'FAILED') return 'error'
  if (result === 'BLOCKED') return 'warning'
  if (result === 'SKIPPED') return 'neutral'
  return 'info'
}

export function QualityDefectsView() {
  const params = useParams<{ workspaceId?: string; projectId?: string }>()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceId ?? ''
  const scopeId = params.projectId ?? null
  const { items, loading, error, actionError, create, runLifecycle, refetch } = useDefects(scopeId)
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '')
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') ?? '')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<Defect | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (!matchesStatusFilter(item, statusFilter)) return false
      if (severityFilter && item.severity !== severityFilter) return false
      if (query) {
        const src = item.source
        const hay = `${item.code ?? ''} ${item.title} ${src?.testRunName ?? ''} ${src?.caseCode ?? ''} ${src?.caseTitle ?? ''}`.toLowerCase()
        if (!hay.includes(query.toLowerCase())) return false
      }
      return true
    })
  }, [items, query, severityFilter, statusFilter])

  useEffect(() => {
    if (!selectedId || !scopeId) {
      setDetail(null)
      return
    }
    const fromList = items.find((d) => d.id === selectedId) ?? null
    setDetail(fromList)
    let cancelled = false
    setDetailLoading(true)
    void qualityApi
      .getDefect(scopeId, selectedId)
      .then((d) => {
        if (!cancelled) setDetail(d)
      })
      .catch(() => {
        /* list row already shown */
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedId, scopeId, items])

  const handleCreate = async (input: QualityCreateInput) => {
    if (input.kind !== 'DEFECT') return
    await create(input.payload)
  }

  const runAction = async (defect: Defect, action: DefectLifecycleAction) => {
    try {
      await runLifecycle(defect.id, action)
      toast.success(`Defect ${defectLifecycleActionLabel(action).toLowerCase()}`)
      setSelectedId(null)
    } catch {
      // actionError + global toast handle UX
    }
  }

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  const selected = detail
  const source = selected?.source ?? null

  return (
    <div>
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Defects
          </Typography>
          <Typography tone="muted" variant="caption">
            Work queue for triage, fix, retest, and close. Prefer creating from failed run results.
          </Typography>
        </div>
        <QualityAddBar
          kind="DEFECT"
          onCreate={handleCreate}
          onBatchComplete={async () => {
            await refetch()
            toast.success('Defect(s) created')
          }}
        />
      </header>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="w-52 shrink-0">
          <Input
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search defects…"
            prefix={<Search size={14} />}
          />
        </div>
        <Select
          value={statusFilter || 'ALL'}
          options={[
            { value: 'ALL', label: 'All statuses' },
            ...['OPEN', 'IN_PROGRESS', 'FIXED', 'READY_FOR_RETEST', 'CLOSED', 'REJECTED'].map(
              (value) => ({ value, label: defectStatusLabel(value) })
            ),
          ]}
          onValueChange={(value: string) => setStatusFilter(value === 'ALL' ? '' : value)}
          className="w-44 shrink-0"
        />
        <Select
          value={severityFilter || 'ALL'}
          options={[
            { value: 'ALL', label: 'All severities' },
            ...['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'TRIVIAL'].map((value) => ({
              value,
              label: value,
            })),
          ]}
          onValueChange={(value: string) => setSeverityFilter(value === 'ALL' ? '' : value)}
          className="w-44 shrink-0"
        />
      </div>

      {actionError ? <Typography tone="error">{actionError}</Typography> : null}

      <DataTable
        className="border border-neutral-200"
        ariaLabel="Defects"
        rows={filtered}
        rowKey={(item) => item.id}
        emptyMessage="No defects in this filter."
        onRowClick={(item) => setSelectedId(item.id)}
        columns={[
          { id: 'code', header: 'Code', accessor: (item) => item.code ?? '—', kind: 'code' },
          {
            id: 'title',
            header: 'Title',
            accessor: (item) =>
              (item.title ?? '')
                .replace(/\s*·\s*Unavailable test case/gi, '')
                .replace(/\s*·\s*Unavailable verification case/gi, '')
                .replace(/\s*Unavailable test case/gi, '')
                .replace(/\s*Unavailable verification case/gi, '')
                .trim() || item.title,
          },
          {
            id: 'source',
            header: 'Source',
            cell: (item) => (
              <Typography variant="small" className="max-w-[18rem] truncate">
                {defectSourceSummary(item.source)}
              </Typography>
            ),
          },
          {
            id: 'severity',
            header: 'Severity',
            cell: (item) => (
              <Badge
                size="sm"
                variant="solid"
                tone={
                  item.severity === 'BLOCKER' || item.severity === 'CRITICAL' ? 'error' : 'neutral'
                }
              >
                {item.severity ?? '—'}
              </Badge>
            ),
          },
          {
            id: 'status',
            header: 'Status',
            cell: (item) => (
              <Badge size="sm" variant="solid" tone={statusTone(item.status)}>
                {defectStatusLabel(item.status)}
              </Badge>
            ),
          },
          {
            id: 'age',
            header: 'Age',
            accessor: (item) => {
              const age = ageDays(item.createdAt)
              return age == null ? '—' : `${age}d`
            },
          },
          {
            id: 'actions',
            header: 'Actions',
            cellClassName: 'overflow-visible',
            cell: (item) => (
              <div className="flex flex-wrap gap-1" onClick={(event) => event.stopPropagation()}>
                {allowedDefectLifecycleActions(item.status)
                  .slice(0, 2)
                  .map((action) => (
                    <Button
                      key={action}
                      size="sm"
                      variant="outline"
                      onClick={() => void runAction(item, action)}
                    >
                      {defectLifecycleActionLabel(action)}
                    </Button>
                  ))}
              </div>
            ),
          },
        ]}
      />

      {selected ? (
        <DetailDrawer open onClose={() => setSelectedId(null)} title={selected.title}>
          <div className="space-y-4 p-4">
            <Typography variant="caption" tone="muted">
              {[selected.code, selected.category, selected.severity, selected.priority]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
            <Badge size="sm" variant="solid" tone={statusTone(selected.status)}>
              {defectStatusLabel(selected.status)}
            </Badge>

            <section className="space-y-2 border-t border-neutral-100 pt-3">
              <Typography variant="small" weight="semibold">
                Source
              </Typography>
              {detailLoading && !source ? (
                <Typography variant="small" tone="muted">
                  Loading source…
                </Typography>
              ) : source ? (
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {source.resultStatus ? (
                      <Badge size="sm" variant="solid" tone={resultTone(source.resultStatus)}>
                        {testExecutionResultLabel(source.resultStatus)}
                      </Badge>
                    ) : null}
                    <Typography variant="small" tone="muted">
                      {caseKindLabel(source.caseKind ?? '', source.qualityAttribute)}
                    </Typography>
                  </div>
                  {workspaceId && source.testRunId ? (
                    <Typography variant="small">
                      Run:{' '}
                      <NextLink
                        className="text-primary underline-offset-2 hover:underline"
                        href={qualityRunsHref(workspaceId, selected.projectId || scopeId!, {
                          runId: source.testRunId,
                        })}
                      >
                        {source.testRunName ?? 'Open run'}
                      </NextLink>
                    </Typography>
                  ) : source.testRunName ? (
                    <Typography variant="small">Run: {source.testRunName}</Typography>
                  ) : null}
                  {workspaceId && source.caseId ? (
                    <Typography variant="small">
                      Case:{' '}
                      <NextLink
                        className="text-primary underline-offset-2 hover:underline"
                        href={qualityCasesHref(workspaceId, selected.projectId || scopeId!, {
                          type: source.caseKind === 'NFR' ? 'nfr' : 'functional',
                          selected: source.caseId,
                        })}
                      >
                        {[source.caseCode, source.caseTitle].filter(Boolean).join(' · ') ||
                          'Open case'}
                      </NextLink>
                    </Typography>
                  ) : source.caseCode || source.caseTitle ? (
                    <Typography variant="small">
                      Case: {[source.caseCode, source.caseTitle].filter(Boolean).join(' · ')}
                    </Typography>
                  ) : null}
                  {source.resultComment ? (
                    <Typography variant="small" tone="muted">
                      Result note: {source.resultComment}
                    </Typography>
                  ) : null}
                </div>
              ) : (
                <Typography variant="small" tone="muted">
                  Manual defect — no linked run result.
                </Typography>
              )}
            </section>

            {selected.description ? (
              <section className="space-y-1 border-t border-neutral-100 pt-3">
                <Typography variant="small" weight="semibold">
                  Description
                </Typography>
                <Typography variant="small" className="whitespace-pre-wrap">
                  {selected.description}
                </Typography>
              </section>
            ) : null}

            {(selected.expectedResult || selected.actualResult) && (
              <section className="space-y-2 border-t border-neutral-100 pt-3">
                {selected.expectedResult ? (
                  <div>
                    <Typography variant="caption" tone="muted">
                      Expected
                    </Typography>
                    <Typography variant="small" className="whitespace-pre-wrap">
                      {selected.expectedResult}
                    </Typography>
                  </div>
                ) : null}
                {selected.actualResult ? (
                  <div>
                    <Typography variant="caption" tone="muted">
                      Actual
                    </Typography>
                    <Typography variant="small" className="whitespace-pre-wrap">
                      {selected.actualResult}
                    </Typography>
                  </div>
                ) : null}
              </section>
            )}

            {selected.reproductionSteps ? (
              <section className="space-y-1 border-t border-neutral-100 pt-3">
                <Typography variant="small" weight="semibold">
                  Steps to reproduce
                </Typography>
                <Typography variant="small" className="whitespace-pre-wrap">
                  {selected.reproductionSteps}
                </Typography>
              </section>
            ) : null}

            <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
              {allowedDefectLifecycleActions(selected.status).map((action) => (
                <Button
                  key={action}
                  size="sm"
                  variant="outline"
                  onClick={() => void runAction(selected, action)}
                >
                  {defectLifecycleActionLabel(action)}
                </Button>
              ))}
            </div>
          </div>
        </DetailDrawer>
      ) : null}
    </div>
  )
}
