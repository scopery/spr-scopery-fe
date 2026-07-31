'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, Trash2 } from 'lucide-react'
import { Button, DataTable, Input, Modal, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { UseCaseSearchSelect } from '@/modules/projects/traceability'
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
  const [useCaseId, setUseCaseId] = useState('')

  useEffect(() => {
    if (!open) return
    setRows([newRow(kind)])
    setFormError(null)
    setSubmitting(false)
    submittingRef.current = false
    setPasteHint(false)
    setUseCaseId('')
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
    if (kind === 'TEST_CASE' && !useCaseId) {
      setFormError('Select the Use Case covered by these Test Cases.')
      return
    }
    if (kind === 'TEST_CASE' && validRows.some((row) => row.values.type === 'NON_FUNCTIONAL')) {
      setFormError('Use Verification Cases for non-functional requirements.')
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
        await onCreate(
          mapDraftToCreateInput(
            kind,
            kind === 'TEST_CASE' ? { ...row.values, useCaseId } : row.values
          )
        )
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
          disabled: submitting || validRows.length === 0 || (kind === 'TEST_CASE' && !useCaseId),
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
        {kind === 'TEST_CASE' ? (
          <UseCaseSearchSelect
            projectId={projectId}
            value={useCaseId}
            onChange={setUseCaseId}
            label="Use Case for all Test Cases"
            required
          />
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

        <Button size="sm" variant="secondary" icon={<Plus size={14} />} onClick={addRow}>
          Add row
        </Button>
      </div>
    </Modal>
  )
}
