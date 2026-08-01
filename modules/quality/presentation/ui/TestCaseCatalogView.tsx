'use client'

import { useEffect, useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, ClipboardPaste, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  UserIdentity,
  UserPickerModal,
  useResolveUsers,
  type PersonIdentity,
} from '@/modules/platform'
import {
  Badge,
  BulkJobProgressPanel,
  Button,
  DataTable,
  Input,
  Modal,
  PageSkeleton,
  Select,
  Textarea,
  Typography,
} from '@/shared/ui'
import {
  BULK_MAX_ITEMS,
  BulkJobStatus,
} from '@/shared/lib/bulkJobs'
import { useBulkJobPoller } from '@/shared/lib/useBulkJobPoller'
import * as qualityApi from '../../infrastructure/api/quality.api'
import { useTestCaseCatalog } from '../hooks/useTestCaseCatalog'
import { useQualityAssigneePeople } from '../hooks/useQualityAssigneePeople'
import { qualityCaseLinksHref } from '../quality-routes'
import { TestCaseDetailDrawer } from './TestCaseDetailDrawer'
import { TestCaseJsonImportModal } from './TestCaseJsonImportModal'
import type { CreateTestCasePayload, TestCase } from '../../domain/model/quality'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...['DRAFT', 'READY', 'APPROVED', 'ARCHIVED'].map((value) => ({
    value,
    label: value,
  })),
]
const PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  ...['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((value) => ({ value, label: value })),
]
const AUTOMATION_OPTIONS = [
  { value: '', label: 'All automation' },
  ...['MANUAL', 'PLANNED', 'AUTOMATED'].map((value) => ({ value, label: value })),
]
const TYPE_OPTIONS = [
  'FUNCTIONAL',
  'NON_FUNCTIONAL',
  'INTEGRATION',
  'REGRESSION',
  'SMOKE',
  'PERFORMANCE',
  'SECURITY',
  'USABILITY',
  'EXPLORATORY',
].map((value) => ({
  value,
  label: value === 'NON_FUNCTIONAL' ? 'NON_FUNCTIONAL (legacy — use Verification Case)' : value,
  disabled: value === 'NON_FUNCTIONAL',
}))
const CREATE_TYPE_OPTIONS = TYPE_OPTIONS.filter((option) => option.value !== 'NON_FUNCTIONAL')

function resultTone(result?: string | null): 'neutral' | 'success' | 'warning' | 'error' {
  if (result === 'PASSED') return 'success'
  if (result === 'FAILED') return 'error'
  if (result === 'BLOCKED') return 'warning'
  return 'neutral'
}

function assigneePerson(testCase: TestCase): PersonIdentity | null {
  if (!testCase.assignee) return null
  return {
    id: testCase.assignee.id,
    fullName: testCase.assignee.displayName,
  }
}

function parseTestCases(text: string): Array<CreateTestCasePayload & { status?: string }> {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim())
  if (lines.length === 0) return []

  const knownTypes = new Set(TYPE_OPTIONS.map((option) => option.value))
  const looksLikeType = (value: string) => knownTypes.has(value.toUpperCase().replace(/\s+/g, '_'))

  const rows = lines.map((line) => line.split('\t').map((cell) => cell.trim()))
  const first = rows[0]?.map((cell) => cell.toLowerCase()) ?? []
  const hasHeader = first.some((cell) =>
    ['code', 'title', 'type', 'priority', 'status', 'automation'].some((key) => cell.includes(key))
  )

  const headerIndex = (aliases: string[]) => {
    if (!hasHeader) return -1
    return first.findIndex((cell) => aliases.some((alias) => cell.includes(alias)))
  }

  const codeIdx = headerIndex(['code'])
  const titleIdx = headerIndex(['title'])
  const typeIdx = headerIndex(['type'])
  const priorityIdx = headerIndex(['priority'])
  const statusIdx = headerIndex(['status'])
  const automationIdx = headerIndex(['automation'])

  const at = (cells: string[], namedIdx: number, fallbackIdx: number) =>
    cells[namedIdx >= 0 ? namedIdx : fallbackIdx] ?? ''

  return rows
    .slice(hasHeader ? 1 : 0)
    .map((cells) => {
      if (hasHeader) {
        return {
          code: at(cells, codeIdx, 0) || null,
          title: at(cells, titleIdx, 1),
          type: at(cells, typeIdx, 2) || undefined,
          priority: at(cells, priorityIdx, 3) || undefined,
          status: at(cells, statusIdx, 4) || undefined,
          automationStatus: at(cells, automationIdx, 5) || undefined,
        }
      }

      // No header: prefer Code · Title · Type · … when type sits in column 3;
      // keep legacy Title · Type · Priority · Status · Automation when type sits in column 2.
      const withCode = looksLikeType(cells[2] ?? '') || (!looksLikeType(cells[1] ?? '') && cells.length >= 6)
      if (withCode) {
        const [code = '', title = '', type = '', priority = '', status = '', automationStatus = ''] =
          cells
        return {
          code: code || null,
          title,
          type: type || undefined,
          priority: priority || undefined,
          status: status || undefined,
          automationStatus: automationStatus || undefined,
        }
      }

      const [title = '', type = '', priority = '', status = '', automationStatus = ''] = cells
      return {
        code: null,
        title,
        type: type || undefined,
        priority: priority || undefined,
        status: status || undefined,
        automationStatus: automationStatus || undefined,
      }
    })
    .filter((row) => row.title)
}

