'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, Plus, Trash2 } from 'lucide-react'
import {
  Button,
  DataTable,
  Input,
  Modal,
  Stack,
  Typography,
  type DataTableColumn,
} from '@/shared/ui'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import { cn } from '@/utils/cn'
import type { CreateProjectPhasePayload } from '../../domain/model/phase'

type ColumnKey =
  | 'code'
  | 'name'
  | 'description'
  | 'displayOrder'
  | 'plannedStartDate'
  | 'plannedEndDate'

interface ColumnDef {
  key: ColumnKey
  label: string
  required?: boolean
  placeholder?: string
  inputType?: 'text' | 'date' | 'number'
}

interface DraftRow {
  id: string
  code: string
  name: string
  description: string
  displayOrder: string
  plannedStartDate: string
  plannedEndDate: string
  error?: string | null
}

interface PhaseBulkAddModalProps {
  open: boolean
  nextDisplayOrder: number
  onClose: () => void
  /** Create one phase — should not refresh the list (batch refreshes once via onBatchComplete). */
  onCreate: (payload: CreateProjectPhasePayload) => Promise<void>
  /** Called once after the batch finishes if at least one phase was created. */
  onBatchComplete?: () => Promise<void> | void
}

const COLUMNS: ColumnDef[] = [
  { key: 'code', label: 'Code', required: true, placeholder: 'DISC' },
  { key: 'name', label: 'Name', required: true, placeholder: 'Discovery' },
  { key: 'description', label: 'Description', placeholder: 'Optional' },
  { key: 'displayOrder', label: 'Order', placeholder: 'Auto', inputType: 'number' },
  { key: 'plannedStartDate', label: 'Start', placeholder: 'YYYY-MM-DD', inputType: 'date' },
  { key: 'plannedEndDate', label: 'End', placeholder: 'YYYY-MM-DD', inputType: 'date' },
]

function newRow(): DraftRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    code: '',
    name: '',
    description: '',
    displayOrder: '',
    plannedStartDate: '',
    plannedEndDate: '',
    error: null,
  }
}

function looksLikeHeader(cells: string[]): boolean {
  const joined = cells.map((c) => c.trim().toLowerCase()).join('|')
  return COLUMNS.some((col) => {
    const label = col.label.toLowerCase()
    const key = col.key.toLowerCase()
    return joined.includes(label) || joined.includes(key)
  })
}

/** Normalize common Excel date paste forms to YYYY-MM-DD when possible. */
function normalizeDateInput(raw: string): string {
  const value = raw.trim()
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  // DD/MM/YYYY or MM/DD/YYYY — prefer ISO if unambiguous via Date parse fallback
  const slash = value.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})$/)
  if (slash) {
    const a = Number(slash[1])
    const b = Number(slash[2])
    const y = slash[3]
    // If first > 12 → DD/MM; if second > 12 → MM/DD; else assume DD/MM (common VN/EU)
    if (a > 12) {
      return `${y}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`
    }
    if (b > 12) {
      return `${y}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`
    }
    return `${y}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`
  }

  const t = Date.parse(value)
  if (!Number.isNaN(t)) {
    const d = new Date(t)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
  return value
}

function parseClipboardToRows(text: string): DraftRow[] {
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
      const cell = cells[idx] ?? ''
      if (col.inputType === 'date') {
        row[col.key] = normalizeDateInput(cell)
      } else {
        row[col.key] = cell
      }
    })
    if (
      row.code ||
      row.name ||
      row.description ||
      row.displayOrder ||
      row.plannedStartDate ||
      row.plannedEndDate
    ) {
      rows.push(row)
    }
  }
  return rows
}

function isBlank(row: DraftRow): boolean {
  return (
    !row.code.trim() &&
    !row.name.trim() &&
    !row.description.trim() &&
    !row.displayOrder.trim() &&
    !row.plannedStartDate.trim() &&
    !row.plannedEndDate.trim()
  )
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const t = Date.parse(value)
  return !Number.isNaN(t)
}

/** Text field (paste-friendly) + calendar button for native date picker. */
function DatePasteableInput({
  value,
  onChange,
  ariaLabel,
  placeholder,
}: {
  value: string
  onChange: (next: string) => void
  ariaLabel: string
  placeholder?: string
}) {
  const pickerRef = useRef<HTMLInputElement>(null)
  const isoValue = isValidIsoDate(value) ? value : ''

  const openPicker = () => {
    const el = pickerRef.current
    if (!el) return
    if (typeof el.showPicker === 'function') {
      try {
        el.showPicker()
        return
      } catch {
        // fall through to click
      }
    }
    el.click()
  }

  return (
    <div className="flex min-w-[9.5rem] items-center gap-1">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => {
          const normalized = normalizeDateInput(value)
          if (normalized !== value) onChange(normalized)
        }}
        onPaste={(e) => {
          const text = e.clipboardData.getData('text/plain')
          // Multi-cell paste is handled at document level for bulk rows.
          if (!text || text.includes('\n') || text.includes('\t')) return
          e.preventDefault()
          onChange(normalizeDateInput(text))
        }}
        placeholder={placeholder ?? 'YYYY-MM-DD'}
        aria-label={ariaLabel}
        fullWidth
        size="sm"
      />
      <button
        type="button"
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-neutral-500 hover:text-neutral-800"
        onClick={openPicker}
        aria-label={`${ariaLabel} calendar`}
        title="Pick date"
      >
        <Calendar size={14} />
      </button>
      <input
        ref={pickerRef}
        type="date"
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        tabIndex={-1}
        value={isoValue}
        onChange={(e) => onChange(e.target.value)}
        aria-hidden
      />
    </div>
  )
}

