'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button, ConfirmDialog, Input, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { AiTextareaEditToolbar } from '@/modules/ai-assistant'
import { ROUTES } from '@/constants/routes'
import { ApiError } from '@/shared/lib/api-types'
import { functionalItemDraftKey } from '@/shared/lib/localDraft'
import { useDebouncedLocalDraft } from '@/shared/lib/useDebouncedLocalDraft'
import { cn } from '@/utils/cn'
import {
  BusinessRuleSeverity,
  type FunctionalItem,
  type UpdateFunctionalItemBody,
} from '../model/functional-catalog'
import * as useCaseApi from '../api/use-case.api'
import { useFunctionalItemDetail } from '../hooks/useFunctionalItemDetail'
import { useArchitectureNodeCatalog } from '../hooks/useArchitectureNodeCatalog'
import { labelArchitectureNode } from '../model/anchor-mapping'
import { ScreenStructureEditor } from './ScreenStructureEditor'
import { useUseCaseCatalog } from '../hooks/useUseCaseCatalog'
import { UseCaseStatusBadge } from './UseCaseStatusBadge'
import { UseCaseCompletenessBadge } from './UseCaseCompletenessBadge'
import { MultiSelectLinkModal } from './MultiSelectLinkModal'

type DetailTab = 'acceptance' | 'anchors' | 'rules' | 'use-cases'

