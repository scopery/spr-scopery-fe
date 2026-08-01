'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  BulkJobProgressPanel,
  Button,
  DataTable,
  Input,
  Modal,
  Stack,
  Typography,
} from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import {
  BULK_MAX_ITEMS,
  BulkJobStatus,
  type BulkJobResponse,
} from '@/shared/lib/bulkJobs'
import { useBulkJobPoller } from '@/shared/lib/useBulkJobPoller'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'
import type { CreateUseCaseBody, BulkCreateUseCaseItem } from '../model/use-case'

interface DraftRow {
  id: string
  key: string
  name: string
  actor: string
  goal: string
  trigger: string
  error?: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  onSubmitBulk: (items: BulkCreateUseCaseItem[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}

const COLUMNS = [
  { key: 'key', label: 'Key', required: true, placeholder: 'UC-001' },
  { key: 'name', label: 'Name', required: true, placeholder: 'Use case name' },
  { key: 'actor', label: 'Actor', placeholder: 'End user' },
  { key: 'goal', label: 'Goal', placeholder: 'Optional' },
  { key: 'trigger', label: 'Trigger', placeholder: 'Optional' },
] as const

function newRow(): DraftRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    key: '',
    name: '',
    actor: '',
    goal: '',
    trigger: '',
    error: null,
  }
}

function looksLikeHeader(cells: string[]): boolean {
  const joined = cells.map((c) => c.trim().toLowerCase()).join('|')
  return COLUMNS.some((col) => joined.includes(col.label.toLowerCase()) || joined.includes(col.key))
}

function parseClipboard(text: string): DraftRow[] {
  const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  if (!raw) return []
  const lines = raw.split('\n').filter((l) => l.trim().length > 0)
  if (!lines.length) return []
  const delim = lines[0].includes('\t') ? '\t' : ','
  const parsed = lines.map((l) => l.split(delim).map((c) => c.trim()))
  let start = 0
  if (parsed[0] && looksLikeHeader(parsed[0])) start = 1
  const rows: DraftRow[] = []
  for (let i = start; i < parsed.length; i++) {
    const cells = parsed[i] ?? []
    const row = newRow()
    row.key = cells[0] ?? ''
    row.name = cells[1] ?? ''
    row.actor = cells[2] ?? ''
    row.goal = cells[3] ?? ''
    row.trigger = cells[4] ?? ''
    if (row.key || row.name) rows.push(row)
  }
  return rows
}

