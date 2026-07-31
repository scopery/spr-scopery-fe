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
  type DataTableColumn,
} from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { cn } from '@/utils/cn'
import type { CreateRequirementPayload } from '../model/requirements'

interface ColumnDef {
  key: 'code' | 'title' | 'requirementType' | 'priority' | 'description'
  label: string
  required?: boolean
  placeholder?: string
}

interface DraftRow {
  id: string
  code: string
  title: string
  requirementType: string
  priority: string
  description: string
  error?: string | null
}

const COLUMNS: ColumnDef[] = [
  { key: 'code', label: 'Code', placeholder: 'REQ-AUTH-01' },
  { key: 'title', label: 'Title', required: true, placeholder: 'User login' },
  { key: 'requirementType', label: 'Type', placeholder: 'FUNCTIONAL' },
  { key: 'priority', label: 'Priority', placeholder: 'MEDIUM' },
  { key: 'description', label: 'Description', placeholder: 'Optional' },
]

const VALID_TYPES = new Set(['FUNCTIONAL', 'NON_FUNCTIONAL', 'BUSINESS', 'TECHNICAL', 'CONSTRAINT'])

const VALID_PRIORITIES = new Set(['HIGH', 'MEDIUM', 'LOW'])

interface RequirementBulkAddModalProps {
  open: boolean
  onClose: () => void
  /** Create one item — prefer no list refresh; batch refreshes via onBatchComplete. */
  onCreate: (body: CreateRequirementPayload) => Promise<void>
  onBatchComplete?: () => Promise<void> | void
}

function newRow(): DraftRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    code: '',
    title: '',
    requirementType: 'FUNCTIONAL',
    priority: 'MEDIUM',
    description: '',
    error: null,
  }
}

function isBlank(row: DraftRow) {
  return (
    !row.code.trim() &&
    !row.title.trim() &&
    !row.description.trim() &&
    (!row.requirementType.trim() || row.requirementType === 'FUNCTIONAL') &&
    (!row.priority.trim() || row.priority === 'MEDIUM')
  )
}

function looksLikeHeader(cells: string[]): boolean {
  const joined = cells.map((c) => c.trim().toLowerCase()).join('|')
  return COLUMNS.some((col) => {
    const label = col.label.toLowerCase()
    const key = col.key.toLowerCase()
    return joined.includes(label) || joined.includes(key)
  })
}

function normalizeType(raw: string): string {
  const v = raw.trim().toUpperCase().replace(/\s+/g, '_')
  if (!v) return 'FUNCTIONAL'
  if (v === 'FR' || v === 'FUNC') return 'FUNCTIONAL'
  if (v === 'NFR' || v === 'NON-FUNCTIONAL' || v === 'NONFUNCTIONAL') return 'NON_FUNCTIONAL'
  if (VALID_TYPES.has(v)) return v
  return v
}

function normalizePriority(raw: string): string {
  const v = raw.trim().toUpperCase()
  if (!v) return 'MEDIUM'
  if (v === 'P1' || v === 'H') return 'HIGH'
  if (v === 'P2' || v === 'M') return 'MEDIUM'
  if (v === 'P3' || v === 'L') return 'LOW'
  if (VALID_PRIORITIES.has(v)) return v
  return v
}

function autoCode(title: string, type: string) {
  const prefix =
    type === 'NON_FUNCTIONAL'
      ? 'NFR'
      : type === 'BUSINESS'
        ? 'BUS'
        : type === 'TECHNICAL'
          ? 'TEC'
          : type === 'CONSTRAINT'
            ? 'CON'
            : 'REQ'
  const slug = title
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 16)
  return `${prefix}-${slug || 'NEW'}`
}

/** Parse Excel / Sheets TSV (or CSV) clipboard into draft rows. */
export function parseRequirementClipboardToRows(text: string): DraftRow[] {
  const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
  if (!raw) return []

  const lines = raw.split('\n').filter((line) => line.trim().length > 0)
  if (lines.length === 0) return []

  const delim = lines[0].includes('\t') ? '\t' : ','
  const parsed = lines.map((line) => line.split(delim).map((c) => c.trim()))

  let start = 0
  if (parsed[0] && looksLikeHeader(parsed[0])) start = 1

  const rows: DraftRow[] = []
  for (let i = start; i < parsed.length; i++) {
    const cells = parsed[i] ?? []
    const row = newRow()
    COLUMNS.forEach((col, idx) => {
      const value = cells[idx] ?? ''
      row[col.key] = value
    })
    row.requirementType = normalizeType(row.requirementType)
    row.priority = normalizePriority(row.priority)
    if (row.code.trim() || row.title.trim() || row.description.trim()) rows.push(row)
  }
  return rows
}

function mapRowToPayload(row: DraftRow): CreateRequirementPayload {
  const title = row.title.trim()
  const type = normalizeType(row.requirementType)
  const priority = normalizePriority(row.priority)
  return {
    title,
    code: row.code.trim() || autoCode(title, type),
    description: row.description.trim() || null,
    requirementType: VALID_TYPES.has(type) ? type : 'FUNCTIONAL',
    priority: VALID_PRIORITIES.has(priority) ? priority : 'MEDIUM',
  }
}

