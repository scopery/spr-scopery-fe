'use client'

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useParams } from 'next/navigation'
import { Input, Modal, Select, Textarea, Typography } from '@/shared/ui'
import { AiTextareaEditToolbar } from '@/modules/ai-assistant'
import { useDebouncedLocalDraft } from '@/shared/lib/useDebouncedLocalDraft'
import { requirementDraftKey } from '@/shared/lib/localDraft'
import type { Requirement, UpdateRequirementPayload } from '../model/requirements'
import {
  isRequirementContentImmutable,
  normalizeRequirementStatus,
  REQUIREMENT_STATUS_EDIT_OPTIONS,
  RequirementImmutableMessages,
  RequirementStatus,
  type RequirementStatus as RequirementStatusValue,
} from '../model/requirement-status'

const TYPE_OPTIONS = [
  { value: 'FUNCTIONAL', label: 'Functional' },
  { value: 'NON_FUNCTIONAL', label: 'Non-functional' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'TECHNICAL', label: 'Technical' },
  { value: 'CONSTRAINT', label: 'Constraint' },
]

const PRIORITY_OPTIONS = [
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
]

export type EditRequirementSubmit = UpdateRequirementPayload & {
  status?: RequirementStatusValue
  contentLocked?: boolean
}

interface EditRequirementModalProps {
  open: boolean
  requirement: Requirement | null
  onClose: () => void
  onSubmit: (body: EditRequirementSubmit) => Promise<void>
  workspaceId?: string
}

type RequirementFormDraft = {
  title: string
  code: string
  description: string
  requirementType: string
  priority: string
  status: RequirementStatusValue
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <Typography variant="small" weight="medium" className="mb-1">
      {children}
    </Typography>
  )
}

function toFormRequirementType(requirement: Requirement): string {
  const raw = (
    requirement.requirementType ??
    requirement.req_type ??
    requirement.type ??
    ''
  ).toUpperCase()
  switch (raw) {
    case 'FR':
    case 'FUNCTIONAL':
      return 'FUNCTIONAL'
    case 'NFR':
    case 'NON_FUNCTIONAL':
      return 'NON_FUNCTIONAL'
    case 'BO':
    case 'BR':
    case 'BUSINESS':
      return 'BUSINESS'
    case 'TECHNICAL':
      return 'TECHNICAL'
    case 'CONSTRAINT':
      return 'CONSTRAINT'
    default:
      return TYPE_OPTIONS.some((o) => o.value === raw) ? raw : 'FUNCTIONAL'
  }
}

function toFormPriority(raw: string | null | undefined): string {
  const v = (raw ?? 'MEDIUM').toUpperCase()
  if (v === 'CRITICAL' || v === 'P0' || v === 'P1') return 'HIGH'
  if (PRIORITY_OPTIONS.some((o) => o.value === v)) return v
  return 'MEDIUM'
}

