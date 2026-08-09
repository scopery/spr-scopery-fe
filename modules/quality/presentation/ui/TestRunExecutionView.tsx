'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle2, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import { toast } from 'sonner'
import { UserIdentity, UserPickerModal, useResolveUsers } from '@/modules/platform'
import { Badge, Button, DataTable, Input, PageSkeleton, Select, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { useTestRuns } from '../hooks/useTestRuns'
import { useQualityAssigneePeople } from '../hooks/useQualityAssigneePeople'
import { testRunStatusLabel } from '../../domain/rules/quality.rules'
import type { TestRun } from '../../domain/model/quality'

const RESULT_OPTIONS = [
  { value: '', label: 'All results' },
  ...['NOT_RUN', 'PASSED', 'FAILED', 'BLOCKED', 'SKIPPED'].map((value) => ({
    value,
    label: value,
  })),
]

function resultTone(result: string): 'neutral' | 'success' | 'warning' | 'error' {
  if (result === 'PASSED') return 'success'
  if (result === 'FAILED') return 'error'
  if (result === 'BLOCKED') return 'warning'
  return 'neutral'
}

function progress(run: TestRun): number {
  if (!run.total) return 0
  return Math.round(((run.executed ?? 0) / run.total) * 100)
}

export function TestRunExecutionView() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()
  const testRuns = useTestRuns(projectId)
  const { people: assigneePeople } = useQualityAssigneePeople(workspaceId)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchResult, setBatchResult] = useState('PASSED')
  const [assignTarget, setAssignTarget] = useState<{
    ids: string[]
    value: string | null
  } | null>(null)
  const [assignSaving, setAssignSaving] = useState(false)
  const [assigneeFilterOpen, setAssigneeFilterOpen] = useState(false)
  const [runsSidebarOpen, setRunsSidebarOpen] = useState(true)
  const { personFor } = useResolveUsers([
    ...testRuns.results.map((result) => result.assigneeId),
    testRuns.assigneeId,
  ])

  const applyBatch = async () => {
    await testRuns.batchUpdateResults([...selectedIds], { result: batchResult })
    toast.success(`${selectedIds.size} results updated`)
    setSelectedIds(new Set())
  }

  const saveAssignment = async (assigneeId: string | null) => {
    if (!assignTarget) return
    setAssignSaving(true)
    try {
      await testRuns.batchUpdateResults(assignTarget.ids, { assigneeId })
      setSelectedIds(new Set())
      setAssignTarget(null)
      toast.success(assigneeId ? 'Assignee updated' : 'Assignment cleared')
    } finally {
      setAssignSaving(false)
    }
  }

  if (testRuns.loadingRuns) return <PageSkeleton variant="list" className="p-lg" />
  if (testRuns.error && testRuns.runs.length === 0) {
    return <Typography tone="error">{testRuns.error}</Typography>
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white px-3 py-3 lg:px-4 lg:py-3">
      <header className="border-b border-neutral-200 pb-2">
        <Typography as="h1" size="md" weight="medium">
          Test Runs
        </Typography>
        <Typography variant="caption" tone="muted" className="mt-0.5">
          Record execution results here. Test Case lifecycle status remains unchanged.
        </Typography>
      </header>

      <div
        className={cn(
          'grid min-h-0 flex-1 transition-[grid-template-columns] duration-200',
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
                  No Test Runs yet.
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
                        onClick={() => {
                          testRuns.setSelectedRunId(run.id)
                          setSelectedIds(new Set())
                        }}
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
                            tone={run.status === 'IN_PROGRESS' ? 'success' : 'neutral'}
                            size="sm"
                            className="shrink-0"
                          >
                            {testRunStatusLabel(run.status)}
                          </Badge>
                        </div>
                        <Typography variant="caption" tone="muted" className="mt-0.5 block truncate">
                          {[run.runType || 'Test Run', run.runScope || 'FUNCTIONAL']
                            .filter(Boolean)
                            .join(' · ')}
                        </Typography>
                        {run.releasePackageName || run.deploymentEnvironmentName ? (
                          <Typography variant="caption" tone="muted" className="block truncate">
                            {[run.releasePackageName, run.deploymentEnvironmentName]
                              .filter(Boolean)
                              .join(' · ')}
                          </Typography>
                        ) : null}
                        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className="h-full bg-secondary"
                            style={{ width: `${progress(run)}%` }}
                          />
                        </div>
                        <div className="mt-xs flex justify-between text-xs text-neutral-500">
                          <span>
                            {run.executed ?? 0}/{run.total ?? 0} executed
                          </span>
                          <span>{progress(run)}%</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null}
        </aside>

        <main className="flex min-h-0 min-w-0 flex-col">
          {testRuns.selectedRun ? (
            <>
              <div className="border-b border-neutral-200 px-lg py-md">
                <div className="flex flex-wrap items-start justify-between gap-md">
                  <div>
                    <Typography variant="h4">{testRuns.selectedRun.name}</Typography>
                    <Typography variant="caption" tone="muted">
                      Scope {testRuns.runScope}
                      {testRuns.showsFunctionalResults && testRuns.showsVerificationResults
                        ? ' · Functional + NFR'
                        : testRuns.showsVerificationResults
                          ? ' · Verification results'
                          : ' · Functional results'}{' '}
                      · {testRuns.resultTotal} rows
                    </Typography>
                    {testRuns.selectedRun.releasePackageName ||
                    testRuns.selectedRun.deploymentEnvironmentName ? (
                      <Typography variant="caption" tone="muted" className="block">
                        {[
                          testRuns.selectedRun.releasePackageName,
                          testRuns.selectedRun.deploymentEnvironmentName,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Typography>
                    ) : null}
                  </div>
                  <RunSummary run={testRuns.selectedRun} />
                </div>
              </div>

              {testRuns.showsFunctionalResults ? (
                <div className="flex flex-wrap items-center gap-sm border-b border-neutral-200 px-lg py-sm">
                  <Input
                    value={testRuns.query}
                    onChange={(event) => testRuns.setQuery(event.target.value)}
                    placeholder="Search Test Cases"
                    prefix={<Search size={15} />}
                    className="w-64"
                  />
                  <Select
                    value={testRuns.resultFilter}
                    onValueChange={testRuns.setResultFilter}
                    options={RESULT_OPTIONS}
                    size="sm"
                    className="w-40"
                  />
                  <Select
                    value={testRuns.hasDefect}
                    onValueChange={testRuns.setHasDefect}
                    options={[
                      { value: '', label: 'All defect states' },
                      { value: 'true', label: 'Has defect' },
                      { value: 'false', label: 'No defect' },
                    ]}
                    size="sm"
                    className="w-40"
                  />
                  <Button size="sm" variant="outline" onClick={() => setAssigneeFilterOpen(true)}>
                    {testRuns.assigneeId
                      ? (personFor(testRuns.assigneeId)?.fullName ?? 'Assignee selected')
                      : 'Filter assignee'}
                  </Button>
                  {selectedIds.size > 0 ? (
                    <>
                      <Typography variant="small" className="ml-auto">
                        {selectedIds.size} selected
                      </Typography>
                      <Select
                        value={batchResult}
                        onValueChange={setBatchResult}
                        options={RESULT_OPTIONS.slice(2)}
                        size="sm"
                        className="w-36"
                      />
                      <Button size="sm" onClick={() => void applyBatch()}>
                        Apply
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setAssignTarget({
                            ids: [...selectedIds],
                            value: null,
                          })
                        }
                      >
                        Assign user
                      </Button>
                    </>
                  ) : null}
                </div>
              ) : null}

              <div className="min-h-0 flex-1 overflow-auto">
                {testRuns.loadingResults ? (
                  <PageSkeleton variant="list" className="p-lg" />
                ) : (
                  <div className="space-y-lg p-lg">
                    {testRuns.showsFunctionalResults ? (
                      <section className="space-y-sm">
                        <Typography variant="h4">Functional results</Typography>
                        <DataTable
                          tableClassName="min-w-max"
                          ariaLabel="Functional test results"
                          rows={testRuns.results}
                          rowKey={(result) => result.id}
                          selectedKeys={selectedIds}
                          onSelectedKeysChange={setSelectedIds}
                          emptyMessage="No functional results."
                          columns={[
                            {
                              id: 'case',
                              header: 'Test Case',
                              kind: 'code',
                              width: '288px',
                              cell: (result) => (
                                <div>
                                  <div>{result.testCase?.code ?? '—'}</div>
                                  <Typography
                                    variant="caption"
                                    tone="muted"
                                    className="block max-w-72 truncate"
                                  >
                                    {result.testCase?.title ?? 'Test Case'}
                                  </Typography>
                                </div>
                              ),
                            },
                            {
                              id: 'result',
                              header: 'Result',
                              cell: (result) => (
                                <div className="flex items-center gap-xs">
                                  <Badge tone={resultTone(result.resultStatus)} size="sm">
                                    {result.resultStatus}
                                  </Badge>
                                  <Select
                                    value={result.resultStatus}
                                    onValueChange={(next: string) =>
                                      void testRuns.updateResult(result.id, { result: next })
                                    }
                                    options={RESULT_OPTIONS.slice(1)}
                                    size="sm"
                                    className="w-32"
                                  />
                                </div>
                              ),
                            },
                            {
                              id: 'assignee',
                              header: 'Assignee',
                              cell: (result) => (
                                <button
                                  type="button"
                                  className="min-w-44 text-left"
                                  onClick={() =>
                                    setAssignTarget({
                                      ids: [result.id],
                                      value: result.assigneeId ?? null,
                                    })
                                  }
                                >
                                  <UserIdentity
                                    userId={result.assigneeId}
                                    person={personFor(result.assigneeId)}
                                    showEmail
                                    size="xs"
                                  />
                                </button>
                              ),
                            },
                            {
                              id: 'comment',
                              header: 'Comment',
                              width: '256px',
                              cell: (result) => (
                                <Input
                                  size="sm"
                                  variant="outline"
                                  defaultValue={result.comment ?? ''}
                                  placeholder="Add execution comment"
                                  onBlur={(event) => {
                                    const comment = event.target.value || null
                                    if (comment !== (result.comment ?? null))
                                      void testRuns.updateResult(result.id, { comment })
                                  }}
                                  onKeyDown={(event) => {
                                    if (event.key === 'Enter') event.currentTarget.blur()
                                  }}
                                />
                              ),
                            },
                            {
                              id: 'defects',
                              header: 'Defects',
                              accessor: (result) => (result.defectId ? 1 : 0),
                              align: 'center',
                            },
                            {
                              id: 'executed',
                              header: 'Executed',
                              accessor: (result) =>
                                result.executedAt
                                  ? new Date(result.executedAt).toLocaleString()
                                  : '—',
                            },
                          ]}
                        />
                      </section>
                    ) : null}

                    {testRuns.showsVerificationResults ? (
                      <section className="space-y-sm">
                        <Typography variant="h4">Verification results</Typography>
                        {testRuns.verificationResults.length === 0 ? (
                          <Typography tone="muted">
                            No verification results recorded for this run yet.
                          </Typography>
                        ) : (
                          <DataTable
                            tableClassName="min-w-max"
                            ariaLabel="Verification results"
                            rows={testRuns.verificationResults}
                            rowKey={(result) => result.id}
                            columns={[
                              {
                                id: 'case',
                                header: 'Verification Case',
                                accessor: () => '—',
                                kind: 'reference',
                              },
                              {
                                id: 'result',
                                header: 'Result',
                                cell: (result) => (
                                  <div className="flex items-center gap-xs">
                                    <Badge tone={resultTone(String(result.resultStatus))} size="sm">
                                      {result.resultStatus}
                                    </Badge>
                                    <Select
                                      value={String(result.resultStatus)}
                                      onValueChange={(resultStatus: string) =>
                                        void testRuns.updateVerificationResult(result.id, {
                                          resultStatus,
                                        })
                                      }
                                      options={RESULT_OPTIONS.slice(1)}
                                      size="sm"
                                      className="w-32"
                                    />
                                  </div>
                                ),
                              },
                              {
                                id: 'actual',
                                header: 'Actual value',
                                cell: (result) => (
                                  <Input
                                    size="sm"
                                    variant="outline"
                                    defaultValue={
                                      result.actualValue == null
                                        ? ''
                                        : `${result.actualValue}${result.actualValueUnit ? ` ${result.actualValueUnit}` : ''}`
                                    }
                                    placeholder="e.g. 120 ms"
                                    onBlur={(event) => {
                                      const raw = event.target.value.trim()
                                      if (!raw) {
                                        void testRuns.updateVerificationResult(result.id, {
                                          actualValue: null,
                                        })
                                        return
                                      }
                                      const match = raw.match(/^(-?\d+(?:\.\d+)?)\s*(.*)$/)
                                      if (match)
                                        void testRuns.updateVerificationResult(result.id, {
                                          actualValue: Number(match[1]),
                                        })
                                    }}
                                  />
                                ),
                              },
                              {
                                id: 'evidence',
                                header: 'Evidence',
                                cell: (result) => (
                                  <Input
                                    size="sm"
                                    variant="outline"
                                    defaultValue={result.evidenceReference ?? ''}
                                    placeholder="Evidence URL / ref"
                                    onBlur={(event) => {
                                      const evidenceReference = event.target.value.trim() || null
                                      if (evidenceReference !== (result.evidenceReference ?? null))
                                        void testRuns.updateVerificationResult(result.id, {
                                          evidenceReference,
                                        })
                                    }}
                                  />
                                ),
                              },
                              {
                                id: 'comment',
                                header: 'Comment',
                                cell: (result) => (
                                  <Input
                                    size="sm"
                                    variant="outline"
                                    defaultValue={result.comment ?? ''}
                                    placeholder="Comment"
                                    onBlur={(event) => {
                                      const comment = event.target.value || null
                                      if (comment !== (result.comment ?? null))
                                        void testRuns.updateVerificationResult(result.id, {
                                          comment,
                                        })
                                    }}
                                  />
                                ),
                              },
                            ]}
                          />
                        )}
                      </section>
                    ) : null}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-xl">
              <div className="text-center">
                <CheckCircle2 className="mx-auto mb-sm text-neutral-300" />
                <Typography tone="muted">Select a Test Run to execute.</Typography>
              </div>
            </div>
          )}
        </main>
      </div>
      <UserPickerModal
        open={Boolean(assignTarget)}
        value={assignTarget?.value}
        targetLabel="Test Result"
        targetCount={assignTarget?.ids.length ?? 1}
        saving={assignSaving}
        seedPeople={assigneePeople}
        allowRemoteSearch={false}
        onClose={() => setAssignTarget(null)}
        onSave={saveAssignment}
      />
      <UserPickerModal
        open={assigneeFilterOpen}
        value={testRuns.assigneeId}
        targetLabel="Assignee filter"
        seedPeople={assigneePeople}
        allowRemoteSearch={false}
        onClose={() => setAssigneeFilterOpen(false)}
        onSave={(assigneeId) => {
          testRuns.setAssigneeId(assigneeId ?? '')
          setAssigneeFilterOpen(false)
        }}
      />
    </div>
  )
}

function RunSummary({ run }: { run: TestRun }) {
  return (
    <div className="flex flex-wrap gap-md text-sm">
      <span className="text-success">{run.passed ?? 0} passed</span>
      <span className="text-error">{run.failed ?? 0} failed</span>
      <span className="text-warning">{run.blocked ?? 0} blocked</span>
      <span className="text-neutral-500">
        {Math.max(0, (run.total ?? 0) - (run.executed ?? 0))} not run
      </span>
    </div>
  )
}