export function TestCaseCatalogView() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const catalog = useTestCaseCatalog(projectId)
  const { people: assigneePeople } = useQualityAssigneePeople(workspaceId)
  const linksHref = qualityCaseLinksHref(
    workspaceId,
    projectId,
    searchParams.get('useCaseId') ?? undefined
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [detailId, setDetailId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createCode, setCreateCode] = useState('')
  const [createTitle, setCreateTitle] = useState('')
  const [createType, setCreateType] = useState('FUNCTIONAL')
  const [creating, setCreating] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
  const [jsonOpen, setJsonOpen] = useState(false)
  const [pasteValue, setPasteValue] = useState('')
  const [pasteError, setPasteError] = useState<string | null>(null)
  const [pasteSubmitting, setPasteSubmitting] = useState(false)
  const pastePoller = useBulkJobPoller()
  const [batchField, setBatchField] = useState('status')
  const [batchValue, setBatchValue] = useState('READY')
  const [assignTarget, setAssignTarget] = useState<{
    ids: string[]
    value: string | null
    bulk: boolean
  } | null>(null)
  const [assignSaving, setAssignSaving] = useState(false)
  const [assigneeFilterOpen, setAssigneeFilterOpen] = useState(false)
  const { personFor: filterPersonFor } = useResolveUsers([catalog.assigneeId])

  useEffect(() => {
    if (searchParams.get('tab') !== 'links') return
    router.replace(linksHref)
  }, [searchParams, router, linksHref])

  useEffect(() => {
    if (searchParams.get('create') !== '1') return
    setCreateOpen(true)
  }, [searchParams])

  const pastedRows = useMemo(() => parseTestCases(pasteValue), [pasteValue])

  const createTestCase = async () => {
    if (!createTitle.trim()) {
      toast.error('Title is required')
      return
    }
    setCreating(true)
    try {
      const created = await catalog.create({
        title: createTitle.trim(),
        type: createType,
        code: createCode.trim() || null,
      })
      if (created) {
        setCreateOpen(false)
        setCreateCode('')
        setCreateTitle('')
        setCreateType('FUNCTIONAL')
        setDetailId(created.id)
      }
    } finally {
      setCreating(false)
    }
  }

  const applyBatch = async () => {
    if (
      batchField === 'status' &&
      ['READY', 'APPROVED'].includes(batchValue) &&
      catalog.items.some(
        (item) => selectedIds.has(item.id) && !item.useCaseId && !item.useCaseCount
      )
    ) {
      toast.error('Every selected Test Case must have a Use Case before this status change')
      return
    }
    await catalog.batchUpdate([...selectedIds], { [batchField]: batchValue })
    setSelectedIds(new Set())
    toast.success(`${selectedIds.size} Test Cases updated`)
  }

  const submitPaste = async () => {
    if (pastedRows.some((row) => row.type === 'NON_FUNCTIONAL')) {
      toast.error('Use Verification Cases for non-functional requirements')
      return
    }
    if (pastedRows.length > BULK_MAX_ITEMS) {
      setPasteError(`Maximum ${BULK_MAX_ITEMS} items per bulk request.`)
      return
    }
    setPasteError(null)
    setPasteSubmitting(true)
    pastePoller.reset()

    const payloads = pastedRows.map(({ status: _status, ...row }) => row)

    try {
      const job = await qualityApi.submitTestCasesBulk(projectId, payloads)
      setPasteSubmitting(false)
      toast.message('Job accepted', { description: 'Processing in the background…' })
      setPasteOpen(false)
      setPasteValue('')

      const done = await pastePoller.start(job.id, job)
      if (done.succeededItems > 0) await catalog.refetch()

      if (done.status === BulkJobStatus.Succeeded) {
        toast.success(
          done.resultSummary ??
            `Created ${done.succeededItems} Test Case${done.succeededItems === 1 ? '' : 's'}`
        )
        pastePoller.reset()
      } else if (done.status === BulkJobStatus.Partial) {
        toast.warning(
          done.resultSummary ??
            `${done.succeededItems} created, ${done.failedItems} rows failed validation`
        )
      } else {
        toast.error(done.errorMessage ?? done.resultSummary ?? 'Bulk create failed')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create Test Cases'
      setPasteError(message)
    } finally {
      setPasteSubmitting(false)
    }
  }

  const pasteJobRunning = pastePoller.isPolling
  const pasteBusy = pasteSubmitting || pasteJobRunning

  const saveAssignment = async (assigneeId: string | null) => {
    if (!assignTarget) return
    setAssignSaving(true)
    try {
      if (assignTarget.bulk) {
        await catalog.batchUpdate(assignTarget.ids, { assigneeId })
        setSelectedIds(new Set())
      } else {
        await catalog.update(assignTarget.ids[0]!, { assigneeId })
        await catalog.refetch()
      }
      toast.success(assigneeId ? 'Assignee updated' : 'Assignment cleared')
      setAssignTarget(null)
    } finally {
      setAssignSaving(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-white px-3 py-3 lg:px-4 lg:py-3">
      <header className="border-b border-neutral-200 pb-2">
        <div className="flex flex-wrap items-start justify-between gap-md">
          <div>
            <Typography as="h1" size="md" weight="medium">
              Test Cases
            </Typography>
            <Typography variant="caption" tone="muted" className="mt-0.5">
              Author reusable Test Cases. Execution results are managed in Test Runs.
            </Typography>
          </div>
          <div className="flex gap-sm">
            <Button as={NextLink} href={linksHref} variant="outline">
              Use Case → Test Case
            </Button>
            <Button
              variant="outline"
              icon={<ClipboardPaste size={16} />}
              onClick={() => setPasteOpen(true)}
            >
              Bulk add (Excel)
            </Button>
            <Button variant="outline" onClick={() => setJsonOpen(true)}>
              JSON import
            </Button>
            <Button icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
              Single add
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-sm border-b border-neutral-200 px-lg py-sm">
        <Input
          value={catalog.query}
          onChange={(event) => catalog.setQuery(event.target.value)}
          placeholder="Search code or title"
          prefix={<Search size={15} />}
          className="w-64"
        />
        <Select
          value={catalog.status}
          onValueChange={catalog.setStatus}
          options={STATUS_OPTIONS}
          size="sm"
          className="w-40"
        />
        <Select
          value={catalog.priority}
          onValueChange={catalog.setPriority}
          options={PRIORITY_OPTIONS}
          size="sm"
          className="w-40"
        />
        <Select
          value={catalog.automationStatus}
          onValueChange={catalog.setAutomationStatus}
          options={AUTOMATION_OPTIONS}
          size="sm"
          className="w-44"
        />
        <Button size="sm" variant="outline" onClick={() => setAssigneeFilterOpen(true)}>
          {catalog.assigneeId
            ? (filterPersonFor(catalog.assigneeId)?.fullName ?? 'Assignee selected')
            : 'Filter assignee'}
        </Button>
        <Select
          value={catalog.hasOpenDefect}
          onValueChange={catalog.setHasOpenDefect}
          options={[
            { value: '', label: 'All defect states' },
            { value: 'true', label: 'Has open defects' },
            { value: 'false', label: 'No open defects' },
          ]}
          size="sm"
          className="w-44"
        />
        <Select
          value={catalog.sort}
          onValueChange={catalog.setSort}
          options={[
            { value: 'updatedAt,desc', label: 'Recently updated' },
            { value: 'code,asc', label: 'Code A–Z' },
            { value: 'priority,desc', label: 'Priority' },
            { value: 'title,asc', label: 'Title A–Z' },
          ]}
          size="sm"
          className="ml-auto w-44"
        />
      </div>

      {selectedIds.size > 0 ? (
        <div className="flex flex-wrap items-center gap-sm border-b border-neutral-200 bg-neutral-50 px-lg py-sm">
          <Typography variant="small" weight="medium">
            {selectedIds.size} selected
          </Typography>
          <Select
            value={batchField}
            onValueChange={(value: string) => {
              setBatchField(value)
              setBatchValue(
                value === 'priority' ? 'HIGH' : value === 'automationStatus' ? 'MANUAL' : 'READY'
              )
            }}
            options={[
              { value: 'status', label: 'Change status' },
              { value: 'priority', label: 'Change priority' },
              { value: 'automationStatus', label: 'Set automation' },
            ]}
            size="sm"
            className="w-44"
          />
          <Select
            value={batchValue}
            onValueChange={setBatchValue}
            options={
              batchField === 'priority'
                ? PRIORITY_OPTIONS.slice(1)
                : batchField === 'automationStatus'
                  ? AUTOMATION_OPTIONS.slice(1)
                  : STATUS_OPTIONS.slice(1)
            }
            size="sm"
            className="w-40"
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
                bulk: true,
              })
            }
          >
            Assign user
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())}>
            Clear
          </Button>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto">
        {catalog.loading && catalog.items.length === 0 ? (
          <PageSkeleton variant="list" className="p-lg" />
        ) : catalog.error ? (
          <Typography tone="error" className="p-lg">
            {catalog.error}
          </Typography>
        ) : (
          <DataTable
            tableClassName="min-w-max"
            ariaLabel="Test cases"
            rows={catalog.items}
            rowKey={(testCase) => testCase.id}
            selectedKeys={selectedIds}
            onSelectedKeysChange={setSelectedIds}
            emptyMessage="No Test Cases match these filters."
            columns={[
              {
                id: 'code',
                header: 'Code',
                kind: 'code',
                cell: (testCase) => (
                  <button
                    type="button"
                    className="text-secondary hover:underline"
                    onClick={() => setDetailId(testCase.id)}
                  >
                    {testCase.code ?? '—'}
                  </button>
                ),
              },
              {
                id: 'title',
                header: 'Title',
                width: '320px',
                cell: (testCase) => (
                  <Input
                    size="sm"
                    variant="outline"
                    defaultValue={testCase.title}
                    disabled={catalog.savingIds.has(testCase.id)}
                    aria-label={`${testCase.code ?? 'Test Case'} title`}
                    onBlur={(event) => {
                      const title = event.target.value.trim()
                      if (title && title !== testCase.title)
                        void catalog.update(testCase.id, { title })
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') event.currentTarget.blur()
                    }}
                  />
                ),
              },
              {
                id: 'type',
                header: 'Type',
                cell: (testCase) => (
                  <Select
                    size="sm"
                    value={testCase.type ?? 'FUNCTIONAL'}
                    options={TYPE_OPTIONS}
                    disabled={catalog.savingIds.has(testCase.id)}
                    onValueChange={(type: string) => void catalog.update(testCase.id, { type })}
                    className="w-36"
                  />
                ),
              },
              {
                id: 'priority',
                header: 'Priority',
                cell: (testCase) => (
                  <Select
                    size="sm"
                    value={testCase.priority ?? 'MEDIUM'}
                    options={PRIORITY_OPTIONS.slice(1)}
                    disabled={catalog.savingIds.has(testCase.id)}
                    onValueChange={(priority: string) =>
                      void catalog.update(testCase.id, { priority })
                    }
                    className="w-32"
                  />
                ),
              },
              {
                id: 'status',
                header: 'Status',
                cell: (testCase) => (
                  <Select
                    size="sm"
                    value={testCase.status}
                    options={STATUS_OPTIONS.slice(1).map((option) => ({
                      ...option,
                      disabled:
                        !testCase.useCaseId &&
                        !testCase.useCaseCount &&
                        (option.value === 'READY' || option.value === 'APPROVED'),
                    }))}
                    disabled={catalog.savingIds.has(testCase.id)}
                    onValueChange={(status: string) => void catalog.update(testCase.id, { status })}
                    className="w-36"
                  />
                ),
              },
              {
                id: 'assignee',
                header: 'Assignee',
                cell: (testCase) => (
                  <button
                    type="button"
                    className="min-w-44 text-left"
                    onClick={() =>
                      setAssignTarget({
                        ids: [testCase.id],
                        value: testCase.assigneeId ?? null,
                        bulk: false,
                      })
                    }
                  >
                    <UserIdentity
                      userId={testCase.assigneeId}
                      person={assigneePerson(testCase)}
                      showEmail
                      size="xs"
                    />
                  </button>
                ),
              },
              {
                id: 'automation',
                header: 'Automation',
                cell: (testCase) => (
                  <Select
                    size="sm"
                    value={testCase.automationStatus ?? 'MANUAL'}
                    options={AUTOMATION_OPTIONS.slice(1)}
                    disabled={catalog.savingIds.has(testCase.id)}
                    onValueChange={(automationStatus: string) =>
                      void catalog.update(testCase.id, { automationStatus })
                    }
                    className="w-36"
                  />
                ),
              },
              {
                id: 'steps',
                header: 'Steps',
                accessor: (testCase) => testCase.stepCount ?? 0,
                align: 'center',
              },
              {
                id: 'useCases',
                header: 'Use Cases',
                accessor: (testCase) => testCase.useCaseCount ?? 0,
                align: 'center',
              },
              {
                id: 'latest',
                header: 'Latest result',
                cell: (testCase) => (
                  <Badge tone={resultTone(testCase.latestResult)} size="sm">
                    {testCase.latestResult ?? 'NOT RUN'}
                  </Badge>
                ),
              },
              {
                id: 'defects',
                header: 'Defects',
                align: 'center',
                cell: (testCase) => (
                  <span className={testCase.openDefectCount ? 'text-error' : 'text-neutral-500'}>
                    {testCase.openDefectCount ?? 0}
                  </span>
                ),
              },
            ]}
          />
        )}
      </div>

      <footer className="flex items-center justify-between border-t border-neutral-200 px-lg py-sm">
        <Typography variant="caption" tone="muted">
          {catalog.total} Test Cases
        </Typography>
        <div className="flex items-center gap-sm">
          <Button
            size="sm"
            variant="ghost"
            icon={<ChevronLeft size={15} />}
            aria-label="Previous page"
            disabled={catalog.offset === 0}
            onClick={() => catalog.setOffset(Math.max(0, catalog.offset - catalog.pageSize))}
          />
          <Typography variant="caption" tone="muted">
            {catalog.total === 0
              ? '0–0'
              : `${catalog.offset + 1}–${Math.min(catalog.offset + catalog.pageSize, catalog.total)}`}
          </Typography>
          <Button
            size="sm"
            variant="ghost"
            icon={<ChevronRight size={15} />}
            aria-label="Next page"
            disabled={catalog.offset + catalog.pageSize >= catalog.total}
            onClick={() => catalog.setOffset(catalog.offset + catalog.pageSize)}
          />
        </div>
      </footer>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="New Functional Test Case"
        actions={[
          {
            label: 'Cancel',
            variant: 'ghost',
            disabled: creating,
            onClick: () => setCreateOpen(false),
          },
          {
            label: creating ? 'Creating…' : 'Create',
            variant: 'primary',
            loading: creating,
            disabled: creating || !createTitle.trim(),
            onClick: () => void createTestCase(),
          },
        ]}
      >
        <div className="space-y-md">
          <Input
            label="Code"
            value={createCode}
            placeholder="TC-001"
            onChange={(event) => setCreateCode(event.target.value)}
          />
          <Input
            label="Title"
            value={createTitle}
            required
            onChange={(event) => setCreateTitle(event.target.value)}
          />
          <Select
            label="Type"
            value={createType}
            options={CREATE_TYPE_OPTIONS}
            onValueChange={setCreateType}
          />
          <Typography variant="caption" tone="muted">
            Creates a Test Case shell. Link Use Cases later from the detail Traceability tab.
          </Typography>
        </div>
      </Modal>

      <Modal
        open={pasteOpen}
        onClose={() => {
          if (pasteBusy) return
          setPasteOpen(false)
          setPasteError(null)
          pastePoller.reset()
        }}
        title="Paste Test Cases from Excel"
        size="xl"
        actions={[
          {
            label: 'Cancel',
            variant: 'ghost',
            onClick: () => {
              if (pasteBusy) return
              setPasteOpen(false)
              setPasteError(null)
              pastePoller.reset()
            },
          },
          {
            label: pasteSubmitting
              ? 'Submitting…'
              : pasteJobRunning
                ? 'Running…'
                : `Create ${pastedRows.length}`,
            variant: 'primary',
            disabled: pasteBusy || pastedRows.length === 0,
            loading: pasteSubmitting,
            onClick: () => void submitPaste(),
          },
        ]}
      >
        <div className="space-y-md">
          <Typography variant="small" tone="muted">
            Paste columns in this order: Code · Title · Type · Priority · Status · Automation.
            Do not include system ID — the backend assigns it. Link Use Cases later from detail.
          </Typography>
          <Textarea
            rows={10}
            value={pasteValue}
            onChange={(event) => {
              setPasteValue(event.target.value)
              setPasteError(null)
            }}
            placeholder={'TC-001\tValid login\tFUNCTIONAL\tHIGH\tREADY\tMANUAL'}
            disabled={pasteBusy}
          />
          <BulkJobProgressPanel
            job={pastePoller.job}
            percent={pastePoller.percent}
            isPolling={pastePoller.isPolling}
            error={pastePoller.error}
            onRetryFailed={(failedItems) => {
              pastePoller.reset()
              void (async () => {
                try {
                  const job = await qualityApi.submitTestCasesBulk(
                    projectId,
                    failedItems as unknown as Parameters<typeof qualityApi.submitTestCasesBulk>[1]
                  )
                  toast.message('Job accepted', {
                    description: 'Processing in the background…',
                  })
                  await pastePoller.start(job.id, job)
                } catch {
                  /* interceptor */
                }
              })()
            }}
            onRetry={() => {
              pastePoller.reset()
              void submitPaste()
            }}
          />
          {pasteError ? (
            <Typography variant="small" tone="error">
              {pasteError}
            </Typography>
          ) : null}
          <Typography variant="caption" tone="muted">
            {pastedRows.length} valid rows detected · max {BULK_MAX_ITEMS} (async bulk)
          </Typography>
        </div>
      </Modal>

      <TestCaseJsonImportModal
        open={jsonOpen}
        onClose={() => setJsonOpen(false)}
        onComplete={() => catalog.refetch()}
      />

      <UserPickerModal
        open={Boolean(assignTarget)}
        value={assignTarget?.value}
        targetLabel="Test Case"
        targetCount={assignTarget?.ids.length ?? 1}
        saving={assignSaving}
        seedPeople={assigneePeople}
        allowRemoteSearch={false}
        onClose={() => setAssignTarget(null)}
        onSave={saveAssignment}
      />
      <UserPickerModal
        open={assigneeFilterOpen}
        value={catalog.assigneeId}
        targetLabel="Assignee filter"
        seedPeople={assigneePeople}
        allowRemoteSearch={false}
        onClose={() => setAssigneeFilterOpen(false)}
        onSave={(assigneeId) => {
          catalog.setAssigneeId(assigneeId ?? '')
          setAssigneeFilterOpen(false)
        }}
      />

      <TestCaseDetailDrawer
        projectId={projectId}
        testCaseId={detailId}
        assigneePeople={assigneePeople}
        onClose={() => setDetailId(null)}
        onChanged={() => void catalog.refetch()}
      />
    </div>
  )
}