export function EditRequirementModal({
  open,
  requirement,
  onClose,
  onSubmit,
  workspaceId: workspaceIdProp,
}: EditRequirementModalProps) {
  const params = useParams<{ workspaceId?: string; projectId?: string }>()
  const workspaceId = workspaceIdProp ?? params.workspaceId
  const projectId = params.projectId ?? requirement?.project_id ?? ''

  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [requirementType, setRequirementType] = useState('FUNCTIONAL')
  const [priority, setPriority] = useState('MEDIUM')
  const [status, setStatus] = useState<RequirementStatusValue>(RequirementStatus.Draft)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)

  const contentLocked = isRequirementContentImmutable(requirement?.status)
  const isArchived = normalizeRequirementStatus(requirement?.status) === RequirementStatus.Archived

  const draftKey =
    open && requirement && projectId
      ? requirementDraftKey(projectId, requirement.id)
      : null

  const draftData = useMemo<RequirementFormDraft>(
    () => ({ title, code, description, requirementType, priority, status }),
    [title, code, description, requirementType, priority, status]
  )

  const { draftHint, clearDraft } = useDebouncedLocalDraft<RequirementFormDraft>({
    storageKey: draftKey,
    data: draftData,
    enabled: open && Boolean(requirement) && !contentLocked,
    debounceMs: 600,
    shouldHydrate: (draft) => {
      if (!requirement) return false
      return (
        draft.title !== (requirement.title ?? '') ||
        draft.code !== (requirement.code ?? '') ||
        draft.description !== (requirement.description ?? '') ||
        draft.requirementType !== toFormRequirementType(requirement) ||
        draft.priority !== toFormPriority(requirement.priority)
      )
    },
    onHydrate: (draft) => {
      setTitle(draft.title)
      setCode(draft.code)
      setDescription(draft.description)
      setRequirementType(draft.requirementType)
      setPriority(draft.priority)
      setStatus(normalizeRequirementStatus(draft.status))
    },
  })

  useEffect(() => {
    if (!open || !requirement) return
    setTitle(requirement.title ?? '')
    setCode(requirement.code ?? '')
    setDescription(requirement.description ?? '')
    setRequirementType(toFormRequirementType(requirement))
    setPriority(toFormPriority(requirement.priority))
    setStatus(normalizeRequirementStatus(requirement.status))
    setFormError(null)
    setLoading(false)
    // Only re-seed when opening / switching requirement — draft hydrate runs after.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: avoid wiping in-progress edits on parent refetch
  }, [open, requirement?.id])

  const handleSubmit = async () => {
    if (!requirement) return
    const trimmedTitle = title.trim()
    const trimmedCode = code.trim()
    if (!contentLocked) {
      if (!trimmedTitle) {
        setFormError('Title is required')
        return
      }
      if (!trimmedCode) {
        setFormError('Code is required')
        return
      }
    }
    const currentStatus = normalizeRequirementStatus(requirement.status)
    if (!status) {
      setFormError('Status is required')
      return
    }
    if (contentLocked && status === currentStatus) {
      setFormError('Content is locked after approval. Change status to continue, or cancel.')
      return
    }
    setFormError(null)
    setLoading(true)
    try {
      if (contentLocked) {
        await onSubmit({ status, contentLocked: true })
      } else {
        await onSubmit({
          title: trimmedTitle,
          code: trimmedCode,
          description: description.trim() || null,
          requirementType,
          priority,
          status,
          contentLocked: false,
        })
      }
      clearDraft()
      onClose()
    } catch {
      // Parent shows toast; keep modal open
    } finally {
      setLoading(false)
    }
  }

  const statusOptions = isArchived
    ? REQUIREMENT_STATUS_EDIT_OPTIONS.filter((o) => o.value !== RequirementStatus.Draft).concat({
        value: RequirementStatus.Archived,
        label: 'Archived',
      })
    : normalizeRequirementStatus(requirement?.status) === RequirementStatus.Draft
      ? REQUIREMENT_STATUS_EDIT_OPTIONS
      : REQUIREMENT_STATUS_EDIT_OPTIONS.filter((o) => o.value !== RequirementStatus.Draft)

  const helperText = isArchived
    ? 'This requirement is archived (hidden from the active register). You can still edit fields or change status to restore it.'
    : contentLocked
      ? RequirementImmutableMessages.CONTENT_LOCKED
      : 'Update fields below. Select text in Description and use AI to rewrite. Drafts autosave in this browser.'

  return (
    <Modal
      open={open && Boolean(requirement)}
      onClose={onClose}
      title={contentLocked ? 'Update status' : 'Edit requirement'}
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Save',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
        },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          {helperText}
        </Typography>
        {draftHint && !contentLocked ? (
          <Typography variant="caption" tone="muted">
            {draftHint}
          </Typography>
        ) : null}
        <Input
          label="Code"
          required
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="REQ-AUTH-01"
          disabled={contentLocked}
        />
        <Input
          label="Title"
          required
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="User authentication via SSO"
          disabled={contentLocked}
        />
        <div>
          <FieldLabel>Type</FieldLabel>
          <Select
            value={requirementType}
            onValueChange={setRequirementType}
            options={TYPE_OPTIONS}
            placeholder="Select type"
            disabled={contentLocked}
          />
        </div>
        <div>
          <FieldLabel>Priority</FieldLabel>
          <Select
            value={priority}
            onValueChange={setPriority}
            options={PRIORITY_OPTIONS}
            placeholder="Select priority"
            disabled={contentLocked}
          />
        </div>
        <div>
          <FieldLabel>Status</FieldLabel>
          <Select
            value={status}
            onValueChange={(v: string) => setStatus(normalizeRequirementStatus(v))}
            options={statusOptions}
            placeholder="Select status"
          />
        </div>
        <div className="relative">
          <Textarea
            ref={descRef}
            label="Description"
            fullWidth
            rows={5}
            resize="vertical"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the requirement… Select text for AI edit."
            disabled={contentLocked}
          />
          {!contentLocked ? (
            <AiTextareaEditToolbar
              textareaRef={descRef}
              value={description}
              workspaceId={workspaceId}
              documentKind="requirement"
              onApply={(next, selection) => {
                setDescription(next)
                requestAnimationFrame(() => {
                  const el = descRef.current
                  if (!el) return
                  el.focus()
                  el.setSelectionRange(selection.start, selection.end)
                })
              }}
            />
          ) : null}
        </div>
        {formError ? (
          <Typography variant="small" tone="error">
            {formError}
          </Typography>
        ) : null}
      </div>
    </Modal>
  )
}
