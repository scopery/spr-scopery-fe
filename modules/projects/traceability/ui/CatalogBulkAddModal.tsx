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
import type { ArchitectureNodeType } from '../model/architecture-workbench'

export type CatalogAddKind = ArchitectureNodeType

interface ColumnDef {
  key: 'code' | 'name' | 'extra'
  label: string
  required?: boolean
  placeholder?: string
}

interface DraftRow {
  id: string
  code: string
  name: string
  extra: string
  error?: string | null
}

export interface CatalogBulkCreateInput {
  code: string
  name: string
  extra?: string
}

interface CatalogBulkAddModalProps {
  open: boolean
  kind: CatalogAddKind
  title: string
  onClose: () => void
  onSubmitBulk: (items: CatalogBulkCreateInput[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}

const COLUMNS_BY_KIND: Record<CatalogAddKind, ColumnDef[]> = {
  MODULE: [
    { key: 'code', label: 'Code', required: true, placeholder: 'CART' },
    { key: 'name', label: 'Name', required: true, placeholder: 'Cart' },
    { key: 'extra', label: 'Description', placeholder: 'Optional' },
  ],
  SCREEN: [
    { key: 'code', label: 'Code', required: true, placeholder: 'CART_VIEW' },
    { key: 'name', label: 'Name', required: true, placeholder: 'Cart' },
    { key: 'extra', label: 'Route path', placeholder: '/cart' },
  ],
  API_ENDPOINT: [
    { key: 'code', label: 'Method', required: true, placeholder: 'GET' },
    { key: 'name', label: 'Path pattern', required: true, placeholder: '/carts/{id}' },
    { key: 'extra', label: 'Name', placeholder: 'Optional' },
  ],
  COMPONENT: [
    { key: 'code', label: 'Code', required: true, placeholder: 'BTN_PRIMARY' },
    { key: 'name', label: 'Name', required: true, placeholder: 'Primary button' },
    { key: 'extra', label: 'Component type', placeholder: 'Optional' },
  ],
  DATA_ENTITY: [
    { key: 'code', label: 'Code', required: true, placeholder: 'CART_ITEM' },
    { key: 'name', label: 'Name', required: true, placeholder: 'Cart item' },
    { key: 'extra', label: 'Table name', placeholder: 'cart_items' },
  ],
}

function newRow(): DraftRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    code: '',
    name: '',
    extra: '',
    error: null,
  }
}

function looksLikeHeader(cells: string[], columns: ColumnDef[]): boolean {
  const joined = cells.map((c) => c.trim().toLowerCase()).join('|')
  return columns.some((col) => {
    const label = col.label.toLowerCase()
    const key = col.key.toLowerCase()
    return joined.includes(label) || joined.includes(key)
  })
}

/** Parse Excel / Sheets TSV (or CSV) clipboard into draft rows. */
export function parseClipboardToRows(text: string, columns: ColumnDef[]): DraftRow[] {
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
    const row = newRow()
    columns.forEach((col, idx) => {
      const value = cells[idx] ?? ''
      row[col.key] = value
    })
    if (row.code || row.name || row.extra) rows.push(row)
  }
  return rows
}

