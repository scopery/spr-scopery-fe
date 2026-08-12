'use client'

import { useCallback, useEffect, useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button, ConfirmDialog, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { cn } from '@/utils/cn'
import {
  ARCHITECTURE_NODE_TYPE_LABEL,
  type BrowseCatalogNode,
} from '../model/architecture-workbench'
import { ScreenDetailPanel } from './ScreenDetailPanel'
import type { RegistryScreen } from '../model/application-registry'

export interface NodeEditPayload {
  name: string
  secondary?: string | null
}

interface NodeDetailInspectorProps {
  node: BrowseCatalogNode
  workspaceId: string
  screen?: RegistryScreen | null
  /** Related Functions for this application (used when viewing a Module). */
  relatedFunctions?: BrowseCatalogNode[]
  onClose: () => void
  onSave?: (node: BrowseCatalogNode, payload: NodeEditPayload) => Promise<void>
  onDelete?: (node: BrowseCatalogNode) => Promise<void>
  /** When set (and onDelete omitted), show why delete is blocked. */
  deleteBlockedReason?: string | null
  onSelectFunction?: (fn: BrowseCatalogNode) => void
}

function secondaryLabel(type: BrowseCatalogNode['type']): string | null {
  switch (type) {
    case 'MODULE':
      return 'Description'
    case 'SCREEN':
      return 'Route path'
    case 'API_ENDPOINT':
      return 'Name'
    case 'COMPONENT':
      return 'Component type'
    case 'DATA_ENTITY':
      return 'Table name'
    case 'COMMUNICATION':
      return 'Trigger key'
    case 'FUNCTION':
      return 'Module'
    default:
      return null
  }
}

function DashedField({
  label,
  value,
  onChange,
  onEnter,
  placeholder,
  disabled,
  large,
}: {
  label: string
  value: string
  onChange: (next: string) => void
  onEnter?: () => void
  placeholder?: string
  disabled?: boolean
  large?: boolean
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-xs text-neutral-500">{label}</span>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onEnter?.()
          }
        }}
        className={cn(
          'w-full min-w-0 border-0 border-b border-dashed border-neutral-300 bg-transparent px-0 py-1.5',
          'text-neutral-900 outline-none transition-colors',
          'placeholder:text-neutral-400',
          'hover:border-neutral-400 focus:border-neutral-800 focus:border-solid',
          'disabled:cursor-default disabled:opacity-60',
          large ? 'font-calsans text-base' : 'text-sm'
        )}
      />
    </label>
  )
}

function ViewField({
  label,
  value,
  large,
  emptyText = '—',
}: {
  label: string
  value: string
  large?: boolean
  emptyText?: string
}) {
  const empty = !value.trim()
  return (
    <div className="min-w-0">
      <div className="mb-1 text-xs text-neutral-500">{label}</div>
      <div
        className={cn(
          'border-b border-transparent py-1.5',
          large ? 'font-calsans text-base text-neutral-900' : 'text-sm text-neutral-800',
          empty && 'text-neutral-400'
        )}
      >
        {empty ? emptyText : value}
      </div>
    </div>
  )
}

