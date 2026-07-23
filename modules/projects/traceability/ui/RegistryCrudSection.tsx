'use client'

import { useState, type ReactNode } from 'react'
import { Button, ConfirmDialog, Input, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { cn } from '@/utils/cn'

export interface RegistryCrudRow {
  id: string
  code: string
  name: string
  secondary?: string | null
  status?: string | null
}

export interface RegistryCrudCreateInput {
  code: string
  name: string
  extra?: string
}

export interface RegistryCrudUpdateInput {
  name: string
  extra?: string
}

interface RegistryCrudSectionProps {
  title: string
  /** Hide the section heading when the parent already shows context. */
  hideTitle?: boolean
  itemLabel: string
  emptyLabel: string
  codePlaceholder?: string
  namePlaceholder: string
  extraPlaceholder?: string
  /** When false, hide the code field and do not require it on create. Default true. */
  requireCode?: boolean
  /** When true, the optional extra field becomes required on create/update. */
  extraRequired?: boolean
  items: RegistryCrudRow[]
  onCreate: (input: RegistryCrudCreateInput) => Promise<void>
  onUpdate: (id: string, input: RegistryCrudUpdateInput) => Promise<void>
  onDelete: (id: string) => Promise<void>
  renderRowActions?: (row: RegistryCrudRow) => ReactNode
}

export function RegistryCrudSection({
  title,
  hideTitle = false,
  itemLabel,
  emptyLabel,
  codePlaceholder = 'Code',
  namePlaceholder,
  extraPlaceholder,
  requireCode = true,
  extraRequired = false,
  items,
  onCreate,
  onUpdate,
  onDelete,
  renderRowActions,
}: RegistryCrudSectionProps) {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [extra, setExtra] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editExtra, setEditExtra] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<RegistryCrudRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const canSubmit =
    Boolean(name.trim()) &&
    (!requireCode || Boolean(code.trim())) &&
    (!extraRequired || Boolean(extra.trim())) &&
    !submitting

  const canSaveEdit =
    Boolean(editName.trim()) &&
    (!extraRequired || Boolean(editExtra.trim())) &&
    !submitting

  const handleCreate = () => {
    setFormError(null)
    setSubmitting(true)
    void onCreate({
      code: code.trim(),
      name: name.trim(),
      extra: extra.trim() || undefined,
    })
      .then(() => {
        setCode('')
        setName('')
        setExtra('')
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 409) {
          setFormError('Code may already exist. Use a unique code and try again.')
          return
        }
        setFormError(err instanceof Error ? err.message : 'Failed to create')
      })
      .finally(() => setSubmitting(false))
  }

  const startEdit = (row: RegistryCrudRow) => {
    setEditingId(row.id)
    setEditName(row.name)
    setEditExtra(row.secondary ?? '')
    setFormError(null)
  }

  const saveEdit = (id: string) => {
    if (!canSaveEdit) return
    setSubmitting(true)
    setFormError(null)
    void onUpdate(id, {
      name: editName.trim(),
      extra: editExtra.trim() || undefined,
    })
      .then(() => setEditingId(null))
      .catch((err: unknown) => {
        setFormError(err instanceof Error ? err.message : 'Failed to update')
      })
      .finally(() => setSubmitting(false))
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await onDelete(deleteTarget.id)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete')
      throw err
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Stack direction="vertical" spacing="md">
      {hideTitle ? null : <Typography variant="h3">{title}</Typography>}

      <div className="flex flex-wrap gap-2">
        {requireCode ? (
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={codePlaceholder}
            aria-label={codePlaceholder}
            required
          />
        ) : null}
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={namePlaceholder}
          aria-label={namePlaceholder}
          required
        />
        {extraPlaceholder ? (
          <Input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder={extraPlaceholder}
            aria-label={extraPlaceholder}
            required={extraRequired}
          />
        ) : null}
        <Button disabled={!canSubmit} onClick={handleCreate}>
          Add
        </Button>
      </div>

      {formError ? <Typography tone="error">{formError}</Typography> : null}

      {items.length === 0 ? (
        <Typography tone="muted">{emptyLabel}</Typography>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {items.map((row) => {
            const isEditing = editingId === row.id
            return (
              <li
                key={row.id}
                className={cn('flex flex-wrap items-start justify-between gap-3 py-3')}
              >
                {isEditing ? (
                  <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      aria-label={`Edit ${itemLabel} name`}
                    />
                    {extraPlaceholder ? (
                      <Input
                        value={editExtra}
                        onChange={(e) => setEditExtra(e.target.value)}
                        aria-label={`Edit ${extraPlaceholder}`}
                        required={extraRequired}
                      />
                    ) : null}
                    <Button
                      size="sm"
                      disabled={!canSaveEdit}
                      onClick={() => saveEdit(row.id)}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={submitting}
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="min-w-0">
                      <Typography variant="small" weight="medium">
                        {row.name}
                      </Typography>
                      <Typography variant="caption" tone="muted">
                        {[row.code, row.secondary].filter(Boolean).join(' · ')}
                      </Typography>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {renderRowActions?.(row)}
                      <Button size="sm" variant="ghost" onClick={() => startEdit(row)}>
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget(row)}
                      >
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${itemLabel}?`}
        message={
          deleteTarget
            ? `Remove “${deleteTarget.name}”${
                deleteTarget.code ? ` (${deleteTarget.code})` : ''
              }. This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleting}
        onConfirm={confirmDelete}
        variant="danger"
      />
    </Stack>
  )
}