export function CatalogBulkAddModal({
  open,
  kind,
  title,
  onClose,
  onSubmitBulk,
  onBatchComplete,
}: CatalogBulkAddModalProps) {
  const columns = COLUMNS_BY_KIND[kind]
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
    setFormError(null)
    setSubmitting(false)
    submittingRef.current = false
    setPasteHint(false)
    setJobId(null)
    poller.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when modal opens
  }, [open, kind])

  const validRows = useMemo(
    () =>
      rows.filter((r) => {
        const needCode = columns.some((c) => c.key === 'code' && c.required)
        const needName = columns.some((c) => c.key === 'name' && c.required)
        if (needCode && !r.code.trim()) return false
        if (needName && !r.name.trim()) return false
        return Boolean(r.code.trim() || r.name.trim())
      }),
    [rows, columns]
  )

  const updateRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, error: null } : r)))
  }

  const addRow = () => setRows((prev) => [...prev, newRow()])

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? [newRow()] : prev.filter((r) => r.id !== id)))
  }

  const applyPaste = useCallback(
    (text: string) => {
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        setFormError('Use JSON Import for JSON payloads. Bulk add accepts Excel/TSV only.')
        return
      }
      const pasted = parseClipboardToRows(text, columns)
      if (pasted.length === 0) return
      setRows((prev) => {
        const onlyBlank = prev.length === 1 && !prev[0].code && !prev[0].name && !prev[0].extra
        return onlyBlank ? pasted : [...prev, ...pasted]
      })
      setPasteHint(true)
      setFormError(null)
    },
    [columns]
  )

  useEffect(() => {
    if (!open) return
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null
      const text = e.clipboardData?.getData('text/plain') ?? ''
      const multi = text.includes('\n') || (text.includes('\t') && text.trim().length > 0)
      if (!multi) return
      if (target?.closest('input, textarea') && !text.includes('\n') && !text.includes('\t')) {
        return
      }
      e.preventDefault()
      applyPaste(text)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [open, applyPaste])

  const buildItems = useCallback((): CatalogBulkCreateInput[] | null => {
    const items: CatalogBulkCreateInput[] = []
    const nextRows = rows.map((row) => {
      const code = row.code.trim()
      const name = row.name.trim()
      const extra = row.extra.trim()
      const isBlank = !code && !name && !extra
      if (isBlank) return row

      const missingRequired = columns.some((c) => {
        if (!c.required) return false
        return !row[c.key].trim()
      })
      if (missingRequired) {
        return { ...row, error: 'Missing required fields' }
      }

      items.push({
        code,
        name,
        extra: extra || undefined,
      })
      return { ...row, error: null }
    })
    if (nextRows.some((r) => r.error)) {
      setRows(nextRows)
      return null
    }
    return items
  }, [rows, columns])

  const runBulk = useCallback(async () => {
    if (submittingRef.current) return
    if (validRows.length === 0) {
      setFormError('Add at least one row with required fields.')
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
    poller.reset()

    try {
      const job = await onSubmitBulk(items)
      setJobId(job.id)
      setSubmitting(false)
      submittingRef.current = false
      toast.message('Job accepted', { description: 'Processing in the background…' })
      onClose()
      const done = await poller.start(job.id, job)
      if (done.succeededItems > 0) await onBatchComplete?.()

      if (done.status === BulkJobStatus.Succeeded) {
        toast.success(done.resultSummary ?? `Created ${done.succeededItems} items`)
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
  }, [validRows.length, buildItems, onSubmitBulk, onBatchComplete, onClose, poller])

  const jobRunning = poller.isPolling
  const busy = submitting || jobRunning

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="2xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: submitting ? 'Submitting…' : jobRunning ? 'Running…' : `Create ${validRows.length}`,
          onClick: () => void runBulk(),
          variant: 'primary',
          disabled: busy || validRows.length === 0,
          loading: submitting,
        },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Add one or more rows. Paste Excel/TSV (Ctrl/Cmd+V). Use JSON Import for JSON payloads — columns:{' '}
          {columns.map((c) => c.label).join(' · ')}. Review before create.
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
            setJobId(null)
            poller.reset()
            void (async () => {
              try {
                const job = await onSubmitBulk(failedItems as unknown as Parameters<typeof onSubmitBulk>[0])
                setJobId(job.id)
                setSubmitting(false)
                toast.message('Job accepted', { description: 'Processing in the background…' })
                const done = await poller.start(job.id, job)
                if (done.succeededItems > 0) await onBatchComplete?.()
              } catch {
                /* interceptor / form handles */
              }
            })()
          }}
          onRetry={() => {
            setJobId(null)
            poller.reset()
            void runBulk()
          }}
        />

        <DataTable
          className="border border-neutral-200"
          tableClassName="min-w-[520px]"
          ariaLabel={`Bulk add ${title}`}
          rows={rows}
          rowKey={(row) => row.id}
          rowClassName={(row) => cn(row.error && 'bg-red-50/60')}
          columns={[
            { id: 'index', header: '#', cell: (_row, index) => index + 1, width: '48px' },
            ...columns.map((col) => ({
              id: col.key,
              header: `${col.label}${col.required ? ' *' : ''}`,
              kind: col.key === 'code' ? ('code' as const) : undefined,
              cell: (row: DraftRow, index: number) => (
                <Input
                  value={row[col.key]}
                  onChange={(event) => updateRow(row.id, { [col.key]: event.target.value })}
                  placeholder={col.placeholder}
                  aria-label={`${col.label} row ${index + 1}`}
                  fullWidth
                  size="sm"
                  disabled={busy}
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
                  disabled={busy}
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
          <Button size="sm" variant="secondary" onClick={addRow} disabled={busy}>
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
