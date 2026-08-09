'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowUp,
  Bug,
  Check,
  CheckCircle2,
  Crosshair,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  RotateCcw,
  Search,
  SkipForward,
  X,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  DataTable,
  DetailDrawer,
  Input,
  PageSkeleton,
  Select,
  Textarea,
  Typography,
} from '@/shared/ui'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { useTestRuns } from '../hooks/useTestRuns'
import { useRunCaseScripts } from '../hooks/useRunCaseScript'
import { RunCaseScriptInline } from './RunCaseScriptPanel'
import {
  mapTestRunResultToExecutionRow,
  mapVerificationResultToExecutionRow,
} from '../../infrastructure/mappers/quality-compatibility.mapper'
import {
  buildRunCompletionValidation,
  canRunLifecycle,
  caseKindLabel,
  testRunStatusLabel,
  validateResultUpdate,
} from '../../domain/rules/quality.rules'
import * as qualityApi from '../../infrastructure/api/quality.api'
import type { RunExecutionRow, TestRun } from '../../domain/model/quality'
import { QualitySingleAddModal } from './QualitySingleAddModal'
import { RunMembershipDrawer } from './RunMembershipDrawer'
import { CreateDefectFromResultModal } from './CreateDefectFromResultModal'
import { TestCaseDetailDrawer } from './TestCaseDetailDrawer'
import { VerificationCaseDetailDrawer } from './VerificationCaseDetailDrawer'

const RESULT_OPTIONS = [
  { value: '', label: 'All results' },
  ...['NOT_RUN', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED'].map((value) => ({
    value,
    label: value,
  })),
]

function isMembershipPreviewRow(row: RunExecutionRow): boolean {
  return row.resultId.startsWith('membership:')
}

function resultTone(result: string): 'neutral' | 'success' | 'warning' | 'error' | 'info' {
  if (result === 'PASSED') return 'success'
  if (result === 'FAILED') return 'error'
  if (result === 'BLOCKED') return 'warning'
  if (result === 'QUEUED') return 'info'
  return 'neutral'
}

function resultLabel(result: string): string {
  const labels: Record<string, string> = {
    PASSED: 'Passed',
    FAILED: 'Failed',
    BLOCKED: 'Blocked',
    SKIPPED: 'Skipped',
    NOT_RUN: 'Not run',
    QUEUED: 'Queued',
  }
  return labels[result] ?? result
}

function isOngoingResult(status: string): boolean {
  return status === 'NOT_RUN' || status === 'QUEUED'
}

function progress(run: TestRun): number {
  if (!run.total) return 0
  return Math.round(((run.executed ?? 0) / run.total) * 100)
}

