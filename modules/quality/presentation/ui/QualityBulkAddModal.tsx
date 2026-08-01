'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  BulkJobProgressPanel,
  Button,
  DataTable,
  Input,
  Modal,
  Typography,
} from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import {
  BULK_MAX_ITEMS,
  BulkJobStatus,
} from '@/shared/lib/bulkJobs'
import { useBulkJobPoller } from '@/shared/lib/useBulkJobPoller'
import * as qualityApi from '../../infrastructure/api/quality.api'
import { cn } from '@/utils/cn'
import {
  emptyDraftValues,
  isDraftRowBlank,
  isDraftRowValid,
  mapDraftToCreateInput,
  QUALITY_BULK_COLUMNS,
  QUALITY_BULK_TITLES,
  type QualityBulkKind,
  type QualityCreateInput,
  type QualityDraftValues,
} from './quality-bulk.model'

interface DraftRow {
  id: string
  values: QualityDraftValues
  error?: string | null
}

function newRow(kind: QualityBulkKind): DraftRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    values: emptyDraftValues(kind),
    error: null,
  }
}

function looksLikeHeader(cells: string[], columns: { key: string; label: string }[]): boolean {
  const joined = cells.map((c) => c.trim().toLowerCase()).join('|')
  return columns.some((col) => {
    const label = col.label.toLowerCase()
    const key = col.key.toLowerCase()
    return joined.includes(label) || joined.includes(key)
  })
}

function parseClipboardToRows(text: string, kind: QualityBulkKind): DraftRow[] {
  const columns = QUALITY_BULK_COLUMNS[kind]
  const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  if (!raw) return []

  const lines = raw.split('\n').filter((line) => line.trim().length > 0)
  if (lines.length === 0) return []

  const delim = lines[0].includes('\t') ? '\t' : ','
  const parsed = lines.map((line) => line.split(delim).map((c) => c.trim()))

  let start = 0
  if (parsed[0] && looksLikeHeader(parsed[0], columns)) start = 1

  const rows: DraftRow[] = []
  for (let i = start; i < parsed.length; i++) {
    const cells = parsed[i] ?? []
    const row = newRow(kind)
    columns.forEach((col, idx) => {
      if (cells[idx]) row.values[col.key] = cells[idx]
    })
    if (!isDraftRowBlank(kind, row.values)) rows.push(row)
  }
  return rows
}

interface QualityBulkAddModalProps {
  open: boolean
  kind: QualityBulkKind
  onClose: () => void
  onCreate: (input: QualityCreateInput) => Promise<void>
  onBatchComplete?: () => Promise<void> | void
}