export function RequirementBulkAddModal({
  open,
  onClose,
  onCreate,
  onBatchComplete,
}: RequirementBulkAddModalProps) {
  const [rows, setRows] = useState<DraftRow[]>([newRow()])
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pasteHint, setPasteHint] = useState(false)

  useEffect(() => {
    if (!open) return
    setRows([newRow()])
    setFormError(null)
    setSubmitting(false)
    submittingRef.current = false
    setPasteHint(false)
  }, [open])

  const validRows = useMemo(() => rows.filter((r) => r.title.trim()), [rows])

  const updateRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, error: null } : r)))
  }

  const addRow = () => setRows((prev) => [...prev, newRow()])

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? [newRow()] : prev.filter((r) => r.id !== id)))
  }

  const applyPaste = useCallback((text: string) => {
    const pasted = parseRequirementClipboardToRows(text)
    if (pasted.length === 0) return
    setRows((prev) => {
      const onlyBlank = prev.length === 1 && isBlank(prev[0])
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

  const handleSubmit = async () => {
    if (submittingRef.current) return
    if (validRows.length === 0) {
      setFormError('Add at least one row with a title.')
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    setFormError(null)

    const remaining: DraftRow[] = []
    let created = 0

    for (const row of rows) {
      if (isBlank(row)) continue
      if (!row.title.trim()) {
        remaining.push({ ...row, error: 'Title is required' })
        continue
      }

      const type = normalizeType(row.requirementType)
      const priority = normalizePriority(row.priority)
      if (row.requirementType.trim() && !VALID_TYPES.has(type)) {
        remaining.push({
          ...row,
          error: 'Type must be FUNCTIONAL, NON_FUNCTIONAL, BUSINESS, TECHNICAL, or CONSTRAINT',
        })
        continue
      }
      if (row.priority.trim() && !VALID_PRIORITIES.has(priority)) {
        remaining.push({ ...row, error: 'Priority must be HIGH, MEDIUM, or LOW' })
        continue
      }

      try {
        await onCreate(mapRowToPayload(row))
        created += 1
      } catch (err: unknown) {
        const message =
          err instanceof ApiError && err.status === 409
            ? 'Already exists or conflict'
            : err instanceof Error
              ? err.message
              : 'Failed'
        remaining.push({ ...row, error: message })
      }
    }

    if (created > 0) await onBatchComplete?.()

    submittingRef.current = false
    setSubmitting(false)

    if (remaining.length === 0) {
      onClose()
      return
    }

    setRows(remaining.length ? remaining : [newRow()])
    setFormError(
      created
        ? `Created ${created}. Review ${remaining.length} remaining row${remaining.length === 1 ? '' : 's'}.`
        : `Could not create. Fix ${remaining.length} row${remaining.length === 1 ? '' : 's'}.`
    )
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Bulk add requirements"
      size="2xl"
      actions={[
        { label: 'Close', onClick: onClose, variant: 'ghost' },
        {
          label: submitting ? 'Creating…' : `Create ${validRows.length}`,
          onClick: () => void handleSubmit(),
          variant: 'primary',
          disabled: submitting || validRows.length === 0,
          loading: submitting,
        },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Add rows or paste from Excel (Ctrl/Cmd+V) — columns:{' '}
          {COLUMNS.map((c) => c.label).join(' · ')}. Leave Code blank to auto-generate.
        </Typography>

        {pasteHint ? (
          <Typography variant="small" tone="muted">
            Pasted — review, edit, or remove rows below.
          </Typography>
        ) : null}

        <div className="border border-neutral-200">
          <DataTable
            ariaLabel="Requirements to create"
            rows={rows}
            rowKey={(row) => row.id}
            tableClassName="min-w-[720px]"
            compact
            rowClassName={(row) => cn(row.error && 'bg-error/5')}
            columns={[
              { id: 'index', header: '#', width: '2rem', cell: (_row, index) => index + 1 },
              ...COLUMNS.map(
                (column): DataTableColumn<DraftRow> => ({
                  id: column.key,
                  header: `${column.label}${column.required ? ' *' : ''}`,
                  kind: column.key === 'code' ? 'code' : 'text',
                  cell: (row, index) => (
                    <Input
                      value={row[column.key]}
                      onChange={(event) => updateRow(row.id, { [column.key]: event.target.value })}
                      placeholder={column.placeholder}
                      aria-label={`${column.label} row ${index + 1}`}
                      fullWidth
                      size="sm"
                    />
                  ),
                })
              ),
              {
                id: 'remove',
                header: '',
                width: '2.5rem',
                cell: (row, index) => (
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-neutral-800"
                    onClick={() => removeRow(row.id)}
                    aria-label={`Remove row ${index + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                ),
              },
            ]}
          />
        </div>

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
          <Button size="sm" variant="neutral-flat" onClick={addRow} disabled={submitting}>
            <Plus size={14} className="mr-1 inline" />
            Add row
          </Button>
          <Typography variant="small" tone="muted" className="self-center">
            Tip: copy cells from Excel then paste in this dialog
          </Typography>
        </Stack>
      </div>
    </Modal>
  )
}
