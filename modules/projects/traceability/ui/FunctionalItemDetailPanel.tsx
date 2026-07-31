'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Pencil, X } from 'lucide-react'
import { Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { cn } from '@/utils/cn'
import {
  BusinessRuleSeverity,
  type FunctionalItem,
  type UpdateFunctionalItemBody,
} from '../model/functional-catalog'
import { useFunctionalItemDetail } from '../hooks/useFunctionalItemDetail'
import { useArchitectureNodeCatalog } from '../hooks/useArchitectureNodeCatalog'
import { labelArchitectureNode } from '../model/anchor-mapping'
import { ScreenStructureEditor } from './ScreenStructureEditor'
import { FunctionalItemCustomPropertiesPanel } from './FunctionalItemCustomPropertiesPanel'
import { useUseCaseCatalog } from '../hooks/useUseCaseCatalog'
import { UseCaseStatusBadge } from './UseCaseStatusBadge'
import { UseCaseCompletenessBadge } from './UseCaseCompletenessBadge'

type DetailTab = 'anchors' | 'properties' | 'rules' | 'use-cases'

interface FunctionalItemDetailPanelProps {
  projectId: string
  workspaceId: string
  item: FunctionalItem
  preferredApplicationId?: string | null
  defaultTab?: DetailTab
  onClose?: () => void
  onSave?: (payload: UpdateFunctionalItemBody) => Promise<void>
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

const SEVERITY_OPTIONS = Object.values(BusinessRuleSeverity)

const RULE_COLS = [
  {
    key: 'code',
    label: 'Code',
    required: true,
    placeholder: 'BR-01',
    lockedOnExisting: true,
  },
  { key: 'title', label: 'Title', required: true, placeholder: 'Must validate email' },
  {
    key: 'severity',
    label: 'Severity',
    placeholder: 'MEDIUM',
    options: SEVERITY_OPTIONS,
  },
]

export function FunctionalItemDetailPanel({
  projectId,
  workspaceId,
  item,
  preferredApplicationId = null,
  defaultTab = 'anchors',
  onClose,
  onSave,
}: FunctionalItemDetailPanelProps) {
  const {
    properties,
    rules,
    anchors,
    loading,
    error,
    addProperty,
    updateProperty,
    removeProperty,
    addRule,
    updateRule,
    removeRule,
  } = useFunctionalItemDetail(projectId, item.id)

  const [tab, setTab] = useState<DetailTab>(defaultTab)
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(item.title)
  const [editDescription, setEditDescription] = useState(item.description ?? '')
  const [editPriority, setEditPriority] = useState(item.priority)
  const [editType, setEditType] = useState(item.type)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const { nodeById } = useArchitectureNodeCatalog(
    workspaceId,
    preferredApplicationId || null
  )

  const { useCases: functionUseCases } = useUseCaseCatalog(
    tab === 'use-cases' ? projectId : null,
    tab === 'use-cases' ? item.id : null
  )

  useEffect(() => {
    setTab(defaultTab)
    setEditing(false)
    setFormError(null)
    setEditTitle(item.title)
    setEditDescription(item.description ?? '')
    setEditPriority(item.priority)
    setEditType(item.type)
  }, [item.id, item.title, item.description, item.priority, item.type, defaultTab])

  const canEdit = Boolean(onSave)

  const startEditing = () => {
    if (!canEdit) return
    setFormError(null)
    setEditTitle(item.title)
    setEditDescription(item.description ?? '')
    setEditPriority(item.priority)
    setEditType(item.type)
    setEditing(true)
  }

  const cancelEditing = () => {
    setFormError(null)
    setEditTitle(item.title)
    setEditDescription(item.description ?? '')
    setEditPriority(item.priority)
    setEditType(item.type)
    setEditing(false)
  }

  const saveEditing = useCallback(async () => {
    if (!onSave) {
      setEditing(false)
      return
    }
    const nextTitle = editTitle.trim()
    if (!nextTitle) {
      setFormError('Title is required')
      return
    }
    const nextDescription = editDescription.trim() || null
    const prevDescription = item.description ?? null
    if (
      nextTitle === item.title &&
      nextDescription === prevDescription &&
      editPriority === item.priority &&
      editType === item.type
    ) {
      setEditing(false)
      return
    }

    setSaving(true)
    setFormError(null)
    try {
      await onSave({
        title: nextTitle,
        description: nextDescription,
        priority: editPriority,
        type: editType,
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
  }, [editDescription, editPriority, editTitle, editType, item, onSave])

  const ruleItems = useMemo(
    () =>
      rules.map((r) => ({
        id: r.id,
        values: {
          code: r.code,
          title: r.title,
          severity: r.severity,
        },
      })),
    [rules]
  )

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
        <div className="min-w-0">
          <Typography variant="small" tone="muted" className="leading-none">
            Functional · {item.code}
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
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center text-neutral-500 hover:text-neutral-900"
              aria-label="Close detail"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <Stack direction="vertical" spacing="md">
          {editing ? (
            <>
              <DashedField
                label="Title"
                value={editTitle}
                onChange={setEditTitle}
                onEnter={() => void saveEditing()}
                placeholder="Title"
                disabled={saving}
                large
              />
              <DashedField
                label="Description"
                value={editDescription}
                onChange={setEditDescription}
                placeholder="Optional"
                disabled={saving}
              />
              <DashedField
                label="Priority"
                value={editPriority}
                onChange={setEditPriority}
                onEnter={() => void saveEditing()}
                placeholder="MEDIUM"
                disabled={saving}
              />
              <DashedField
                label="Type"
                value={editType}
                onChange={setEditType}
                onEnter={() => void saveEditing()}
                placeholder="FUNCTIONAL"
                disabled={saving}
              />
              {formError ? (
                <Typography tone="error" variant="small">
                  {formError}
                </Typography>
              ) : null}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  disabled={!editTitle.trim() || saving}
                  loading={saving}
                  onClick={() => void saveEditing()}
                >
                  Save
                </Button>
                <Button size="sm" variant="ghost" disabled={saving} onClick={cancelEditing}>
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <ViewField label="Title" value={item.title} large />
              <ViewField
                label="Description"
                value={item.description ?? ''}
                emptyText="No description"
              />
              <ViewField label="Priority" value={item.priority} />
              <ViewField label="Type" value={item.type} />
            </>
          )}

          <Typography weight="medium" variant="small">
            Item details
          </Typography>

          <div
            className="flex gap-1 border-b border-neutral-200"
            role="tablist"
            aria-label="Functional item details"
          >
            {(
              [
                { id: 'anchors', label: `Anchors (${anchors.length})` },
                { id: 'properties', label: `Fields (${properties.length})` },
                { id: 'rules', label: `Rules (${rules.length})` },
                { id: 'use-cases', label: `Use Cases (${functionUseCases.length})` },
              ] as const
            ).map((t) => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'border-b-2 px-3 py-2 text-sm transition-colors',
                    active
                      ? 'border-primary text-primary'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  )}
                >
                  {t.label}
                </button>
              )
            })}
          </div>

          {loading &&
          properties.length === 0 &&
          rules.length === 0 &&
          anchors.length === 0 ? (
            <PageSkeleton variant="list" />
          ) : null}
          {error ? <Typography tone="error">{error}</Typography> : null}
          {formError && !editing ? (
            <Typography tone="error" variant="small">
              {formError}
            </Typography>
          ) : null}

          {tab === 'anchors' ? (
            <Stack direction="vertical" spacing="sm">
              <Typography variant="small" tone="muted">
                Structure nodes linked to this FR. Manage links from the Links tab.
              </Typography>
              {anchors.length === 0 ? (
                <Typography tone="muted" variant="small">
                  No anchors yet.
                </Typography>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {anchors.map((a) => {
                    const resolved = nodeById.get(a.nodeId)
                    return (
                      <li key={a.id} className="py-2.5">
                        <Typography variant="small" weight="medium" className="truncate">
                          {a.nodeType}
                          {resolved ? ` · ${labelArchitectureNode(resolved)}` : ''}
                        </Typography>
                        {a.note ? (
                          <Typography variant="caption" tone="muted" className="truncate">
                            {a.note}
                          </Typography>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </Stack>
          ) : null}

          {tab === 'properties' ? (
            <FunctionalItemCustomPropertiesPanel
              properties={properties}
              loading={loading}
              onAdd={addProperty}
              onUpdate={updateProperty}
              onRemove={removeProperty}
            />
          ) : null}

          {tab === 'rules' ? (
            <ScreenStructureEditor
              columns={RULE_COLS}
              items={ruleItems}
              emptyLabel="No business rules yet."
              addTitle="Add rules"
              editTitle="Edit rules"
              itemLabel="rule"
              allowDelete={false}
              onCreate={async (values) => {
                await addRule({
                  code: values.code.trim(),
                  title: values.title.trim(),
                  severity:
                    (values.severity.trim().toUpperCase() as typeof BusinessRuleSeverity.Medium) ||
                    BusinessRuleSeverity.Medium,
                })
              }}
              onUpdate={async (id, values) => {
                await updateRule(id, {
                  title: values.title.trim(),
                  severity:
                    (values.severity.trim().toUpperCase() as typeof BusinessRuleSeverity.Medium) ||
                    BusinessRuleSeverity.Medium,
                })
              }}
              onDelete={removeRule}
            />
          ) : null}

          {tab === 'use-cases' ? (
            <Stack direction="vertical" spacing="sm">
              {functionUseCases.length === 0 ? (
                <Typography tone="muted" variant="small">
                  No use cases linked to this function yet.
                </Typography>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {functionUseCases.map((uc) => (
                    <li key={uc.id} className="py-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-neutral-400">{uc.key}</span>
                            <UseCaseStatusBadge status={uc.status} />
                            <UseCaseCompletenessBadge completenessStatus={uc.completenessStatus} />
                          </div>
                          <Typography variant="small" weight="medium" className="truncate">
                            {uc.name}
                          </Typography>
                          {uc.primaryActorName && (
                            <Typography variant="caption" tone="muted">
                              Actor: {uc.primaryActorName}
                            </Typography>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Stack>
          ) : null}
        </Stack>
      </div>
    </div>
  )
}