export function QualityBulkAddModal({
  open,
  kind,
  onClose,
  onCreate,
  onBatchComplete,
}: QualityBulkAddModalProps) {
  const { projectId } = useParams<{ projectId: string }>()
  const columns = QUALITY_BULK_COLUMNS[kind]
  const [rows, setRows] = useState<DraftRow[]>([newRow(kind)])
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pasteHint, setPasteHint] = useState(false)
  const poller = useBulkJobPoller()

  useEffect(() => {
    if (!open) return
    setRows([newRow(kind)])
    setFormError(null)
    setSubmitting(false)
    submittingRef.current = false
    setPasteHint(false)
    poller.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when modal opens
  }, [open, kind])

  const validRows = useMemo(() => rows.filter((r) => isDraftRowValid(kind, r.values)), [rows, kind])

  const updateCell = (id: string, key: string, value: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, values: { ...r.values, [key]: value }, error: null } : r
      )
    )
  }

  const addRow = () => setRows((prev) => [...prev, newRow(kind)])

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? [newRow(kind)] : prev.filter((r) => r.id !== id)))
  }

  const applyPaste = useCallback(
    (text: string) => {
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        setFormError('Use JSON Import for JSON payloads. Bulk add accepts Excel/TSV only.')
        return
      }
      const pasted = parseClipboardToRows(text, kind)
      if (pasted.length === 0) return
      setRows((prev) => {
        const onlyBlank = prev.length === 1 && isDraftRowBlank(kind, prev[0].values)
        return onlyBlank ? pasted : [...prev, ...pasted]
      })
      setPasteHint(true)
      setFormError(null)
    },
    [kind]
  )

  useEffect(() => {
    if (!open) return
    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain') ?? ''
      const multi = text.includes('\n') || (text.includes('\t') && text.trim().length > 0)
      if (!multi) return
      e.preventDefault()
      applyPaste(text)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [open, applyPaste])

  const handleSubmit = async () => {
    if (submittingRef.current) return
    if (validRows.length === 0) {
      setFormError('Add at least one row with required fields.')
      return
    }
    if (kind === 'TEST_CASE' && validRows.some((row) => row.values.type === 'NON_FUNCTIONAL')) {
      setFormError('Use Verification Cases for non-functional requirements.')
      return
    }
    if (kind === 'TEST_CASE' && validRows.length > BULK_MAX_ITEMS) {
      setFormError(`Maximum ${BULK_MAX_ITEMS} items per bulk request.`)
      return
    }

    if (kind === 'TEST_CASE') {
      submittingRef.current = true
      setSubmitting(true)
      setFormError(null)
      poller.reset()

      const payloads = validRows.map((row) => {
        const input = mapDraftToCreateInput(kind, row.values)
        return input.kind === 'TEST_CASE' ? input.payload : null
      }).filter((payload): payload is NonNullable<typeof payload> => payload != null)

      try {
        const job = await qualityApi.submitTestCasesBulk(projectId, payloads)
        setSubmitting(false)
        submittingRef.current = false
        toast.message('Job accepted', { description: 'Processing in the background…' })
        onClose()

        const done = await poller.start(job.id, job)
        if (done.succeededItems > 0) await onBatchComplete?.()

        if (done.status === BulkJobStatus.Succeeded) {
          toast.success(
            done.resultSummary ??
              `Created ${done.succeededItems} test case${done.succeededItems === 1 ? '' : 's'}`
          )
        } else if (done.status === BulkJobStatus.Partial) {
          toast.warning(
            done.resultSummary ??
              `${done.succeededItems} created, ${done.failedItems} failed. Successful items are already saved.`
          )
        } else {
          toast.error(done.errorMessage ?? done.resultSummary ?? 'Bulk create failed')
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        const message =
          err instanceof ApiError
            ? err.problem.detail || err.message
            : err instanceof Error
              ? err.message
              : 'Failed to create test cases'
        setFormError(message)
      } finally {
        submittingRef.current = false
        setSubmitting(false)
      }
      return
    }

    // Other quality kinds: no async /bulk on BE — never FE-loop create.
    // Single row may use the normal create API; multi-row requires the bulk endpoint.
    const actionable = rows.filter(
      (row) => !isDraftRowBlank(kind, row.values) && isDraftRowValid(kind, row.values)
    )
    if (actionable.length === 0) {
      setFormError('Add at least one row with required fields.')
      return
    }
    if (actionable.length > 1) {
      setFormError(
        `Async bulk create (POST …/bulk) is only available for Test Cases. For ${QUALITY_BULK_TITLES[kind]}, create one row at a time or wait for a BE bulk API.`
      )
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setFormError(null)
    try {
      await onCreate(mapDraftToCreateInput(kind, actionable[0]!.values))
      await onBatchComplete?.()
      onClose()
    } catch (err: unknown) {
      const message =
        err instanceof ApiError && err.status === 409
          ? 'Already exists or conflict'
          : err instanceof Error
            ? err.message
            : 'Failed'
      setFormError(message)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const jobRunning = poller.isPolling
  const busy = submitting || jobRunning

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={QUALITY_BULK_TITLES[kind]}
      size="2xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: submitting ? 'Submitting…' : jobRunning ? 'Running…' : `Create ${validRows.length}`,
          onClick: () => void handleSubmit(),
          variant: 'primary',
          disabled: busy || validRows.length === 0,
          loading: submitting,
        },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Add rows or paste Excel/TSV (Ctrl/Cmd+V) — columns:{' '}
          {columns.map((c) => c.label).join(' · ')}.
          {kind === 'TEST_CASE'
            ? ' Use code (business key), never system id. Use JSON Import for full JSON payloads.'
            : ' Use JSON Import for full JSON payloads.'}
        </Typography>
        {pasteHint ? (
          <Typography variant="caption" tone="muted">
            Pasted — review rows below.
          </Typography>
        ) : null}
        {kind === 'TEST_CASE' ? (
          <BulkJobProgressPanel
            job={poller.job}
            percent={poller.percent}
            isPolling={poller.isPolling}
            error={poller.error}
            onRetryFailed={(failedItems) => {
              poller.reset()
              void (async () => {
                try {
                  const job = await qualityApi.submitTestCasesBulk(
                    projectId,
                    failedItems as unknown as Parameters<typeof qualityApi.submitTestCasesBulk>[1]
                  )
                  toast.message('Job accepted', {
                    description: 'Processing in the background…',
                  })
                  const done = await poller.start(job.id, job)
                  if (done.succeededItems > 0) await onBatchComplete?.()
                  if (done.status === BulkJobStatus.Succeeded) {
                    toast.success(done.resultSummary ?? `Created ${done.succeededItems}`)
                    onClose()
                  } else if (done.status === BulkJobStatus.Partial) {
                    toast.warning(
                      done.resultSummary ??
                        `${done.succeededItems} created, ${done.failedItems} failed`
                    )
                  } else {
                    toast.error(done.errorMessage ?? done.resultSummary ?? 'Bulk create failed')
                  }
                } catch (err: unknown) {
                  if (err instanceof DOMException && err.name === 'AbortError') return
                  setFormError(err instanceof Error ? err.message : 'Retry failed')
                }
              })()
            }}
            onRetry={() => {
              poller.reset()
              void handleSubmit()
            }}
          />
        ) : null}
        {kind === 'TEST_CASE' ? (
          <Typography variant="small" tone="muted">
            Create shells only (code, title, type, priority). Link Use Cases later from Test Case detail.
          </Typography>
        ) : null}
        {formError ? (
          <Typography variant="small" tone="error">
            {formError}
          </Typography>
        ) : null}

        <DataTable
          className="border border-neutral-200"
          tableClassName="min-w-[640px]"
          ariaLabel="Bulk add quality items"
          rows={rows}
          rowKey={(row) => row.id}
          rowClassName={(row) => cn('align-top', row.error && 'bg-error/5')}
          columns={[
            { id: 'index', header: '#', cell: (_row, index) => index + 1, width: '48px' },
            ...columns.map((col) => ({
              id: col.key,
              header: `${col.label}${col.required ? ' *' : ''}`,
              kind: col.key === 'code' ? ('code' as const) : undefined,
              cell: (row: DraftRow) => (
                <Input
                  fullWidth
                  value={row.values[col.key] ?? ''}
                  placeholder={col.placeholder}
                      onChange={(event) => updateCell(row.id, col.key, event.target.value)}
                      disabled={busy}
                    />
              ),
            })),
            {
              id: 'remove',
              header: '',
              width: '48px',
              cell: (row) => (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Remove row"
                  onClick={() => removeRow(row.id)}
                  disabled={busy}
                >
                  <Trash2 size={14} />
                </Button>
              ),
            },
          ]}
        />

        {rows.some((r) => r.error) ? (
          <ul className="space-y-1">
            {rows.map((r, i) =>
              r.error ? (
                <li key={r.id}>
                  <Typography variant="caption" tone="error">
                    Row {i + 1}: {r.error}
                  </Typography>
                </li>
              ) : null
            )}
          </ul>
        ) : null}

        <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={addRow} disabled={busy}>
          Add row
        </Button>
        {kind === 'TEST_CASE' ? (
          <Typography variant="small" tone="muted">
          {kind === 'TEST_CASE' ? (
            <Typography variant="caption" tone="muted">
              {validRows.length} ready · max {BULK_MAX_ITEMS} (async bulk)
            </Typography>
          ) : (
            <Typography variant="caption" tone="muted">
              Multi-row async bulk is only for Test Cases. Other kinds: one row per submit.
            </Typography>
          )}
          </Typography>
        ) : null}
      </div>
    </Modal>
  )
}
