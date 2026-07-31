'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button, DataTable, Input, Modal, SearchableSelect, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { cn } from '@/utils/cn'
import type { CreateUseCaseBody } from '../model/use-case'
import type { FunctionalItem } from '../model/functional-catalog'

interface DraftRow {
  id: string
  key: string
  name: string
  actor: string
  goal: string
  error?: string | null
}

interface Props {
  open: boolean
  functionalItems: FunctionalItem[]
  onClose: () => void
  onCreate: (body: CreateUseCaseBody) => Promise<unknown>
  onBatchComplete?: () => Promise<void> | void
}

const COLUMNS = [
  { key: 'key', label: 'Key', required: true, placeholder: 'UC-001' },
  { key: 'name', label: 'Name', required: true, placeholder: 'Use case name' },
  { key: 'actor', label: 'Actor', placeholder: 'End user' },
  { key: 'goal', label: 'Goal', placeholder: 'Optional' },
] as const

function newRow(): DraftRow {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    key: '',
    name: '',
    actor: '',
    goal: '',
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
    if (row.key || row.name) rows.push(row)
  }
  return rows
}

export function UseCaseBulkAddModal({
  open,
  functionalItems,
  onClose,
  onCreate,
  onBatchComplete,
}: Props) {
  const functionOptions = useMemo(
    () => functionalItems.map((fi) => ({ value: fi.id, label: `${fi.code} · ${fi.title}` })),
    [functionalItems]
  )
  const [functionId, setFunctionId] = useState('')
  const [rows, setRows] = useState<DraftRow[]>([newRow()])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [pasteHint, setPasteHint] = useState(false)

  useEffect(() => {
    if (!open) return
    setFunctionId(functionalItems[0]?.id ?? '')
    setRows([newRow()])
    setSubmitting(false)
    setFormError(null)
    setPasteHint(false)
  }, [open, functionalItems])

  const validRows = useMemo(() => rows.filter((r) => r.key.trim() && r.name.trim()), [rows])

  const updateRow = (id: string, patch: Partial<DraftRow>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch, error: null } : r)))

  const addRow = () => setRows((prev) => [...prev, newRow()])

  const removeRow = (id: string) =>
    setRows((prev) => (prev.length <= 1 ? [newRow()] : prev.filter((r) => r.id !== id)))

  const applyPaste = useCallback((text: string) => {
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

  const handleSubmit = async () => {
    if (!functionId) {
      setFormError('Select a function first.')
      return
    }
    if (validRows.length === 0) {
      setFormError('Add at least one row with key and name.')
      return
    }
    setSubmitting(true)
    setFormError(null)

    const remaining: DraftRow[] = []
    let created = 0

    for (const row of rows) {
      if (!row.key.trim() && !row.name.trim()) continue
      if (!row.key.trim() || !row.name.trim()) {
        remaining.push({ ...row, error: 'Key and name are required' })
        continue
      }
      try {
        await onCreate({
          primaryFunctionId: functionId,
          key: row.key.trim(),
          name: row.name.trim(),
          primaryActorName: row.actor.trim() || null,
          goal: row.goal.trim() || null,
        })
        created++
      } catch (err: unknown) {
        const message =
          err instanceof ApiError && err.status === 409
            ? 'Key already exists'
            : err instanceof Error
              ? err.message
              : 'Failed'
        remaining.push({ ...row, error: message })
      }
    }

    if (created > 0) await onBatchComplete?.()
    setSubmitting(false)

    if (remaining.length === 0) {
      onClose()
      return
    }

    setRows(remaining)
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
      title="Bulk add use cases"
      size="2xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: submitting ? 'Creating…' : `Create ${validRows.length}`,
          onClick: () => void handleSubmit(),
          variant: 'primary',
          disabled: submitting || !functionId || validRows.length === 0,
          loading: submitting,
        },
      ]}
    >
      <div className="space-y-4">
        <div>
          <Typography variant="small" className="mb-1.5">
            Function <span className="text-red-500">*</span>{' '}
            <span className="font-normal text-neutral-400">(applies to all rows)</span>
          </Typography>
          <SearchableSelect
            options={functionOptions}
            value={functionId}
            onValueChange={setFunctionId}
            placeholder="Select a function…"
          />
        </div>

        <Typography variant="small" tone="muted">
          Add one or more rows. Paste from Excel (Ctrl/Cmd+V) — columns:{' '}
          {COLUMNS.map((c) => c.label).join(' · ')}.
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
            Tip: copy cells from Excel then paste in this dialog
          </Typography>
        </Stack>
      </div>
    </Modal>
  )
}
