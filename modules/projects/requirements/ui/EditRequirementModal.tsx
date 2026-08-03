'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { Input, Modal, Select, Textarea, Typography } from '@/shared/ui'
import type { Requirement, UpdateRequirementPayload } from '../model/requirements'
import {
  isRequirementContentImmutable,
  normalizeRequirementStatus,
  REQUIREMENT_STATUS_EDIT_OPTIONS,
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
  /** Lifecycle target — applied via approve/reject/defer/implement endpoints. */
  status?: RequirementStatusValue
  /** When true, parent must not PATCH body fields (Approved/Archived are immutable). */
  contentLocked?: boolean
}

interface EditRequirementModalProps {
  open: boolean
  requirement: Requirement | null
  onClose: () => void
  onSubmit: (body: EditRequirementSubmit) => Promise<void>
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
}: EditRequirementModalProps) {
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [requirementType, setRequirementType] = useState('FUNCTIONAL')
  const [priority, setPriority] = useState('MEDIUM')
  const [status, setStatus] = useState<RequirementStatusValue>(RequirementStatus.Draft)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const contentLocked = isRequirementContentImmutable(requirement?.status)
  const isArchived = normalizeRequirementStatus(requirement?.status) === RequirementStatus.Archived

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
  }, [open, requirement])

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
    ? 'This requirement is archived. Change status (approve / reject / defer / implement) to restore it to the active register.'
    : contentLocked
      ? 'Approved and archived requirements are immutable. You can still change lifecycle status; code, title, type, priority, and description stay locked.'
      : 'Update code, title, type, priority, status, or description. Status changes use the lifecycle APIs (approve / reject / defer / implement). Use Archive to soft-delete.'

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
        <Textarea
          label="Description"
          fullWidth
          rows={4}
          resize="vertical"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the requirement…"
          disabled={contentLocked}
        />
        {formError ? (
          <Typography variant="small" tone="error">
            {formError}
          </Typography>
        ) : null}
      </div>
    </Modal>
  )
}
