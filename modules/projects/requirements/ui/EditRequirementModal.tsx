'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Textarea, Typography } from '@/shared/ui'
import type { Requirement, UpdateRequirementPayload } from '../model/requirements'
import {
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
}

interface EditRequirementModalProps {
  open: boolean
  requirement: Requirement | null
  onClose: () => void
  onSubmit: (body: EditRequirementSubmit) => Promise<void>
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
    if (!trimmedTitle) {
      setFormError('Title is required')
      return
    }
    if (!trimmedCode) {
      setFormError('Code is required')
      return
    }
    setFormError(null)
    setLoading(true)
    try {
      await onSubmit({
        title: trimmedTitle,
        code: trimmedCode,
        description: description.trim() || null,
        requirementType,
        priority,
        status,
      })
      onClose()
    } catch {
      // Parent shows toast; keep modal open
    } finally {
      setLoading(false)
    }
  }

  const statusOptions =
    status === RequirementStatus.Draft
      ? REQUIREMENT_STATUS_EDIT_OPTIONS
      : REQUIREMENT_STATUS_EDIT_OPTIONS.filter((o) => o.value !== RequirementStatus.Draft)

  return (
    <Modal
      open={open && Boolean(requirement)}
      onClose={onClose}
      title="Edit requirement"
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
          Update code, title, type, priority, status, or description. Status changes use the
          lifecycle APIs (approve / reject / defer / implement). Use Archive to soft-delete.
        </Typography>
        <Input
          label="Code"
          required
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="REQ-AUTH-01"
        />
        <Input
          label="Title"
          required
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="User authentication via SSO"
        />
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Type
          </Typography>
          <Select
            value={requirementType}
            onValueChange={setRequirementType}
            options={TYPE_OPTIONS}
          />
        </div>
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Priority
          </Typography>
          <Select value={priority} onValueChange={setPriority} options={PRIORITY_OPTIONS} />
        </div>
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Status
          </Typography>
          <Select
            value={status}
            onValueChange={(v) => setStatus(normalizeRequirementStatus(v))}
            options={statusOptions}
          />
        </div>
        <Textarea
          label="Description"
          fullWidth
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the requirement…"
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
