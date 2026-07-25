'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input, Modal, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
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
  const columns = QUALITY_BULK_COLUMNS[kind]
  const [rows, setRows] = useState<DraftRow[]>([newRow(kind)])
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pasteHint, setPasteHint] = useState(false)

  useEffect(() => {
    if (!open) return
    setRows([newRow(kind)])
    setFormError(null)
    setSubmitting(false)
    submittingRef.current = false
    setPasteHint(false)
  }, [open, kind])

  const validRows = useMemo(
    () => rows.filter((r) => isDraftRowValid(kind, r.values)),
    [rows, kind]
  )

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
    submittingRef.current = true
    setSubmitting(true)
    setFormError(null)

    const remaining: DraftRow[] = []
    let created = 0

    for (const row of rows) {
      if (isDraftRowBlank(kind, row.values)) continue
      if (!isDraftRowValid(kind, row.values)) {
        remaining.push({ ...row, error: 'Missing required fields' })
        continue
      }
      try {
        await onCreate(mapDraftToCreateInput(kind, row.values))
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

    setRows(remaining.length ? remaining : [newRow(kind)])
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
      title={QUALITY_BULK_TITLES[kind]}
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
          Add rows or paste from Excel (Ctrl/Cmd+V) — columns:{' '}
          {columns.map((c) => c.label).join(' · ')}.
        </Typography>
        {pasteHint ? (
          <Typography variant="caption" tone="muted">
            Pasted — review rows below.
          </Typography>
        ) : null}
        {formError ? (
          <Typography variant="small" tone="error">
            {formError}
          </Typography>
        ) : null}

        <div className="overflow-x-auto border border-neutral-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
                <th className="w-8 px-2 py-2">#</th>
                {columns.map((col) => (
                  <th key={col.key} className="px-2 py-2">
                    {col.label}
                    {col.required ? ' *' : ''}
                  </th>
                ))}
                <th className="w-10 px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-neutral-100 align-top',
                    row.error && 'bg-error/5'
                  )}
                >
                  <td className="px-2 py-2 text-xs text-neutral-400">{index + 1}</td>
                  {columns.map((col) => (
                    <td key={col.key} className="px-1 py-1">
                      <Input
                        fullWidth
                        value={row.values[col.key] ?? ''}
                        placeholder={col.placeholder}
                        onChange={(e) => updateCell(row.id, col.key, e.target.value)}
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      aria-label="Remove row"
                      onClick={() => removeRow(row.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

        <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={addRow}>
          Add row
        </Button>
      </div>
    </Modal>
  )
}