export function PhaseBulkAddModal({
  open,
  nextDisplayOrder,
  onClose,
  onCreate,
  onBatchComplete,
}: PhaseBulkAddModalProps) {
  const [rows, setRows] = useState<DraftRow[]>([newRow()])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pasteHint, setPasteHint] = useState(false)

  useEffect(() => {
    if (!open) return
    setRows([newRow()])
    setFormError(null)
    setSubmitting(false)
    setPasteHint(false)
  }, [open])

  const validRows = useMemo(() => rows.filter((r) => r.code.trim() && r.name.trim()), [rows])

  const updateRow = (id: string, patch: Partial<DraftRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, error: null } : r)))
  }

  const addRow = () => setRows((prev) => [...prev, newRow()])

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? [newRow()] : prev.filter((r) => r.id !== id)))
  }

  const applyPaste = useCallback((text: string) => {
    const pasted = parseClipboardToRows(text)
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
    if (validRows.length === 0) {
      setFormError('Add at least one row with code and name.')
      return
    }

    setSubmitting(true)
    setFormError(null)

    const usedOrders = new Set<number>()
    let autoOrder = nextDisplayOrder
    const remaining: DraftRow[] = []
    let created = 0

    for (const row of rows) {
      if (isBlank(row)) continue
      if (!row.code.trim() || !row.name.trim()) {
        remaining.push({ ...row, error: 'Code and name are required' })
        continue
      }

      let order: number
      const rawOrder = row.displayOrder.trim()
      if (rawOrder) {
        order = Number.parseInt(rawOrder, 10)
        if (!Number.isFinite(order) || order < 1) {
          remaining.push({ ...row, error: 'Order must be a positive number' })
          continue
        }
      } else {
        while (usedOrders.has(autoOrder)) autoOrder += 1
        order = autoOrder
        autoOrder += 1
      }

      if (usedOrders.has(order)) {
        remaining.push({ ...row, error: `Order ${order} already used in this batch` })
        continue
      }
      usedOrders.add(order)

      const start = row.plannedStartDate.trim()
      const end = row.plannedEndDate.trim()
      if (start && !isValidIsoDate(start)) {
        remaining.push({ ...row, error: 'Start must be a valid date (YYYY-MM-DD)' })
        continue
      }
      if (end && !isValidIsoDate(end)) {
        remaining.push({ ...row, error: 'End must be a valid date (YYYY-MM-DD)' })
        continue
      }
      if (start && end && end < start) {
        remaining.push({ ...row, error: 'End must be on or after start' })
        continue
      }

      try {
        await onCreate({
          code: row.code.trim().toUpperCase(),
          name: row.name.trim(),
          description: row.description.trim() || null,
          displayOrder: order,
          plannedStartDate: start || null,
          plannedEndDate: end || null,
        })
        created += 1
      } catch (err: unknown) {
        const message =
          err instanceof ApiError && err.status === 409
            ? 'Code or order already exists'
            : err instanceof Error
              ? err.message
              : 'Failed'
        remaining.push({ ...row, error: message })
      }
    }

    if (created > 0) {
      await onBatchComplete?.()
    }

    setSubmitting(false)

    if (remaining.length === 0) {
      toast.success(created === 1 ? 'Phase created' : `${created} phases created`)
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
      title="Add phases"
      size="2xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
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
          Add one or more phases. Paste from Excel (Ctrl/Cmd+V) — columns: Code · Name · Description
          · Order · Start · End. Dates accept paste or the calendar icon. Empty order auto-fills
          from {nextDisplayOrder}.
        </Typography>

        {pasteHint ? (
          <Typography variant="caption" tone="muted">
            Pasted — review, edit, or remove rows below.
          </Typography>
        ) : null}

        <div className="border border-neutral-200">
          <DataTable
            ariaLabel="Phases to create"
            rows={rows}
            rowKey={(row) => row.id}
            tableClassName="min-w-[760px]"
            compact
            rowClassName={(row) => cn(row.error && 'bg-red-50/60')}
            columns={[
              { id: 'index', header: '#', width: '2rem', cell: (_row, index) => index + 1 },
              ...COLUMNS.map(
                (column): DataTableColumn<DraftRow> => ({
                  id: column.key,
                  header: `${column.label}${column.required ? ' *' : ''}`,
                  kind: column.key === 'code' ? 'code' : 'text',
                  cell: (row, index) =>
                    column.inputType === 'date' ? (
                      <DatePasteableInput
                        value={row[column.key]}
                        onChange={(next) => updateRow(row.id, { [column.key]: next })}
                        ariaLabel={`${column.label} row ${index + 1}`}
                        placeholder={column.placeholder}
                      />
                    ) : (
                      <Input
                        type={column.inputType === 'number' ? 'number' : 'text'}
                        value={row[column.key]}
                        onChange={(event) =>
                          updateRow(row.id, {
                            [column.key]:
                              column.key === 'code'
                                ? event.target.value.toUpperCase()
                                : event.target.value,
                          })
                        }
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
          <Button size="sm" variant="secondary" onClick={addRow} disabled={submitting}>
            <Plus size={14} className="mr-1 inline" />
            Add row
          </Button>
          <Typography variant="caption" tone="muted" className="self-center">
            Tip: copy cells from Excel then paste in this dialog
          </Typography>
        </Stack>
      </div>
    </Modal>
  )
}
