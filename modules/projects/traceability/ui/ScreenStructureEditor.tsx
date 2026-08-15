'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ChevronDown, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  DataTable,
  Divider,
  Input,
  Modal,
  Select,
  Stack,
  Typography,
} from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { cn } from '@/utils/cn'

export type StructureOption = string | { value: string; label: string }

export interface StructureColumn {
  key: string
  label: string
  required?: boolean
  placeholder?: string
  /** Existing rows: field not editable (e.g. fieldKey / actionCode). */
  lockedOnExisting?: boolean
  /** When set, field is an enum — enables Single add mode with a Select. */
  options?: readonly StructureOption[]
}

function optionValue(option: StructureOption): string {
  return typeof option === 'string' ? option : option.value
}

function optionLabel(option: StructureOption): string {
  return typeof option === 'string' ? option : option.label
}

export interface StructureItem {
  id: string
  values: Record<string, string>
}

interface ScreenStructureEditorProps {
  columns: StructureColumn[]
  items: StructureItem[]
  emptyLabel: string
  addTitle: string
  editTitle: string
  itemLabel: string
  /** Temporarily hide delete for safer catalogs. Default true. */
  allowDelete?: boolean
  /** Extra control on each list row (e.g. field Configure). */
  renderRowAction?: (item: StructureItem) => ReactNode
  /** Status chips under the row title (e.g. linked component, rule count). */
  renderRowStatus?: (item: StructureItem) => ReactNode
  onCreate: (values: Record<string, string>) => Promise<void>
  onUpdate: (id: string, values: Record<string, string>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

interface DraftRow {
  id: string
  values: Record<string, string>
  error?: string | null
}

interface EditRow extends StructureItem {
  draft: Record<string, string>
  dirty: boolean
  saving?: boolean
  error?: string | null
}

function emptyValues(columns: StructureColumn[]): Record<string, string> {
  return Object.fromEntries(columns.map((c) => [c.key, c.options?.[0] ? optionValue(c.options[0]) : '']))
}

function newDraftId(): string {
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

const PRIMARY_KEYS = new Set(['title', 'name', 'label'])
const DESCRIPTION_KEYS = new Set(['description', 'note', 'content'])
/** Codes stay quiet in the list — shown as meta, not the headline. */
const META_KEYS = new Set([
  'code',
  'fieldKey',
  'actionCode',
  'severity',
  'status',
  'type',
])

function displayCellValue(col: StructureColumn, raw: string | undefined): string {
  const value = raw?.trim() ?? ''
  if (!value || value === 'none') return ''
  if (col.options && col.options.length > 0) {
    const match = col.options.find((o) => optionValue(o) === value)
    return match ? optionLabel(match) : ''
  }
  return value
}

function primaryLabel(item: StructureItem, columns: StructureColumn[]): string {
  const nameCol = columns.find((c) => PRIMARY_KEYS.has(c.key))
  if (nameCol) return item.values[nameCol.key]?.trim() || '—'
  const fallback = columns.find((c) => !META_KEYS.has(c.key) && !DESCRIPTION_KEYS.has(c.key))
  return item.values[fallback?.key ?? columns[0]?.key ?? '']?.trim() || '—'
}

function secondaryLabel(item: StructureItem, columns: StructureColumn[]): string {
  return columns
    .filter((c) => DESCRIPTION_KEYS.has(c.key))
    .map((c) => displayCellValue(c, item.values[c.key]))
    .filter(Boolean)
    .join(' · ')
}

function metaLabel(item: StructureItem, columns: StructureColumn[]): string {
  return columns
    .filter((c) => !PRIMARY_KEYS.has(c.key) && !DESCRIPTION_KEYS.has(c.key))
    .map((c) => displayCellValue(c, item.values[c.key]))
    .filter(Boolean)
    .join(' · ')
}

export function ScreenStructureEditor({
  columns,
  items,
  emptyLabel,
  addTitle,
  editTitle,
  itemLabel,
  allowDelete = true,
  renderRowAction,
  renderRowStatus,
  onCreate,
  onUpdate,
  onDelete,
}: ScreenStructureEditorProps) {
  const hasEnumColumns = useMemo(() => columns.some((c) => (c.options?.length ?? 0) > 0), [columns])
  const [rows, setRows] = useState<EditRow[]>([])
  const [editOpen, setEditOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [singleOpen, setSingleOpen] = useState(false)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const addMenuRef = useRef<HTMLDivElement>(null)
  const [singleValues, setSingleValues] = useState<Record<string, string>>(() =>
    emptyValues(columns)
  )
  const [drafts, setDrafts] = useState<DraftRow[]>([
    { id: newDraftId(), values: emptyValues(columns) },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EditRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [pasteHint, setPasteHint] = useState(false)

  useEffect(() => {
    if (!addMenuOpen) return
    const onPointer = (e: MouseEvent) => {
      if (!addMenuRef.current?.contains(e.target as Node)) setAddMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAddMenuOpen(false)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [addMenuOpen])

  useEffect(() => {
    setRows(
      items.map((item) => ({
        ...item,
        draft: { ...item.values },
        dirty: false,
        error: null,
      }))
    )
  }, [items])

  useEffect(() => {
    if (!addOpen) return
    setDrafts([{ id: newDraftId(), values: emptyValues(columns) }])
    setFormError(null)
    setPasteHint(false)
    setSubmitting(false)
  }, [addOpen, columns])

  useEffect(() => {
    if (!singleOpen) return
    setSingleValues(emptyValues(columns))
    setFormError(null)
    setSubmitting(false)
  }, [singleOpen, columns])

  const openAdd = () => {
    if (hasEnumColumns) {
      setAddMenuOpen((v) => !v)
      return
    }
    setAddOpen(true)
  }
  const dirtyCount = useMemo(() => rows.filter((r) => r.dirty).length, [rows])

  const updateDraftCell = (id: string, key: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r
        const draft = { ...r.draft, [key]: value }
        const dirty = columns.some((c) => (draft[c.key] ?? '') !== (r.values[c.key] ?? ''))
        return { ...r, draft, dirty, error: null }
      })
    )
  }

  const saveRow = async (row: EditRow) => {
    const missing = columns.some((c) => {
      if (!c.required) return false
      const value = c.lockedOnExisting ? row.values[c.key] : row.draft[c.key]
      return !value?.trim()
    })
    if (missing) {
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, error: 'Missing required fields' } : r))
      )
      return
    }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, saving: true, error: null } : r)))
    try {
      await onUpdate(row.id, row.draft)
    } catch (err: unknown) {
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? {
                ...r,
                saving: false,
                error: err instanceof Error ? err.message : 'Failed to save',
              }
            : r
        )
      )
    }
  }

  const saveAllDirty = async () => {
    for (const row of rows.filter((r) => r.dirty)) {
      await saveRow(row)
    }
  }

  const validDrafts = drafts.filter((d) =>
    columns.every((c) => !c.required || Boolean(d.values[c.key]?.trim()))
  )

  const applyPaste = useCallback(
    (text: string) => {
      const raw = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
      if (!raw) return
      const lines = raw.split('\n').filter((l) => l.trim())
      const delim = lines[0]?.includes('\t') ? '\t' : ','
      const parsed = lines.map((line) => line.split(delim).map((c) => c.trim()))
      let start = 0
      const header = (parsed[0] ?? []).join('|').toLowerCase()
      if (columns.some((c) => header.includes(c.label.toLowerCase()) || header.includes(c.key))) {
        start = 1
      }
      const next: DraftRow[] = []
      for (let i = start; i < parsed.length; i++) {
        const cells = parsed[i] ?? []
        const values = emptyValues(columns)
        columns.forEach((col, idx) => {
          values[col.key] = cells[idx] ?? ''
        })
        if (Object.values(values).some((v) => v.trim())) {
          next.push({ id: newDraftId(), values })
        }
      }
      if (!next.length) return
      setDrafts((prev) => {
        const blank = prev.length === 1 && Object.values(prev[0].values).every((v) => !v.trim())
        return blank ? next : [...prev, ...next]
      })
      setPasteHint(true)
    },
    [columns]
  )

  useEffect(() => {
    if (!addOpen) return
    const onPaste = (e: ClipboardEvent) => {
      const text = e.clipboardData?.getData('text/plain') ?? ''
      if (!(text.includes('\n') || text.includes('\t'))) return
      e.preventDefault()
      applyPaste(text)
    }
    document.addEventListener('paste', onPaste)
    return () => document.removeEventListener('paste', onPaste)
  }, [addOpen, applyPaste])

  const handleBulkCreate = async () => {
    if (validDrafts.length === 0) {
      setFormError('Add at least one row with required fields.')
      return
    }
    setSubmitting(true)
    setFormError(null)
    const remaining: DraftRow[] = []
    let created = 0
    for (const draft of drafts) {
      const blank = Object.values(draft.values).every((v) => !v.trim())
      if (blank) continue
      const missing = columns.some((c) => c.required && !draft.values[c.key]?.trim())
      if (missing) {
        remaining.push({ ...draft, error: 'Missing required fields' })
        continue
      }
      try {
        await onCreate(draft.values)
        created += 1
      } catch (err: unknown) {
        remaining.push({
          ...draft,
          error:
            err instanceof ApiError && err.status === 409
              ? 'Already exists'
              : err instanceof Error
                ? err.message
                : 'Failed',
        })
      }
    }
    setSubmitting(false)
    if (remaining.length === 0) {
      setAddOpen(false)
      return
    }
    setDrafts(remaining)
    setFormError(
      created
        ? `Created ${created}. Fix ${remaining.length} remaining.`
        : `Could not create. Fix ${remaining.length} row(s).`
    )
  }

  const handleSingleCreate = async () => {
    const missing = columns.some((c) => c.required && !singleValues[c.key]?.trim())
    if (missing) {
      setFormError('Fill all required fields.')
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      await onCreate(singleValues)
      setSingleOpen(false)
    } catch (err: unknown) {
      setFormError(
        err instanceof ApiError && err.status === 409
          ? 'Already exists'
          : err instanceof Error
            ? err.message
            : 'Failed to create'
      )
    } finally {
      setSubmitting(false)
    }
  }

  const closeEditModal = () => {
    setEditOpen(false)
    setRows(
      items.map((item) => ({
        ...item,
        draft: { ...item.values },
        dirty: false,
        error: null,
      }))
    )
  }

  const renderValueControl = (
    col: StructureColumn,
    value: string,
    onChange: (next: string) => void,
    opts?: { disabled?: boolean; 'aria-label'?: string; size?: 'sm' | 'md'; fill?: boolean }
  ) => {
    const fill = opts?.fill ?? false
    if (col.options && col.options.length > 0) {
      const base = col.options.map((o) => ({ value: optionValue(o), label: optionLabel(o) }))
      const known = new Set(base.map((o) => o.value))
      const options =
        value && !known.has(value) ? [{ value, label: value }, ...base] : base
      return (
        <Select
          options={options}
          value={value || optionValue(col.options[0])}
          onValueChange={onChange}
          disabled={opts?.disabled}
          size={opts?.size ?? 'md'}
          className={fill ? 'w-full' : 'min-w-[200px]'}
        />
      )
    }
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={col.placeholder}
        aria-label={opts?.['aria-label']}
        fullWidth={fill}
        size={opts?.size ?? 'md'}
        disabled={opts?.disabled}
      />
    )
  }

  return (
    <Stack direction="vertical" spacing="sm">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <div ref={addMenuRef} className="relative">
          <Button
            size="sm"
            variant="secondary"
            onClick={openAdd}
            aria-expanded={hasEnumColumns ? addMenuOpen : undefined}
            aria-haspopup={hasEnumColumns ? 'menu' : undefined}
          >
            <Plus size={14} className="mr-1 inline" />
            Add
            {hasEnumColumns ? (
              <ChevronDown
                size={14}
                className={cn('ml-1 inline transition-transform', addMenuOpen && 'rotate-180')}
              />
            ) : null}
          </Button>
          {hasEnumColumns && addMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-20 mt-1 min-w-[160px] border border-neutral-200 bg-white py-1 shadow-md"
            >
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                onClick={() => {
                  setAddMenuOpen(false)
                  setSingleOpen(true)
                }}
              >
                Single add
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-sm text-neutral-800 hover:bg-neutral-50"
                onClick={() => {
                  setAddMenuOpen(false)
                  setAddOpen(true)
                }}
              >
                Bulk add
              </button>
            </div>
          ) : null}
        </div>
        <Button
          size="sm"
          variant="ghost"
          disabled={items.length === 0}
          onClick={() => setEditOpen(true)}
        >
          <Pencil size={14} className="mr-1 inline" />
          Edit
        </Button>
      </div>

      <Divider />

      {items.length === 0 ? (
        <Typography tone="muted" className="py-3 text-center">
          {emptyLabel}
        </Typography>
      ) : (
        <ol className="divide-y divide-neutral-100">
          {items.map((item, index) => {
            const secondary = secondaryLabel(item, columns)
            const meta = metaLabel(item, columns)
            return (
              <li key={item.id} className="flex gap-3 py-2.5">
                <span className="w-5 shrink-0 pt-0.5 text-xs tabular-nums text-neutral-400">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="whitespace-pre-wrap break-words text-sm font-medium text-neutral-900">
                    {primaryLabel(item, columns)}
                  </div>
                  {secondary ? (
                    <div className="mt-0.5 whitespace-pre-wrap break-words text-xs text-neutral-600">
                      {secondary}
                    </div>
                  ) : null}
                  {meta ? (
                    <div className="mt-0.5 whitespace-pre-wrap break-words text-xs text-neutral-400">
                      {meta}
                    </div>
                  ) : null}
                  {renderRowStatus ? <div className="mt-1.5">{renderRowStatus(item)}</div> : null}
                </div>
                {renderRowAction ? (
                  <div className="shrink-0 self-start">{renderRowAction(item)}</div>
                ) : null}
              </li>
            )
          })}
        </ol>
      )}

      {/* Edit existing — stacked fields so text is not clipped in table cells */}
      <Modal
        open={editOpen}
        onClose={closeEditModal}
        title={editTitle}
        size="xl"
        actions={[
          { label: 'Close', onClick: closeEditModal, variant: 'ghost' },
          ...(dirtyCount > 0
            ? [
                {
                  label: `Save all (${dirtyCount})`,
                  onClick: () => void saveAllDirty(),
                  variant: 'primary' as const,
                },
              ]
            : []),
        ]}
      >
        <div className="space-y-3">
          <Typography variant="small" tone="muted">
            Each item is a full-width form. Save a row or use Save all.
          </Typography>
          <div className="space-y-6">
            {rows.map((row, index) => (
              <div
                key={row.id}
                className={cn(
                  'space-y-3 border-b border-neutral-200 pb-6 last:border-b-0 last:pb-0',
                  row.error && 'border-error/40'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <Typography variant="caption" tone="muted" className="tabular-nums">
                    {index + 1}
                    {row.dirty ? ' · unsaved' : ''}
                  </Typography>
                  <div className="flex items-center gap-1">
                    {row.dirty ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={row.saving}
                        loading={row.saving}
                        onClick={() => void saveRow(row)}
                      >
                        Save
                      </Button>
                    ) : null}
                    {allowDelete ? (
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-neutral-800"
                        aria-label={`Delete ${itemLabel}`}
                        onClick={() => setDeleteTarget(row)}
                      >
                        <Trash2 size={14} />
                      </button>
                    ) : null}
                  </div>
                </div>
                {columns.map((col) => (
                  <div key={col.key}>
                    <Typography variant="small" className="mb-1.5">
                      {col.label}
                      {col.required ? ' *' : ''}
                    </Typography>
                    {col.lockedOnExisting ? (
                      <Typography variant="small" className="py-1.5 text-neutral-600">
                        {row.values[col.key] || '—'}
                      </Typography>
                    ) : (
                      renderValueControl(
                        col,
                        row.draft[col.key] ?? '',
                        (next) => updateDraftCell(row.id, col.key, next),
                        {
                          disabled: row.saving,
                          'aria-label': `${col.label} row ${index + 1}`,
                          size: 'md',
                          fill: true,
                        }
                      )
                    )}
                  </div>
                ))}
                {row.error ? (
                  <Typography variant="caption" tone="error">
                    {row.error}
                  </Typography>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* Bulk add modal */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={addTitle}
        size="2xl"
        actions={[
          { label: 'Cancel', onClick: () => setAddOpen(false), variant: 'ghost' },
          {
            label: submitting ? 'Creating…' : `Create ${validDrafts.length}`,
            onClick: () => void handleBulkCreate(),
            variant: 'primary',
            disabled: submitting || validDrafts.length === 0,
            loading: submitting,
          },
        ]}
      >
        <div className="space-y-4">
          <Typography variant="small" tone="muted">
            Add rows or paste from Excel (Ctrl/Cmd+V). Columns:{' '}
            {columns.map((c) => c.label).join(' · ')}.
          </Typography>
          {pasteHint ? (
            <Typography variant="caption" tone="muted">
              Pasted — review before create.
            </Typography>
          ) : null}
          <DataTable
            className="max-h-[min(60vh,520px)] border border-neutral-200"
            tableClassName="min-w-max table-auto"
            ariaLabel={addTitle}
            rows={drafts}
            rowKey={(draft) => draft.id}
            rowClassName={(draft) => cn(draft.error && 'bg-red-50/60')}
            columns={[
              { id: 'index', header: '#', cell: (_draft, index) => index + 1, width: '48px', truncate: false },
              ...columns.map((col) => ({
                id: col.key,
                header: `${col.label}${col.required ? ' *' : ''}`,
                kind: /code|key/i.test(col.key) ? ('code' as const) : undefined,
                truncate: false,
                interactive: true,
                cell: (draft: DraftRow, index: number) =>
                  renderValueControl(
                    col,
                    draft.values[col.key] ?? '',
                    (next) =>
                      setDrafts((prev) =>
                        prev.map((item) =>
                          item.id === draft.id
                            ? { ...item, values: { ...item.values, [col.key]: next }, error: null }
                            : item
                        )
                      ),
                    { 'aria-label': `${col.label} draft ${index + 1}`, size: 'md' }
                  ),
              })),
              {
                id: 'remove',
                header: '',
                width: '48px',
                cell: (draft, index) => (
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-neutral-800"
                    onClick={() =>
                      setDrafts((prev) =>
                        prev.length <= 1
                          ? [{ id: newDraftId(), values: emptyValues(columns) }]
                          : prev.filter((item) => item.id !== draft.id)
                      )
                    }
                    aria-label={`Remove row ${index + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                ),
              },
            ]}
          />
          {drafts.some((d) => d.error) ? (
            <ul className="space-y-1">
              {drafts.map((d, i) =>
                d.error ? (
                  <li key={d.id}>
                    <Typography variant="small" tone="error">
                      Row {i + 1}: {d.error}
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
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              setDrafts((prev) => [...prev, { id: newDraftId(), values: emptyValues(columns) }])
            }
          >
            <Plus size={14} className="mr-1 inline" />
            Add row
          </Button>
        </div>
      </Modal>

      {/* Single add modal (when any column is an enum) */}
      <Modal
        open={singleOpen}
        onClose={() => setSingleOpen(false)}
        title={addTitle}
        size="md"
        actions={[
          { label: 'Cancel', onClick: () => setSingleOpen(false), variant: 'ghost' },
          {
            label: submitting ? 'Creating…' : 'Create',
            onClick: () => void handleSingleCreate(),
            variant: 'primary',
            disabled: submitting || columns.some((c) => c.required && !singleValues[c.key]?.trim()),
            loading: submitting,
          },
        ]}
      >
        <div className="space-y-3">
          <Typography variant="small" tone="muted">
            Add one {itemLabel}. Enum fields use a dropdown.
          </Typography>
          {columns.map((col) => (
            <div key={col.key}>
              <Typography variant="small" className="mb-1.5">
                {col.label}
                {col.required ? ' *' : ''}
              </Typography>
              {renderValueControl(
                col,
                singleValues[col.key] ?? '',
                (next) => setSingleValues((prev) => ({ ...prev, [col.key]: next })),
                { size: 'md', 'aria-label': col.label, fill: true }
              )}
            </div>
          ))}
          {formError ? (
            <Typography tone="error" variant="small">
              {formError}
            </Typography>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${itemLabel}?`}
        message={deleteTarget ? `Remove this ${itemLabel}. This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={async () => {
          if (!deleteTarget) return
          setDeleting(true)
          try {
            await onDelete(deleteTarget.id)
            setDeleteTarget(null)
          } finally {
            setDeleting(false)
          }
        }}
      />
    </Stack>
  )
}
