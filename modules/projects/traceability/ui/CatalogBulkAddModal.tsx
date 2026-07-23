'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, Input, Modal, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
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

interface CatalogBulkAddModalProps {
  open: boolean
  kind: CatalogAddKind
  title: string
  onClose: () => void
  /** Create one item — prefer no list refresh; batch refreshes via onBatchComplete. */
  onCreate: (input: {
    kind: CatalogAddKind
    code: string
    name: string
    extra?: string
  }) => Promise<void>
  /** Called once after the batch finishes if at least one item was created. */
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
export function parseClipboardToRows(
  text: string,
  columns: ColumnDef[]
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
  onCreate,
  onBatchComplete,
}: CatalogBulkAddModalProps) {
  const columns = COLUMNS_BY_KIND[kind]
  const [rows, setRows] = useState<DraftRow[]>([newRow()])
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pasteHint, setPasteHint] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setRows([newRow()])
    setFormError(null)
    setSubmitting(false)
    submittingRef.current = false
    setPasteHint(false)
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
      const pasted = parseClipboardToRows(text, columns)
      if (pasted.length === 0) return
      setRows((prev) => {
        const onlyBlank =
          prev.length === 1 && !prev[0].code && !prev[0].name && !prev[0].extra
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
      // Allow normal paste into a focused input (single cell). Only intercept
      // when pasting multi-line / multi-column spreadsheet data.
      const text = e.clipboardData?.getData('text/plain') ?? ''
      const multi =
        text.includes('\n') || (text.includes('\t') && text.trim().length > 0)
      if (!multi) return
      // If user is in an input and paste is single-cell-ish, skip — handled above.
      if (target?.closest('input, textarea') && !text.includes('\n') && !text.includes('\t')) {
        return
      }
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
      const code = row.code.trim()
      const name = row.name.trim()
      const extra = row.extra.trim()
      const isBlank = !code && !name && !extra
      if (isBlank) continue

      const missingRequired = columns.some((c) => {
        if (!c.required) return false
        return !row[c.key].trim()
      })
      if (missingRequired) {
        remaining.push({ ...row, error: 'Missing required fields' })
        continue
      }

      try {
        await onCreate({
          kind,
          code,
          name,
          extra: extra || undefined,
        })
        created += 1
      } catch (err: unknown) {
        const message =
          err instanceof ApiError && err.status === 409
            ? err.problem.code === 'RESOURCE_CONFLICT'
              ? err.message || 'Conflict — reload and retry, or use a different code'
              : 'Already exists'
            : err instanceof Error
              ? err.message
              : 'Failed'
        remaining.push({ ...row, error: message })
      }
    }

    if (created > 0) {
      await onBatchComplete?.()
    }

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
      title={title}
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
      <div ref={bodyRef} className="space-y-4">
        <Typography variant="small" tone="muted">
          Add one or more rows. Paste from Excel (Ctrl/Cmd+V) — columns:{' '}
          {columns.map((c) => c.label).join(' · ')}. Review before create.
        </Typography>

        {pasteHint ? (
          <Typography variant="caption" tone="muted">
            Pasted — review, edit, or remove rows below.
          </Typography>
        ) : null}

        <div className="overflow-x-auto border border-neutral-200">
          <table className="w-full min-w-[520px] text-left text-sm">
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
                    'border-b border-neutral-100',
                    row.error && 'bg-red-50/60'
                  )}
                >
                  <td className="px-2 py-1.5 align-middle text-xs text-neutral-400">
                    {index + 1}
                  </td>
                  {columns.map((col) => (
                    <td key={col.key} className="px-2 py-1.5 align-middle">
                      <Input
                        value={row[col.key]}
                        onChange={(e) => updateRow(row.id, { [col.key]: e.target.value })}
                        placeholder={col.placeholder}
                        aria-label={`${col.label} row ${index + 1}`}
                        fullWidth
                        size="sm"
                      />
                    </td>
                  ))}
                  <td className="px-1 py-1.5 align-middle">
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-neutral-800"
                      onClick={() => removeRow(row.id)}
                      aria-label={`Remove row ${index + 1}`}
                    >
                      <Trash2 size={14} />
                    </button>
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
            Tip: copy cells from Excel then paste anywhere in this dialog
          </Typography>
        </Stack>
      </div>
    </Modal>
  )
}