export function QualityRunsView() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const runIdFromUrl = searchParams.get('runId')
  const testRuns = useTestRuns(projectId)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [reasonPanel, setReasonPanel] = useState<{
    row: RunExecutionRow
    result: string
    notes: string
    actualValue: string
  } | null>(null)
  const [completionOpen, setCompletionOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [membershipOpen, setMembershipOpen] = useState(false)
  const [focusedRow, setFocusedRow] = useState<RunExecutionRow | null>(null)
  const [caseDetail, setCaseDetail] = useState<{
    kind: 'FUNCTIONAL' | 'NFR'
    caseId: string
  } | null>(null)
  const [defectFromResult, setDefectFromResult] = useState<RunExecutionRow | null>(null)
  const [runsSidebarOpen, setRunsSidebarOpen] = useState(true)
  const resultsScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (runIdFromUrl) testRuns.setSelectedRunId(runIdFromUrl)
    // Intentionally only sync when URL runId changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runIdFromUrl])

  const selectRun = useCallback(
    (runId: string) => {
      testRuns.setSelectedRunId(runId)
      setSelectedIds(new Set())
      router.replace(ROUTES.workspace.projectQualityRuns(workspaceId, projectId, { runId }))
    },
    [projectId, router, testRuns, workspaceId]
  )

  const executionRows: RunExecutionRow[] = useMemo(() => {
    const membershipByKey = new Map(
      testRuns.membership.map((item) => [`${item.caseKind}:${item.caseId}`, item] as const)
    )

    const withMembershipFallback = (row: RunExecutionRow): RunExecutionRow => {
      const member = membershipByKey.get(`${row.kind}:${row.caseId}`)
      if (!member) return row
      const missingTitle =
        !row.caseTitle ||
        row.caseTitle === 'Untitled case' ||
        row.caseTitle === 'Unavailable test case' ||
        row.caseTitle === 'Unavailable verification case'
      const missingCode = !row.caseCode || row.caseCode === '—'
      if (!missingTitle && !missingCode) return row
      return {
        ...row,
        caseCode: missingCode ? (member.caseCode ?? row.caseCode) : row.caseCode,
        caseTitle: missingTitle ? (member.caseTitle ?? row.caseTitle) : row.caseTitle,
        qualityAttribute: row.qualityAttribute ?? member.sourceGroupName ?? null,
      }
    }

    const functional = testRuns.results.map((result) =>
      withMembershipFallback(mapTestRunResultToExecutionRow(result))
    )
    const verification = testRuns.verificationResults.map((result) =>
      withMembershipFallback(mapVerificationResultToExecutionRow(result))
    )
    const fromResults = [...functional, ...verification]
    if (fromResults.length > 0) return fromResults

    // Before Start, BE has no result rows yet — show membership as queued preview.
    return [...testRuns.membership]
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map((item) => ({
        kind: item.caseKind,
        resultId: `membership:${item.caseKind}:${item.caseId}`,
        caseId: item.caseId,
        caseCode: item.caseCode ?? '—',
        caseTitle: item.caseTitle ?? 'Untitled',
        status: 'QUEUED',
      }))
  }, [testRuns.membership, testRuns.results, testRuns.verificationResults])

  const isQueuedPreview =
    executionRows.length > 0 && executionRows.every(isMembershipPreviewRow)

  const caseScripts = useRunCaseScripts(projectId, executionRows)

  const applyResult = async (
    row: RunExecutionRow,
    result: string,
    notes?: string,
    actualValue?: number
  ) => {
    const validation = validateResultUpdate({ result, notes })
    if (!validation.ok) {
      setReasonPanel({
        row,
        result,
        notes: notes ?? '',
        actualValue: actualValue != null ? String(actualValue) : '',
      })
      return
    }
    if (row.kind === 'FUNCTIONAL') {
      await testRuns.updateResult(row.resultId, { result, comment: notes ?? null })
    } else {
      await testRuns.updateVerificationResult(row.resultId, {
        resultStatus: result,
        comment: notes ?? null,
        actualValue: actualValue ?? null,
      })
    }
    toast.success('Result saved')
  }

  const onShortcut = async (row: RunExecutionRow, key: string) => {
    if (isMembershipPreviewRow(row)) return
    const map: Record<string, string> = {
      p: 'PASSED',
      f: 'FAILED',
      b: 'BLOCKED',
      s: 'SKIPPED',
      n: 'NOT_RUN',
    }
    const result = map[key.toLowerCase()]
    if (!result) return
    await applyResult(row, result)
  }

  const onFocusedRowChange = useCallback((row: RunExecutionRow | null) => {
    setFocusedRow(row)
  }, [])

  const scrollResultsToTop = useCallback(() => {
    resultsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const scrollToNearestOngoing = useCallback(() => {
    const container = resultsScrollRef.current
    if (!container || executionRows.length === 0) return

    const ongoing = executionRows.filter((row) => isOngoingResult(row.status))
    if (ongoing.length === 0) {
      toast.message('No pending cases left in this run')
      return
    }

    const viewportTop = container.getBoundingClientRect().top + 8
    let best: { row: RunExecutionRow; el: Element; dist: number } | null = null

    for (const row of ongoing) {
      const el = container.querySelector(`[data-row-key="${CSS.escape(row.resultId)}"]`)
      if (!el) continue
      const dist = el.getBoundingClientRect().top - viewportTop
      // Prefer the next pending row at/below the current viewport.
      if (dist >= -4 && (!best || dist < best.dist)) {
        best = { row, el, dist }
      }
    }

    if (!best) {
      const row = ongoing[0]
      const el = container.querySelector(`[data-row-key="${CSS.escape(row.resultId)}"]`)
      if (!el) return
      best = { row, el, dist: 0 }
    }

    best.el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setFocusedRow(best.row)
  }, [executionRows])

  const onRowHotkey = useCallback(
    (row: RunExecutionRow, key: string, event: KeyboardEvent) => {
      if (isQueuedPreview || isMembershipPreviewRow(row)) return
      const k = key.toLowerCase()
      if (!['p', 'f', 'b', 's', 'n'].includes(k)) return
      event.preventDefault()

      // Multi-select: P / S / N apply to all checked rows (F/B need a reason → single row).
      if (selectedIds.size > 0 && (k === 'p' || k === 's' || k === 'n')) {
        const result = k === 'p' ? 'PASSED' : k === 's' ? 'SKIPPED' : 'NOT_RUN'
        void (async () => {
          await testRuns.batchUpdateResults([...selectedIds], { result })
          setSelectedIds(new Set())
          toast.success(`Marked ${result.toLowerCase().replace('_', ' ')}`)
        })()
        return
      }

      void onShortcut(row, k)
    },
    // onShortcut closes over applyResult; keep deps tight to selection + preview mode.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isQueuedPreview, selectedIds, testRuns]
  )

  const runLifecycle = async (action: 'start' | 'complete' | 'cancel' | 'reopen') => {
    if (!testRuns.selectedRunId || !projectId) return
    const status = testRuns.selectedRun?.status ?? ''
    if (!canRunLifecycle(status, action) && action !== 'complete') {
      toast.message(`Action ${action} is not available for ${status}`)
      return
    }
    if (action === 'complete') {
      setCompletionOpen(true)
      return
    }
    if (action === 'start') {
      await testRuns.startRun(testRuns.selectedRunId)
      toast.success('Run started — results ready to execute')
    }
    if (action === 'cancel') await testRuns.cancelRun(testRuns.selectedRunId)
    if (action === 'reopen') {
      const reopened = await qualityApi.reopenTestRun(projectId, testRuns.selectedRunId)
      if (!reopened) toast.message('Reopen endpoint is not available yet')
      else await testRuns.refetch()
    }
  }

  const confirmComplete = async (force: boolean) => {
    if (!testRuns.selectedRunId || !projectId) return
    await qualityApi.completeTestRunWithOptions(projectId, testRuns.selectedRunId, {
      force,
      reason: force ? 'Completed with remaining violations' : null,
    })
    setCompletionOpen(false)
    await testRuns.refetch()
    toast.success(force ? 'Run completed with exceptions' : 'Run completed')
  }

  const runStatus = testRuns.selectedRun?.status ?? ''
  const canStart = canRunLifecycle(runStatus, 'start')
  const canComplete = canRunLifecycle(runStatus, 'complete')
  const canCancel = canRunLifecycle(runStatus, 'cancel')
  const canReopen = canRunLifecycle(runStatus, 'reopen')

  const completion = buildRunCompletionValidation({
    runId: testRuns.selectedRunId ?? '',
    counts: {
      total: executionRows.length,
      passed: executionRows.filter((r) => r.status === 'PASSED').length,
      failed: executionRows.filter((r) => r.status === 'FAILED').length,
      blocked: executionRows.filter((r) => r.status === 'BLOCKED').length,
      skipped: executionRows.filter((r) => r.status === 'SKIPPED').length,
      notRun: executionRows.filter((r) => r.status === 'NOT_RUN' || !r.status).length,
    },
  })

  if (testRuns.loadingRuns) return <PageSkeleton variant="list" className="p-lg" />

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white px-3 py-3 lg:px-4 lg:py-3">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Runs
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-0.5">
            Create a run, add cases, then Start → execute results → Complete.
          </Typography>
        </div>
        <Button size="sm" icon={<Plus size={14} />} onClick={() => setCreateOpen(true)}>
          New run
        </Button>
      </header>

      <div
        className={cn(
          'grid min-h-0 flex-1 overflow-hidden transition-[grid-template-columns] duration-200',
          runsSidebarOpen ? 'grid-cols-[14rem_1fr]' : 'grid-cols-[2.5rem_1fr]'
        )}
      >
        <aside className="flex min-h-0 flex-col border-r border-neutral-200">
          <div
            className={cn(
              'flex shrink-0 items-center border-b border-neutral-200',
              runsSidebarOpen ? 'justify-between gap-1 px-2 py-1.5' : 'justify-center py-1.5'
            )}
          >
            {runsSidebarOpen ? (
              <Typography variant="caption" className="truncate font-medium text-neutral-600">
                Runs
              </Typography>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon={
                runsSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />
              }
              aria-label={runsSidebarOpen ? 'Collapse runs list' : 'Expand runs list'}
              aria-expanded={runsSidebarOpen}
              onClick={() => setRunsSidebarOpen((open) => !open)}
            />
          </div>
          {runsSidebarOpen ? (
            <div className="min-h-0 flex-1 overflow-y-auto">
              {testRuns.runs.length === 0 ? (
                <Typography tone="muted" className="p-3 text-xs">
                  No runs yet.
                </Typography>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {testRuns.runs.map((run) => (
                    <li key={run.id}>
                      <button
                        type="button"
                        className={
                          testRuns.selectedRunId === run.id
                            ? 'w-full border-l-2 border-neutral-900 bg-neutral-50 px-2.5 py-2 text-left'
                            : 'w-full border-l-2 border-transparent px-2.5 py-2 text-left hover:bg-neutral-50'
                        }
                        onClick={() => selectRun(run.id)}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <Typography
                            variant="small"
                            weight="medium"
                            className="min-w-0 truncate leading-snug"
                          >
                            {run.name}
                          </Typography>
                          <Badge
                            size="sm"
                            variant="solid"
                            tone={run.status === 'IN_PROGRESS' ? 'info' : 'neutral'}
                            className={
                              run.status === 'IN_PROGRESS'
                                ? 'shrink-0 border-transparent bg-blue-400 text-white'
                                : 'shrink-0'
                            }
                          >
                            {testRunStatusLabel(run.status)}
                          </Badge>
                        </div>
                        <Typography variant="caption" tone="muted" className="mt-0.5 block truncate">
                          {[run.runType || 'Run', run.runScope || 'FUNCTIONAL'].join(' · ')}
                        </Typography>
                        <div className="mt-1.5 h-1 overflow-hidden bg-neutral-100">
                          <div
                            className="h-full bg-neutral-500"
                            style={{ width: `${progress(run)}%` }}
                          />
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </aside>

        <section className="relative flex min-h-0 flex-col overflow-hidden">
          {testRuns.selectedRun ? (
            <>
              <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200 p-3">
                <Typography weight="medium">{testRuns.selectedRun.name}</Typography>
                <Badge
                  size="sm"
                  variant="solid"
                  tone={testRuns.selectedRun.status === 'IN_PROGRESS' ? 'info' : 'neutral'}
                  className={
                    testRuns.selectedRun.status === 'IN_PROGRESS'
                      ? 'border-transparent bg-blue-400 text-white'
                      : undefined
                  }
                >
                    {testRunStatusLabel(testRuns.selectedRun.status)}
                  </Badge>
                <div className="ml-auto flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<ArrowUp size={14} />}
                    onClick={scrollResultsToTop}
                  >
                    Top
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Crosshair size={14} />}
                    onClick={scrollToNearestOngoing}
                  >
                    Next pending
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<Plus size={14} />}
                    onClick={() => setMembershipOpen(true)}
                  >
                    Add cases
                  </Button>
                  {canStart ? (
                    <Button
                      size="sm"
                      tone="success"
                      icon={<Play size={14} />}
                      onClick={() => void runLifecycle('start')}
                    >
                      Start
                    </Button>
                  ) : null}
                  {canComplete ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<CheckCircle2 size={14} />}
                      onClick={() => void runLifecycle('complete')}
                    >
                      Complete
                    </Button>
                  ) : null}
                  {canCancel ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="bg-neutral-200 text-neutral-900 hover:bg-neutral-300 hover:text-neutral-900"
                      icon={<XCircle size={14} />}
                      onClick={() => void runLifecycle('cancel')}
                    >
                      Cancel
                    </Button>
                  ) : null}
                  {canReopen ? (
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<RotateCcw size={14} />}
                      onClick={() => void runLifecycle('reopen')}
                    >
                      Reopen
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-200 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="w-52 shrink-0">
                    <Input
                      fullWidth
                      value={testRuns.query}
                      onChange={(e) => testRuns.setQuery(e.target.value)}
                      placeholder="Filter results…"
                      prefix={<Search size={14} />}
                      disabled={isQueuedPreview}
                    />
                  </div>
                  <Select
                    value={testRuns.resultFilter}
                    options={RESULT_OPTIONS}
                    onValueChange={testRuns.setResultFilter}
                    className="w-40 shrink-0"
                    disabled={isQueuedPreview}
                  />
                </div>
                {isQueuedPreview ? (
                  <Typography variant="small" tone="muted">
                    {executionRows.length} case{executionRows.length === 1 ? '' : 's'} queued — press
                    Start to execute
                  </Typography>
                ) : (
                  <Typography variant="caption" tone="muted">
                    Click table → ↑↓ move · P pass · F fail · B blocked · S skip · N not run
                  </Typography>
                )}
                {!isQueuedPreview && selectedIds.size > 0 ? (
                  <div className="flex items-center gap-2">
                    <Typography variant="small">{selectedIds.size} selected</Typography>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<Check size={14} />}
                      onClick={() =>
                        void (async () => {
                          await testRuns.batchUpdateResults([...selectedIds], { result: 'PASSED' })
                          setSelectedIds(new Set())
                          toast.success('Marked passed')
                        })()
                      }
                    >
                      Pass
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      icon={<SkipForward size={14} />}
                      onClick={() =>
                        void (async () => {
                          await testRuns.batchUpdateResults([...selectedIds], { result: 'SKIPPED' })
                          setSelectedIds(new Set())
                          toast.success('Marked skipped')
                        })()
                      }
                    >
                      Skip
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<X size={14} />}
                      onClick={() => setSelectedIds(new Set())}
                    >
                      Clear
                    </Button>
                  </div>
                ) : null}
              </div>

              {!isQueuedPreview && focusedRow ? (
                <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-neutral-200 bg-neutral-100 px-3 py-2">
                  <Typography variant="caption" tone="muted" className="shrink-0">
                    Focus
                  </Typography>
                  <Typography variant="small" weight="medium" className="font-mono">
                    {focusedRow.caseCode || '—'}
                  </Typography>
                  <Typography variant="small" weight="medium" className="min-w-0 truncate">
                    {focusedRow.caseTitle}
                  </Typography>
                  <Badge size="sm" variant="solid" tone={resultTone(focusedRow.status)}>
                    {resultLabel(focusedRow.status)}
                  </Badge>
                  <Typography variant="caption" tone="muted" className="ml-auto">
                    ↑↓ move · P F B S N · script is on each row
                  </Typography>
                </div>
              ) : null}

              <DataTable
                ref={resultsScrollRef}
                className="min-h-0 flex-1"
                ariaLabel="Run execution results"
                rows={executionRows}
                rowKey={(row) => row.resultId}
                selectedRowKey={isQueuedPreview ? null : focusedRow?.resultId}
                selectedKeys={isQueuedPreview ? undefined : selectedIds}
                onSelectedKeysChange={isQueuedPreview ? undefined : setSelectedIds}
                onRowClick={isQueuedPreview ? undefined : () => undefined}
                onRowHotkey={isQueuedPreview ? undefined : onRowHotkey}
                onFocusedRowChange={onFocusedRowChange}
                emptyMessage="No cases yet. Click Add cases, then Start to execute."
                columns={[
                  {
                    id: 'kind',
                    header: 'Kind',
                    cell: (row) => (
                      <Badge size="sm" tone={row.kind === 'NFR' ? 'info' : 'neutral'}>
                        {caseKindLabel(row.kind, row.qualityAttribute)}
                      </Badge>
                    ),
                  },
                  {
                    id: 'case',
                    header: 'Case · script',
                    kind: 'code',
                    interactive: true,
                    truncate: false,
                    width: '44%',
                    cellClassName: 'align-top',
                    cell: (row) => {
                      const entry = caseScripts.getEntry(row)
                      return (
                        <div className="min-w-0 py-0.5">
                          <button
                            type="button"
                            className="min-w-0 text-left hover:underline"
                            onClick={(event) => {
                              event.stopPropagation()
                              if (!row.caseId) return
                              setCaseDetail({ kind: row.kind, caseId: row.caseId })
                            }}
                          >
                            <div className="font-medium text-neutral-900">
                              {row.caseCode || '—'}
                            </div>
                            <div className="text-neutral-700">{row.caseTitle}</div>
                          </button>
                          <RunCaseScriptInline
                            script={entry.script}
                            loading={entry.loading}
                            error={entry.error}
                          />
                        </div>
                      )
                    },
                  },
                  {
                    id: 'result',
                    header: 'Result',
                    cell: (row) => (
                      <Badge size="sm" variant="solid" tone={resultTone(row.status)}>
                        {resultLabel(row.status)}
                      </Badge>
                    ),
                  },
                  {
                    id: 'shortcuts',
                    header: 'Keys',
                    cellClassName: 'overflow-visible',
                    cell: (row) =>
                      isMembershipPreviewRow(row) ? (
                        <Typography variant="caption" tone="muted">
                          Start first
                        </Typography>
                      ) : (
                        <Typography variant="caption" tone="muted" className="font-mono">
                          P F B S N
                        </Typography>
                      ),
                  },
                  {
                    id: 'defect',
                    header: 'Defect',
                    cell: (row) =>
                      isMembershipPreviewRow(row) ? (
                        '—'
                      ) : row.defectId ? (
                        <Badge size="sm" tone="error">
                          Linked
                        </Badge>
                      ) : row.status === 'FAILED' || row.status === 'BLOCKED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          icon={<Bug size={14} />}
                          onClick={() => setDefectFromResult(row)}
                        >
                          Create defect
                        </Button>
                      ) : (
                        '—'
                      ),
                  },
                ]}
              />
            </>
          ) : (
            <Typography tone="muted" className="p-lg">
              Select a run to execute results.
            </Typography>
          )}
        </section>
      </div>

      {reasonPanel ? (
        <DetailDrawer
          open
          onClose={() => setReasonPanel(null)}
          title={`${reasonPanel.result} reason`}
        >
          <div className="space-y-3 p-4">
            <Typography variant="small">
              {reasonPanel.row.caseCode} · {reasonPanel.row.caseTitle}
            </Typography>
            <Textarea
              value={reasonPanel.notes}
              onChange={(e) => setReasonPanel({ ...reasonPanel, notes: e.target.value })}
              placeholder="Required reason for Failed / Blocked"
              rows={4}
            />
            {reasonPanel.row.kind === 'NFR' ? (
              <Input
                value={reasonPanel.actualValue}
                onChange={(e) => setReasonPanel({ ...reasonPanel, actualValue: e.target.value })}
                placeholder="Actual value"
              />
            ) : null}
            <Button
              onClick={() =>
                void applyResult(
                  reasonPanel.row,
                  reasonPanel.result,
                  reasonPanel.notes,
                  reasonPanel.actualValue ? Number(reasonPanel.actualValue) : undefined
                ).then(() => setReasonPanel(null))
              }
            >
              Save result
            </Button>
          </div>
        </DetailDrawer>
      ) : null}

      {completionOpen ? (
        <DetailDrawer open onClose={() => setCompletionOpen(false)} title="Complete run">
          <div className="space-y-3 p-4">
            <Typography variant="small">
              Passed {completion.passedCount} · Failed {completion.failedCount} · Blocked{' '}
              {completion.blockedCount} · Not run {completion.notRunCount}
            </Typography>
            {completion.violations.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700">
                {completion.violations.map((v) => (
                  <li key={v.code}>{v.message}</li>
                ))}
              </ul>
            ) : (
              <Typography tone="muted">No policy violations.</Typography>
            )}
            <div className="flex gap-2">
              <Button
                disabled={!completion.canComplete}
                icon={<CheckCircle2 size={14} />}
                onClick={() => void confirmComplete(false)}
              >
                Complete
              </Button>
              <Button
                variant="outline"
                icon={<CheckCircle2 size={14} />}
                onClick={() => void confirmComplete(true)}
              >
                Complete anyway
              </Button>
            </div>
          </div>
        </DetailDrawer>
      ) : null}

      <QualitySingleAddModal
        open={createOpen}
        kind="TEST_RUN"
        onClose={() => setCreateOpen(false)}
        onCreate={async (input) => {
          if (input.kind !== 'TEST_RUN' || !projectId) return
          const created = await qualityApi.createTestRun(projectId, input.payload)
          setCreateOpen(false)
          await testRuns.refetch()
          if (created?.id) selectRun(created.id)
          if (input.payload.testSuiteId) {
            toast.success('Suite-backed run created — Start to load cases')
          } else {
            setMembershipOpen(true)
            toast.success('Run created — add cases next')
          }
        }}
      />

      {testRuns.selectedRunId && testRuns.selectedRun ? (
        <RunMembershipDrawer
          open={membershipOpen}
          projectId={projectId}
          runId={testRuns.selectedRunId}
          runName={testRuns.selectedRun.name}
          runScope={testRuns.selectedRun.runScope}
          onClose={() => setMembershipOpen(false)}
          onChanged={async () => {
            await testRuns.refetchMembership()
            await testRuns.refetch()
            await testRuns.refetchResults()
          }}
        />
      ) : null}

      {caseDetail?.kind === 'FUNCTIONAL' ? (
        <TestCaseDetailDrawer
          projectId={projectId}
          testCaseId={caseDetail.caseId}
          onClose={() => setCaseDetail(null)}
        />
      ) : null}
      {caseDetail?.kind === 'NFR' ? (
        <VerificationCaseDetailDrawer
          projectId={projectId}
          verificationCaseId={caseDetail.caseId}
          onClose={() => setCaseDetail(null)}
        />
      ) : null}

      {defectFromResult && projectId ? (
        <CreateDefectFromResultModal
          open
          projectId={projectId}
          row={defectFromResult}
          runName={testRuns.selectedRun?.name}
          onClose={() => setDefectFromResult(null)}
          onCreated={async () => {
            await testRuns.refetchResults()
          }}
        />
      ) : null}
    </div>
  )
}
