'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  Button,
  DataTable,
  Input,
  Modal,
  Stack,
  Typography,
} from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { BULK_MAX_ITEMS, type BulkJobResponse } from '@/shared/lib/bulkJobs'
import { useBackgroundJsonBulkImport } from '@/shared/lib/useBackgroundJsonBulkImport'
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
  const lastItemsRef = useRef<CreateUseCaseBody[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [pasteHint, setPasteHint] = useState(false)
  const { acceptAndFollow, setRetryHandlers, resultModal } = useBackgroundJsonBulkImport({
    entityLabel: 'Use case',
    onBatchComplete,
  })

  useEffect(() => {
    if (!open) return
    setRows([newRow()])
    setSubmitting(false)
    submittingRef.current = false
    setFormError(null)
    setPasteHint(false)
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

  const followBulkJob = useCallback(
    (items: CreateUseCaseBody[], job: BulkJobResponse) => {
      lastItemsRef.current = items
      setRetryHandlers({
        retryAll: async () => {
          if (!lastItemsRef.current.length) return
          const next = await onSubmitBulk(lastItemsRef.current)
          acceptAndFollow(next, () => undefined)
        },
        retryFailed: async (failedItems) => {
          const next = await onSubmitBulk(failedItems as unknown as BulkCreateUseCaseItem[])
          acceptAndFollow(next, () => undefined)
        },
      })
      acceptAndFollow(job, () => undefined)
      onClose()
    },
    [acceptAndFollow, onClose, onSubmitBulk, setRetryHandlers]
  )

  const runBulk = useCallback(async () => {
    if (submittingRef.current) return
    if (validRows.length === 0) {
      setFormError('Add at least one row with key and name.')
      return
    }
    const items = buildItems()
    if (!items || items.length === 0) {
      setFormError('Fix validation errors before submitting.')
      return
    }
    if (items.length > BULK_MAX_ITEMS) {
      setFormError(`Maximum ${BULK_MAX_ITEMS} items per bulk request.`)
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setFormError(null)

    try {
      const job = await onSubmitBulk(items)
      setSubmitting(false)
      submittingRef.current = false
      followBulkJob(items, job)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return
      const message =
        err instanceof ApiError
          ? err.problem.detail || err.message
          : err instanceof Error
            ? err.message
            : 'Failed to submit bulk create'
      setFormError(message)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }, [validRows.length, buildItems, onSubmitBulk, followBulkJob])

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk add use cases"
      size="2xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: submitting ? 'Submitting…' : `Create ${validRows.length}`,
          onClick: () => void runBulk(),
          variant: 'primary',
          disabled: submitting || validRows.length === 0,
          loading: submitting,
        },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Create shells with key + name. Link Functions later via Function → Use Case. Paste
          Excel/TSV (Ctrl/Cmd+V) — columns: {COLUMNS.map((c) => c.label).join(' · ')}. Use JSON
          Import for full JSON payloads. Failures open in a results dialog after submit.
        </Typography>

        {pasteHint ? (
          <Typography variant="caption" tone="muted">
            Pasted — review, edit, or remove rows below.
          </Typography>
        ) : null}

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
                  disabled={submitting}
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
                  disabled={submitting}
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

        <Stack direction="horizontal" spacing="sm" className="flex-wrap">
          <Button size="sm" variant="secondary" onClick={addRow} disabled={submitting}>
            <Plus size={14} className="mr-1 inline" />
            Add row
          </Button>
          <Typography variant="caption" tone="muted" className="self-center">
            {validRows.length} ready · max {BULK_MAX_ITEMS}
          </Typography>
        </Stack>
      </div>
    </Modal>
    {resultModal}
    </>
  )
}