export function UseCaseBulkAddModal({
  open,
  onClose,
  onSubmitBulk,
  onBatchComplete,
}: Props) {
  const [rows, setRows] = useState<DraftRow[]>([newRow()])
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pasteHint, setPasteHint] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const poller = useBulkJobPoller()

  useEffect(() => {
    if (!open) return
    setRows([newRow()])
    setSubmitting(false)
    submittingRef.current = false
    setFormError(null)
    setPasteHint(false)
    setJobId(null)
    poller.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when modal opens
  }, [open])

  const validRows = useMemo(() => rows.filter((r) => r.key.trim() && r.name.trim()), [rows])

  const updateRow = (id: string, patch: Partial<DraftRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, error: null } : r)))

  const addRow = () => setRows((prev) => [...prev, newRow()])

  const removeRow = (id: string) =>
    setRows((prev) => (prev.length <= 1 ? [newRow()] : prev.filter((r) => r.id !== id)))

  const applyPaste = useCallback((text: string) => {
    if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      setFormError('Use JSON Import for JSON payloads. Bulk add accepts Excel/TSV only.')
      return
    }
    const pasted = parseClipboard(text)
    if (!pasted.length) return
    setRows((prev) => {
      const onlyBlank = prev.length === 1 && !prev[0].key && !prev[0].name
      return onlyBlank ? pasted : [...prev, ...pasted]
    })
    setPasteHint(true)
    setFormError(null)
  }, [])

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

  const buildItems = useCallback((): CreateUseCaseBody[] | null => {
    const items: CreateUseCaseBody[] = []
    const nextRows = rows.map((row) => {
      if (!row.key.trim() && !row.name.trim()) return row
      if (!row.key.trim() || !row.name.trim()) {
        return { ...row, error: 'Key and name are required' }
      }
      items.push({
        key: row.key.trim(),
        name: row.name.trim(),
        primaryActorName: row.actor.trim() || null,
        goal: row.goal.trim() || null,
        triggerText: row.trigger.trim() || null,
      })
      return { ...row, error: null }
    })
    if (nextRows.some((r) => r.error)) {
      setRows(nextRows)
      return null
    }
    return items
  }, [rows])

  const executeBulk = useCallback(
    async (items: CreateUseCaseBody[]) => {
      if (submittingRef.current || poller.isPolling) return
      if (items.length === 0) {
        setFormError('No items to submit.')
        return
      }
      if (items.length > BULK_MAX_ITEMS) {
        setFormError(`Maximum ${BULK_MAX_ITEMS} items per bulk request.`)
        return
      }

      submittingRef.current = true
      setSubmitting(true)
      setFormError(null)
      setJobId(null)
      poller.reset()

      try {
        const job = await onSubmitBulk(items)
        setJobId(job.id)
        // Job accepted — stop button spinner; close grid; follow in background.
        submittingRef.current = false
        setSubmitting(false)
        toast.message('Job accepted', { description: 'Processing in the background…' })
        onClose()

        const done = await poller.start(job.id, job)
        if (done.succeededItems > 0) await onBatchComplete?.()

        if (done.status === BulkJobStatus.Succeeded) {
          toast.success(done.resultSummary ?? `Created ${done.succeededItems} use cases`)
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
            ? err.message
            : err instanceof Error
              ? err.message
              : 'Failed to submit bulk create'
        setFormError(message)
      } finally {
        submittingRef.current = false
        setSubmitting(false)
      }
    },
    [onSubmitBulk, onBatchComplete, onClose, poller]
  )

  const runBulk = useCallback(async () => {
    if (validRows.length === 0) {
      setFormError('Add at least one row with key and name.')
      return
    }
    const items = buildItems()
    if (!items || items.length === 0) {
      setFormError('Fix validation errors before submitting.')
      return
    }
    await executeBulk(items)
  }, [validRows.length, buildItems, executeBulk])
  const jobRunning = poller.isPolling
  const locked = submitting || jobRunning

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk add use cases"
      size="2xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: submitting
            ? 'Submitting…'
            : jobRunning
              ? 'Running…'
              : `Create ${validRows.length}`,
          onClick: () => void runBulk(),
          variant: 'primary',
          disabled: locked || validRows.length === 0,
          loading: submitting,
        },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Create shells with key + name. Link Functions later via Function → Use Case. Paste
          Excel/TSV (Ctrl/Cmd+V) — columns: {COLUMNS.map((c) => c.label).join(' · ')}. Use JSON
          Import for full JSON payloads.
        </Typography>

        {pasteHint ? (
          <Typography variant="caption" tone="muted">
            Pasted — review, edit, or remove rows below.
          </Typography>
        ) : null}

        <BulkJobProgressPanel
          job={poller.job}
          percent={poller.percent}
          isPolling={poller.isPolling}
          error={poller.error}
          onRetryFailed={(failedItems) => {
            void executeBulk(failedItems as unknown as CreateUseCaseBody[])
          }}
          onRetry={() => void runBulk()}
        />

        <DataTable
          className="border border-neutral-200"
          tableClassName="min-w-[600px]"
          ariaLabel="Bulk add use cases"
          rows={rows}
          rowKey={(row) => row.id}
          rowClassName={(row) => cn(row.error && 'bg-red-50/60')}
          columns={[
            { id: 'index', header: '#', cell: (_row, index) => index + 1, width: '48px' },
            ...COLUMNS.map((col) => ({
              id: col.key,
              header: `${col.label}${'required' in col && col.required ? ' *' : ''}`,
              kind: col.key === 'key' ? ('code' as const) : undefined,
              cell: (row: DraftRow, index: number) => (
                <Input
                  value={row[col.key]}
                  onChange={(event) => updateRow(row.id, { [col.key]: event.target.value })}
                  placeholder={col.placeholder}
                  aria-label={`${col.label} row ${index + 1}`}
                  fullWidth
                  size="sm"
                  disabled={locked}
                />
              ),
            })),
            {
              id: 'remove',
              header: '',
              width: '48px',
              cell: (row, index) => (
                <button
                  type="button"
                  className="inline-flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-neutral-800"
                  onClick={() => removeRow(row.id)}
                  aria-label={`Remove row ${index + 1}`}
                  disabled={locked}
                >
                  <Trash2 size={14} />
                </button>
              ),
            },
          ]}
        />

        {rows.some((r) => r.error) ? (
          <ul className="space-y-1">
            {rows.map((r, i) =>
              r.error ? (
                <li key={r.id}>
                  <Typography variant="small" tone="error">
                    Row {i + 1}: {r.error}
                  </Typography>
                </li>
              ) : null
            )}
          </ul>
        ) : null}

        {formError ? (
          <Typography tone="error" variant="small">
            {formError}
          </Typography>
        ) : null}

        {jobId ? (
          <Typography variant="caption" tone="muted">
            Job {jobId}
          </Typography>
        ) : null}

        <Stack direction="horizontal" spacing="sm" className="flex-wrap">
          <Button size="sm" variant="secondary" onClick={addRow} disabled={locked}>
            <Plus size={14} className="mr-1 inline" />
            Add row
          </Button>
          <Typography variant="caption" tone="muted" className="self-center">
            {validRows.length} ready · max {BULK_MAX_ITEMS}
          </Typography>
        </Stack>
      </div>
    </Modal>
  )
}
