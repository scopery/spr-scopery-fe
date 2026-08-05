'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Input, Modal, Select, Textarea, Typography } from '@/shared/ui'
import { AiTextareaEditToolbar } from '@/modules/ai-assistant'
import { useDebouncedLocalDraft } from '@/shared/lib/useDebouncedLocalDraft'
import { requirementDraftKey } from '@/shared/lib/localDraft'
import type { CreateRequirementPayload } from '../model/requirements'

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

interface CreateRequirementModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateRequirementPayload) => Promise<void>
  workspaceId?: string
  projectId?: string
}

type CreateDraft = {
  title: string
  code: string
  description: string
  requirementType: string
  priority: string
}

function autoCode(title: string, type: string) {
  const prefix =
    type === 'NON_FUNCTIONAL'
      ? 'NFR'
      : type === 'BUSINESS'
        ? 'BUS'
        : type === 'TECHNICAL'
          ? 'TEC'
          : type === 'CONSTRAINT'
            ? 'CON'
            : 'REQ'
  const slug = title
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 16)
  return `${prefix}-${slug || 'NEW'}`
}

export function CreateRequirementModal({
  open,
  onClose,
  onSubmit,
  workspaceId: workspaceIdProp,
  projectId: projectIdProp,
}: CreateRequirementModalProps) {
  const params = useParams<{ workspaceId?: string; projectId?: string }>()
  const workspaceId = workspaceIdProp ?? params.workspaceId
  const projectId = projectIdProp ?? params.projectId ?? ''

  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [requirementType, setRequirementType] = useState('FUNCTIONAL')
  const [priority, setPriority] = useState('MEDIUM')
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)

  const draftKey = open && projectId ? requirementDraftKey(projectId, 'new') : null
  const draftData = useMemo<CreateDraft>(
    () => ({ title, code, description, requirementType, priority }),
    [title, code, description, requirementType, priority]
  )

  const { draftHint, clearDraft } = useDebouncedLocalDraft<CreateDraft>({
    storageKey: draftKey,
    data: draftData,
    enabled: open,
    debounceMs: 600,
    shouldHydrate: (draft) =>
      Boolean(draft.title.trim() || draft.code.trim() || draft.description.trim()),
    onHydrate: (draft) => {
      setTitle(draft.title)
      setCode(draft.code)
      setDescription(draft.description)
      setRequirementType(draft.requirementType || 'FUNCTIONAL')
      setPriority(draft.priority || 'MEDIUM')
    },
  })

  useEffect(() => {
    if (!open) return
    setTitle('')
    setCode('')
    setDescription('')
    setRequirementType('FUNCTIONAL')
    setPriority('MEDIUM')
    setFormError(null)
  }, [open])

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setFormError('Title is required')
      return
    }
    setFormError(null)
    setLoading(true)
    try {
      await onSubmit({
        title: trimmedTitle,
        code: code.trim() || autoCode(trimmedTitle, requirementType),
        description: description.trim() || null,
        requirementType,
        priority,
      })
      clearDraft()
      onClose()
    } catch {
      // Parent shows toast; keep modal open
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New requirement"
      size="md"
      actions={[
        { label: 'Close', onClick: onClose, variant: 'ghost' },
        {
          label: 'Create',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
        },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Creates a project requirement in the register. Select description text and use AI to
          refine wording. Drafts autosave in this browser if you leave mid-edit.
        </Typography>
        {draftHint ? (
          <Typography variant="caption" tone="muted">
            {draftHint}
          </Typography>
        ) : null}
        <Input
          label="Title"
          required
          fullWidth
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="User authentication via SSO"
        />
        <Input
          label="Code"
          fullWidth
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Leave blank to auto-generate"
          helperText="Optional. Example: REQ-AUTH-01"
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
          />
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