interface FunctionalItemDetailPanelProps {
  projectId: string
  workspaceId: string
  item: FunctionalItem
  preferredApplicationId?: string | null
  defaultTab?: DetailTab
  isLocked?: boolean
  onClose?: () => void
  onSave?: (payload: UpdateFunctionalItemBody) => Promise<void>
  onDelete?: () => Promise<void>
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

type FnEditDraft = {
  title: string
  description: string
  priority: string
  type: string
}

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
    key: 'description',
    label: 'Description',
    placeholder: 'Optional detail',
  },
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
  isLocked = false,
  onClose,
  onSave,
  onDelete,
}: FunctionalItemDetailPanelProps) {
  const {
    rules,
    anchors,
    loading,
    error,
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const descRef = useRef<HTMLTextAreaElement>(null)

  const draftKey = editing ? functionalItemDraftKey(projectId, item.id) : null
  const draftData = useMemo<FnEditDraft>(
    () => ({
      title: editTitle,
      description: editDescription,
      priority: editPriority,
      type: editType,
    }),
    [editTitle, editDescription, editPriority, editType]
  )

  const { draftHint, clearDraft } = useDebouncedLocalDraft<FnEditDraft>({
    storageKey: draftKey,
    data: draftData,
    enabled: editing,
    debounceMs: 600,
    shouldHydrate: (draft) =>
      draft.title !== item.title ||
      draft.description !== (item.description ?? '') ||
      draft.priority !== item.priority ||
      draft.type !== item.type,
    onHydrate: (draft) => {
      setEditTitle(draft.title)
      setEditDescription(draft.description)
      setEditPriority(draft.priority)
      setEditType(draft.type)
    },
  })

  const { nodeById } = useArchitectureNodeCatalog(
    workspaceId,
    preferredApplicationId || null
  )

  const [addUseCasesOpen, setAddUseCasesOpen] = useState(false)
  const [linkingUseCases, setLinkingUseCases] = useState(false)

  const {
    useCases: functionUseCases,
    loading: linkedUseCasesLoading,
    refetch: refetchLinkedUseCases,
  } = useUseCaseCatalog(tab === 'use-cases' ? projectId : null, tab === 'use-cases' ? item.id : null)

  const { useCases: allUseCases, loading: allUseCasesLoading } = useUseCaseCatalog(
    addUseCasesOpen ? projectId : null
  )

  const [editAcceptance, setEditAcceptance] = useState<string[]>(
    () => item.acceptanceCriteria ?? []
  )
  const [acceptanceDirty, setAcceptanceDirty] = useState(false)
  const [savingAcceptance, setSavingAcceptance] = useState(false)
  const [editingAcceptance, setEditingAcceptance] = useState(false)

  useEffect(() => {
    setTab(defaultTab)
    setEditing(false)
    setFormError(null)
    setConfirmDelete(false)
    setEditTitle(item.title)
    setEditDescription(item.description ?? '')
    setEditPriority(item.priority)
    setEditType(item.type)
    setEditAcceptance(item.acceptanceCriteria ?? [])
    setAcceptanceDirty(false)
    setEditingAcceptance(false)
    setAddUseCasesOpen(false)
  }, [
    item.id,
    item.title,
    item.description,
    item.priority,
    item.type,
    item.acceptanceCriteria,
    defaultTab,
  ])

  const canEdit = Boolean(onSave) && !isLocked

  const linkedUseCaseIds = useMemo(
    () => new Set(functionUseCases.map((uc) => uc.id)),
    [functionUseCases]
  )

  const useCaseLinkOptions = useMemo(
    () =>
      allUseCases.map((uc) => ({
        id: uc.id,
        code: uc.key,
        label: uc.name,
        meta: uc.primaryFunctionName
          ? `Primary: ${uc.primaryFunctionName}`
          : 'No primary Function yet',
        disabled: linkedUseCaseIds.has(uc.id),
      })),
    [allUseCases, linkedUseCaseIds]
  )

  const linkUseCases = useCallback(
    async (ids: string[]) => {
      setLinkingUseCases(true)
      try {
        const toLink = ids.filter((id) => !linkedUseCaseIds.has(id))
        if (toLink.length === 0) return
        // Link UC ↔ Function via supporting-functions. Primary Function is set only from Use Case detail.
        await Promise.all(
          toLink.map((id) =>
            useCaseApi.addSupportingFunction(projectId, id, { functionId: item.id })
          )
        )
        toast.success(
          `${toLink.length} Use Case${toLink.length === 1 ? '' : 's'} linked`
        )
        await refetchLinkedUseCases()
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to link Use Cases')
        throw err
      } finally {
        setLinkingUseCases(false)
      }
    },
    [item.id, linkedUseCaseIds, projectId, refetchLinkedUseCases]
  )

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
        status: item.status,
        acceptanceCriteria: item.acceptanceCriteria ?? null,
      })
      clearDraft()
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
  }, [clearDraft, editDescription, editPriority, editTitle, editType, item, onSave])

  const handleConfirmDelete = useCallback(async () => {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete()
      setConfirmDelete(false)
      toast.success('Function deleted')
      onClose?.()
    } catch (err: unknown) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to delete function'
      )
    } finally {
      setDeleting(false)
    }
  }, [onClose, onDelete])

  const saveAcceptance = useCallback(async () => {
    if (!onSave) return
    const next = editAcceptance.map((line) => line.trim()).filter(Boolean)
    setSavingAcceptance(true)
    setFormError(null)
    try {
      await onSave({
        title: item.title,
        description: item.description ?? null,
        priority: item.priority,
        type: item.type,
        status: item.status,
        acceptanceCriteria: next.length ? next : [],
      })
      setEditAcceptance(next)
      setAcceptanceDirty(false)
    } catch (err: unknown) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Failed to save acceptance criteria'
      )
    } finally {
      setSavingAcceptance(false)
    }
  }, [editAcceptance, item, onSave])

  const ruleItems = useMemo(
    () =>
      rules.map((r) => ({
        id: r.id,
        values: {
          code: r.code,
          title: r.title,
          description: r.description ?? '',
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
          {onDelete && !editing && !isLocked ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="inline-flex h-8 w-8 items-center justify-center text-neutral-500 hover:text-red-600"
              aria-label="Delete function"
              title="Delete function"
              disabled={deleting}
            >
              <Trash2 size={16} strokeWidth={1.75} />
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
              <div className="relative min-w-0">
                <label className="block min-w-0">
                  <span className="mb-1 block text-xs text-neutral-500">Description</span>
                  <textarea
                    ref={descRef}
                    value={editDescription}
                    disabled={saving}
                    placeholder="Optional — select text for AI edit"
                    aria-label="Description"
                    rows={5}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className={cn(
                      'w-full min-w-0 resize-y border-0 border-b border-dashed border-neutral-300 bg-transparent px-0 py-1.5',
                      'text-sm text-neutral-900 outline-none transition-colors',
                      'placeholder:text-neutral-400',
                      'hover:border-neutral-400 focus:border-neutral-800 focus:border-solid',
                      'disabled:cursor-default disabled:opacity-60'
                    )}
                  />
                </label>
                <AiTextareaEditToolbar
                  textareaRef={descRef}
                  value={editDescription}
                  workspaceId={workspaceId}
                  documentKind="functional_item"
                  disabled={saving}
                  onApply={(next, selection) => {
                    setEditDescription(next)
                    requestAnimationFrame(() => {
                      const el = descRef.current
                      if (!el) return
                      el.focus()
                      el.setSelectionRange(selection.start, selection.end)
                    })
                  }}
                />
              </div>
              {draftHint ? (
                <Typography variant="caption" tone="muted">
                  {draftHint}
                </Typography>
              ) : null}
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
                {
                  id: 'acceptance',
                  label: `Acceptance (${(item.acceptanceCriteria ?? []).length})`,
                },
                { id: 'anchors', label: `Anchors (${anchors.length})` },
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

          {loading && rules.length === 0 && anchors.length === 0 ? (
            <PageSkeleton variant="list" />
          ) : null}
          {error ? <Typography tone="error">{error}</Typography> : null}
          {formError && !editing ? (
            <Typography tone="error" variant="small">
              {formError}
            </Typography>
          ) : null}

          {tab === 'acceptance' ? (
            <Stack direction="vertical" spacing="sm">
              <div className="flex items-start justify-between gap-2">
                <Typography variant="small" tone="muted">
                  Acceptance criteria for this Function.
                </Typography>
                {canEdit ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={savingAcceptance}
                    onClick={() => {
                      if (editingAcceptance) {
                        setEditAcceptance(item.acceptanceCriteria ?? [])
                        setAcceptanceDirty(false)
                      }
                      setEditingAcceptance((v) => !v)
                    }}
                  >
                    {editingAcceptance ? 'Done' : 'Edit'}
                  </Button>
                ) : null}
              </div>
              {!editingAcceptance ? (
                (item.acceptanceCriteria ?? []).length === 0 ? (
                  <Typography tone="muted" variant="small">
                    No acceptance criteria yet.
                  </Typography>
                ) : (
                  <ol className="list-decimal space-y-3 pl-5">
                    {(item.acceptanceCriteria ?? []).map((line, index) => (
                      <li key={`ac-view-${index}`} className="text-sm text-neutral-800">
                        <p className="whitespace-pre-wrap break-words">
                          {line.trim() || '—'}
                        </p>
                      </li>
                    ))}
                  </ol>
                )
              ) : (
                <>
                  {editAcceptance.length === 0 ? (
                    <Typography tone="muted" variant="small">
                      No acceptance criteria yet.
                    </Typography>
                  ) : null}
                  <div className="space-y-2">
                    {editAcceptance.map((line, index) => (
                      <div key={`ac-${index}`} className="flex items-start gap-2">
                        <Input
                          size="sm"
                          fullWidth
                          value={line}
                          disabled={savingAcceptance}
                          placeholder="Acceptance criterion"
                          aria-label={`Acceptance criterion ${index + 1}`}
                          onChange={(e) => {
                            const next = [...editAcceptance]
                            next[index] = e.target.value
                            setEditAcceptance(next)
                            setAcceptanceDirty(true)
                          }}
                        />
                        <button
                          type="button"
                          className="mt-1 text-neutral-400 hover:text-red-600 disabled:opacity-40"
                          disabled={savingAcceptance}
                          aria-label={`Remove criterion ${index + 1}`}
                          onClick={() => {
                            setEditAcceptance((prev) => prev.filter((_, i) => i !== index))
                            setAcceptanceDirty(true)
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={savingAcceptance}
                      onClick={() => {
                        setEditAcceptance((prev) => [...prev, ''])
                        setAcceptanceDirty(true)
                      }}
                    >
                      <Plus size={14} className="mr-1 inline" />
                      Add criterion
                    </Button>
                    <Button
                      size="sm"
                      disabled={!acceptanceDirty || savingAcceptance}
                      loading={savingAcceptance}
                      onClick={() => void saveAcceptance()}
                    >
                      Save acceptance
                    </Button>
                    {acceptanceDirty ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={savingAcceptance}
                        onClick={() => {
                          setEditAcceptance(item.acceptanceCriteria ?? [])
                          setAcceptanceDirty(false)
                          setFormError(null)
                        }}
                      >
                        Reset
                      </Button>
                    ) : null}
                  </div>
                </>
              )}
            </Stack>
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
                        <Typography variant="small" weight="medium" className="whitespace-pre-wrap break-words">
                          {a.nodeType}
                          {resolved ? ` · ${labelArchitectureNode(resolved)}` : ''}
                        </Typography>
                        {a.note ? (
                          <Typography
                            variant="caption"
                            tone="muted"
                            className="mt-0.5 block whitespace-pre-wrap break-words"
                          >
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

          {tab === 'rules' ? (
            <ScreenStructureEditor
              columns={RULE_COLS}
              items={ruleItems}
              emptyLabel="No business rules yet."
              addTitle="Add rules"
              editTitle="Edit rules"
              itemLabel="rule"
              onCreate={async (values) => {
                await addRule({
                  code: values.code.trim(),
                  title: values.title.trim(),
                  description: values.description.trim() || null,
                  severity:
                    (values.severity.trim().toUpperCase() as typeof BusinessRuleSeverity.Medium) ||
                    BusinessRuleSeverity.Medium,
                })
              }}
              onUpdate={async (id, values) => {
                await updateRule(id, {
                  title: values.title.trim(),
                  description: values.description.trim() || null,
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
              <div className="flex items-start justify-between gap-2">
                <Typography variant="small" tone="muted">
                  Use Cases linked to this Function.
                </Typography>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Plus size={14} />}
                  disabled={linkingUseCases}
                  onClick={() => setAddUseCasesOpen(true)}
                >
                  Add
                </Button>
              </div>
              {linkedUseCasesLoading && functionUseCases.length === 0 ? (
                <Typography tone="muted" variant="small">
                  Loading…
                </Typography>
              ) : functionUseCases.length === 0 ? (
                <Typography tone="muted" variant="small">
                  No use cases linked to this function yet.
                </Typography>
              ) : (
                <ul className="divide-y divide-neutral-100">
                  {functionUseCases.map((uc) => (
                    <li key={uc.id} className="py-2.5">
                      <Link
                        href={`${ROUTES.workspace.projectUseCases(workspaceId, projectId)}?useCaseId=${encodeURIComponent(uc.id)}`}
                        className="block min-w-0 rounded-sm hover:bg-neutral-50"
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-xs text-neutral-400">{uc.key}</span>
                          <UseCaseStatusBadge status={uc.status} />
                          <UseCaseCompletenessBadge completenessStatus={uc.completenessStatus} />
                        </div>
                        <Typography
                          variant="small"
                          weight="medium"
                          className="whitespace-pre-wrap break-words text-primary underline-offset-2 hover:underline"
                        >
                          {uc.name}
                        </Typography>
                        {uc.primaryActorName && (
                          <Typography variant="caption" tone="muted">
                            Actor: {uc.primaryActorName}
                          </Typography>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <MultiSelectLinkModal
                open={addUseCasesOpen}
                onClose={() => setAddUseCasesOpen(false)}
                title="Add Use Cases"
                searchPlaceholder="Search use cases…"
                options={useCaseLinkOptions}
                loading={allUseCasesLoading}
                saving={linkingUseCases}
                emptyMessage="No use cases in this project yet. Create them from the Use Case catalog."
                confirmLabel="Add selected"
                onConfirm={linkUseCases}
              />
            </Stack>
          ) : null}
        </Stack>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => {
          if (!deleting) setConfirmDelete(false)
        }}
        title="Delete function"
        message={`Delete "${item.code} — ${item.title}"? This cannot be undone. Linked requirements and use cases may be affected.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
