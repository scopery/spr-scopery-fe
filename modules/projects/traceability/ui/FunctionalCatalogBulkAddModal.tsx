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
import {
  FunctionalItemPriority,
  FunctionalItemType,
  NonFunctionalCategory,
  NonFunctionalScopeType,
  type CreateBusinessRuleBody,
} from '../model/functional-catalog'

export type FunctionalCatalogAddKind = 'FR' | 'NFR'

type FieldKey = 'code' | 'title' | 'priority' | 'type' | 'category' | 'scopeType' | 'description'

interface ColumnDef {
  key: FieldKey
  label: string
  required?: boolean
  placeholder?: string
}

export interface FunctionalCatalogBulkCreateInput {
  kind: FunctionalCatalogAddKind
  code: string
  title: string
  priority: string
  type?: string
  category?: string
  scopeType?: string
  description?: string
  acceptanceCriteria?: string[]
  businessRules?: CreateBusinessRuleBody[]
  targetMetric?: string
}

interface DraftRow {
  id: string
  code: string
  title: string
  priority: string
  type: string
  category: string
  scopeType: string
  description: string
  acceptanceCriteria: string[]
  error?: string | null
}

interface FunctionalCatalogBulkAddModalProps {
  open: boolean
  kind: FunctionalCatalogAddKind
  onClose: () => void
  onSubmitBulk: (items: FunctionalCatalogBulkCreateInput[]) => Promise<BulkJobResponse>
  onBatchComplete?: () => Promise<void> | void
}

const COLUMNS_BY_KIND: Record<FunctionalCatalogAddKind, ColumnDef[]> = {
  FR: [
    { key: 'code', label: 'Code', required: true, placeholder: 'FR-001' },
    { key: 'title', label: 'Title', required: true, placeholder: 'Login' },
    { key: 'priority', label: 'Priority', placeholder: 'MEDIUM' },
    { key: 'type', label: 'Type', placeholder: 'FUNCTIONAL' },
    { key: 'description', label: 'Description', placeholder: 'Optional' },
  ],
  NFR: [
    { key: 'code', label: 'Code', required: true, placeholder: 'NFR-001' },
    { key: 'title', label: 'Title', required: true, placeholder: 'p95 < 200ms' },
    { key: 'category', label: 'Category', placeholder: 'PERFORMANCE' },
    { key: 'priority', label: 'Priority', placeholder: 'MEDIUM' },
    { key: 'scopeType', label: 'Scope', placeholder: 'SYSTEM' },
    { key: 'description', label: 'Description', placeholder: 'Optional' },
  ],
}

function newRow(_kind: FunctionalCatalogAddKind): DraftRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    code: '',
    title: '',
    priority: FunctionalItemPriority.Medium,
    type: FunctionalItemType.Functional,
    category: NonFunctionalCategory.Other,
    scopeType: NonFunctionalScopeType.System,
    description: '',
    acceptanceCriteria: [],
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

function normalizeEnum(value: string, allowed: readonly string[], fallback: string): string {
  const v = value.trim().toUpperCase().replace(/\s+/g, '_')
  if (!v) return fallback
  return (allowed as string[]).includes(v) ? v : fallback
}

function parseClipboardToRows(
  text: string,
  columns: ColumnDef[],
  kind: FunctionalCatalogAddKind
): DraftRow[] {
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
      const value = cells[idx] ?? ''
      row[col.key] = value
    })
    if (row.code || row.title || row.description) rows.push(row)
  }
  return rows
}

function isRowBlank(row: DraftRow, columns: ColumnDef[]): boolean {
  return columns.every((c) => !row[c.key].trim())
}