/** Detail pane — view by default; pencil opens dashed edit + Save/Cancel. */
export function NodeDetailInspector({
  node,
  workspaceId,
  screen,
  relatedFunctions = [],
  onClose,
  onSave,
  onDelete,
  deleteBlockedReason = null,
  onSelectFunction,
}: NodeDetailInspectorProps) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(node.name)
  const [editSecondary, setEditSecondary] = useState(node.secondary ?? '')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setEditing(false)
    setFormError(null)
    setConfirmDelete(false)
    setEditName(node.name)
    setEditSecondary(node.secondary ?? '')
  }, [node.id, node.name, node.secondary])

  const extraLabel = secondaryLabel(node.type)
  const canEdit = Boolean(onSave) && node.type !== 'FUNCTION'
  const canDelete = Boolean(onDelete) && node.type !== 'FUNCTION'
  const isArchive = node.type === 'COMMUNICATION'

  const moduleFunctionsByProject = (() => {
    if (node.type !== 'MODULE') return []
    const forModule = relatedFunctions.filter(
      (fn) => fn.type === 'FUNCTION' && fn.moduleId === node.id
    )
    const groups = new Map<string, BrowseCatalogNode[]>()
    for (const fn of forModule) {
      const key = fn.projectName?.trim() || 'Unknown project'
      const list = groups.get(key) ?? []
      list.push(fn)
      groups.set(key, list)
    }
    return Array.from(groups.entries()).map(([projectName, functions]) => ({
      projectName,
      functions,
    }))
  })()

  const startEditing = () => {
    if (!canEdit) return
    setFormError(null)
    setEditName(node.name)
    setEditSecondary(node.secondary ?? '')
    setEditing(true)
  }

  const cancelEditing = () => {
    setFormError(null)
    setEditName(node.name)
    setEditSecondary(node.secondary ?? '')
    setEditing(false)
  }

  const saveEditing = useCallback(async () => {
    if (!onSave) {
      setEditing(false)
      return
    }
    const nextName = editName.trim()
    const nextSecondary = editSecondary.trim() || null
    const prevSecondary = node.secondary ?? null
    if (!nextName) {
      setFormError('Name is required')
      return
    }

    if (nextName === node.name && nextSecondary === prevSecondary) {
      setEditing(false)
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      await onSave(node, {
        name: nextName,
        secondary: nextSecondary,
      })
      setEditing(false)
    } catch (err: unknown) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to save'
      )
    } finally {
      setSaving(false)
    }
  }, [editName, editSecondary, node, onSave])

  const handleConfirmDelete = useCallback(async () => {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete(node)
      setConfirmDelete(false)
      toast.success(
        isArchive
          ? `${ARCHITECTURE_NODE_TYPE_LABEL[node.type]} archived`
          : `${ARCHITECTURE_NODE_TYPE_LABEL[node.type]} deleted`
      )
      onClose()
    } catch (err: unknown) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : isArchive
              ? 'Failed to archive'
              : 'Failed to delete'
      )
    } finally {
      setDeleting(false)
    }
  }, [isArchive, node, onClose, onDelete])

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
        <div className="min-w-0">
          <Typography variant="small" tone="muted" className="leading-none">
            {ARCHITECTURE_NODE_TYPE_LABEL[node.type]} · {node.code}
          </Typography>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {canEdit && !editing ? (
            <button
              type="button"
              onClick={startEditing}
              className="inline-flex h-8 w-8 items-center justify-center text-neutral-500 hover:text-neutral-900"
              aria-label="Edit"
              title="Edit"
            >
              <Pencil size={16} strokeWidth={1.75} />
            </button>
          ) : null}
          {canDelete && !editing ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex h-8 w-8 items-center justify-center text-neutral-500 hover:text-red-600"
              aria-label={isArchive ? 'Archive' : 'Delete'}
              title={isArchive ? 'Archive' : 'Delete'}
              disabled={deleting}
            >
              <Trash2 size={16} strokeWidth={1.75} />
            </button>
          ) : null}
          {!canDelete && deleteBlockedReason && !editing ? (
            <button
              type="button"
              disabled
              className="inline-flex h-8 w-8 items-center justify-center text-neutral-300"
              aria-label={deleteBlockedReason}
              title={deleteBlockedReason}
            >
              <Trash2 size={16} strokeWidth={1.75} />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center text-neutral-500 hover:text-neutral-900"
            aria-label="Close detail"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <Stack direction="vertical" spacing="md">
          {editing ? (
            <>
              <DashedField
                label="Name"
                value={editName}
                onChange={setEditName}
                onEnter={() => void saveEditing()}
                placeholder="Name"
                disabled={saving}
                large
              />
              {extraLabel ? (
                <DashedField
                  label={extraLabel}
                  value={editSecondary}
                  onChange={setEditSecondary}
                  onEnter={() => void saveEditing()}
                  placeholder={extraLabel}
                  disabled={saving}
                />
              ) : null}
              {formError ? (
                <Typography tone="error" variant="small">
                  {formError}
                </Typography>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  disabled={!editName.trim() || saving}
                  loading={saving}
                  onClick={() => void saveEditing()}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={saving}
                  onClick={cancelEditing}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <ViewField label="Name" value={node.name} large />
              {extraLabel ? (
                <ViewField
                  label={extraLabel}
                  value={node.secondary ?? ''}
                  emptyText="No value"
                />
              ) : null}
              {node.type === 'FUNCTION' ? (
                <ViewField
                  label="Description"
                  value={node.description ?? ''}
                  emptyText="No description"
                />
              ) : null}
              {node.type === 'FUNCTION' ? (
                <Typography variant="small" tone="muted">
                  Functions are managed in the project catalog. Assign them to modules on the
                  Structure tab.
                </Typography>
              ) : null}
              {deleteBlockedReason && node.type !== 'FUNCTION' ? (
                <Typography variant="small" tone="muted">
                  {deleteBlockedReason}
                </Typography>
              ) : null}
            </>
          )}

          {node.type === 'MODULE' ? (
            <div className="space-y-3 border-t border-neutral-200 pt-4">
              <Typography weight="medium" size="sm">
                Functions
              </Typography>
              {moduleFunctionsByProject.length === 0 ? (
                <Typography variant="small" tone="muted">
                  No functions assigned to this module yet. Map them on Structure.
                </Typography>
              ) : (
                moduleFunctionsByProject.map((group) => (
                  <div key={group.projectName} className="space-y-1">
                    <Typography variant="caption" tone="muted">
                      {group.projectName}
                    </Typography>
                    <ul className="space-y-0.5">
                      {group.functions.map((fn) => (
                        <li key={fn.id}>
                          {onSelectFunction ? (
                            <button
                              type="button"
                              className="w-full truncate rounded px-1.5 py-1 text-left text-sm text-neutral-900 hover:bg-neutral-100"
                              onClick={() => onSelectFunction(fn)}
                            >
                              <span className="font-calsans">{fn.code}</span>
                              <span className="text-neutral-600"> · {fn.name}</span>
                            </button>
                          ) : (
                            <div className="truncate px-1.5 py-1 text-sm text-neutral-900">
                              <span className="font-calsans">{fn.code}</span>
                              <span className="text-neutral-600"> · {fn.name}</span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          ) : null}

          {node.type === 'SCREEN' && screen ? (
            <ScreenDetailPanel
              workspaceId={workspaceId}
              screen={screen}
              onClose={onClose}
              embedded
            />
          ) : null}
        </Stack>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => {
          if (!deleting) setConfirmDelete(false)
        }}
        title={isArchive ? 'Archive communication' : `Delete ${ARCHITECTURE_NODE_TYPE_LABEL[node.type].toLowerCase()}`}
        message={
          isArchive
            ? `Archive "${node.code} — ${node.name}"? It will be hidden from the active catalog.`
            : `Delete "${node.code} — ${node.name}"? This cannot be undone.`
        }
        confirmLabel={isArchive ? 'Archive' : 'Delete'}
        variant="danger"
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