function mapRowToInput(row: DraftRow, kind: FunctionalCatalogAddKind): FunctionalCatalogBulkCreateInput {
  const priority = normalizeEnum(
    row.priority,
    Object.values(FunctionalItemPriority),
    FunctionalItemPriority.Medium
  )
  if (kind === 'FR') {
    return {
      kind,
      code: row.code.trim(),
      title: row.title.trim(),
      priority,
      type: normalizeEnum(row.type, Object.values(FunctionalItemType), FunctionalItemType.Functional),
      description: row.description.trim() || undefined,
      acceptanceCriteria: row.acceptanceCriteria.length ? row.acceptanceCriteria : undefined,
    }
  }
  return {
    kind,
    code: row.code.trim(),
    title: row.title.trim(),
    priority,
    category: normalizeEnum(
      row.category,
      Object.values(NonFunctionalCategory),
      NonFunctionalCategory.Other
    ),
    scopeType: normalizeEnum(
      row.scopeType,
      Object.values(NonFunctionalScopeType),
      NonFunctionalScopeType.System
    ),
    description: row.description.trim() || undefined,
  }
}

export function FunctionalCatalogBulkAddModal({
  open,
  kind,
  onClose,
  onSubmitBulk,
  onBatchComplete,
}: FunctionalCatalogBulkAddModalProps) {
  const columns = COLUMNS_BY_KIND[kind]
  const [rows, setRows] = useState<DraftRow[]>([newRow(kind)])
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const lastItemsRef = useRef<FunctionalCatalogBulkCreateInput[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [pasteHint, setPasteHint] = useState(false)
  const { acceptAndFollow, setRetryHandlers, resultModal } = useBackgroundJsonBulkImport({
    entityLabel: kind === 'FR' ? 'Functional item' : 'Non-functional item',
    onBatchComplete,
  })

  useEffect(() => {
    if (!open) return
    setRows([newRow(kind)])
    setFormError(null)
    setSubmitting(false)
    submittingRef.current = false
    setPasteHint(false)
  }, [open, kind])

  const validRows = useMemo(
    () => rows.filter((r) => r.code.trim() && r.title.trim()),
    [rows]
  )

  const updateRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, error: null } : r)))
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
      const pasted = parseClipboardToRows(text, columns, kind)
      if (pasted.length === 0) return
      setRows((prev) => {
        const onlyBlank = prev.length === 1 && isRowBlank(prev[0], columns)
        return onlyBlank ? pasted : [...prev, ...pasted]
      })
      setPasteHint(true)
      setFormError(null)
    },
    [columns, kind]
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

  const buildItems = useCallback((): FunctionalCatalogBulkCreateInput[] | null => {
    const items: FunctionalCatalogBulkCreateInput[] = []
    const nextRows = rows.map((row) => {
      if (isRowBlank(row, columns)) return row
      if (!row.code.trim() || !row.title.trim()) {
        return { ...row, error: 'Code and title are required' }
      }
      items.push(mapRowToInput(row, kind))
      return { ...row, error: null }
    })
    if (nextRows.some((r) => r.error)) {
      setRows(nextRows)
      return null
    }
    return items
  }, [rows, columns, kind])

  const followBulkJob = useCallback(
    (items: FunctionalCatalogBulkCreateInput[], job: BulkJobResponse) => {
      lastItemsRef.current = items
      setRetryHandlers({
        retryAll: async () => {
          if (!lastItemsRef.current.length) return
          const next = await onSubmitBulk(lastItemsRef.current)
          acceptAndFollow(next, () => undefined)
        },
        retryFailed: async (failedItems) => {
          const next = await onSubmitBulk(
            failedItems as unknown as FunctionalCatalogBulkCreateInput[]
          )
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
      setFormError('Add at least one row with code and title.')
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

  const title = kind === 'FR' ? 'Add functional items' : 'Add non-functional items'

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
      title={title}
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
          Add one or more rows. Paste Excel/TSV (Ctrl/Cmd+V). Use JSON Import for JSON payloads — columns:{' '}
          {columns.map((c) => c.label).join(' · ')}. Empty priority/type/category use defaults.
          Failures open in a results dialog after submit.
        </Typography>

        {pasteHint ? (
          <Typography variant="caption" tone="muted">
            Pasted — review, edit, or remove rows below.
          </Typography>
        ) : null}

        <DataTable
          className="border border-neutral-200"
          tableClassName="min-w-[640px]"
          ariaLabel={title}
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
