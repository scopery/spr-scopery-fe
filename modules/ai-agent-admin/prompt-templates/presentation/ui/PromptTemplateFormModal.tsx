'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import type { AiPromptTemplate } from '../../domain/model/prompt-template'
import { usePromptTemplateMutations } from '../hooks/usePromptMutations'

interface PromptTemplateFormModalProps {
  open: boolean
  onClose: () => void
  template: AiPromptTemplate | null
  agentOptions: Array<{ value: string; label: string }>
  defaultAgentId?: string
  onSaved: () => void
}

/** Metadata only — no prompt content field (content lives on versions). */
export function PromptTemplateFormModal({
  open,
  onClose,
  template,
  agentOptions,
  defaultAgentId = '',
  onSaved,
}: PromptTemplateFormModalProps) {
  const isEdit = template != null
  const { saving, create, update } = usePromptTemplateMutations(onSaved)
  const [agentId, setAgentId] = useState(defaultAgentId)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setAgentId(template?.agentId ?? defaultAgentId)
    setName(template?.name ?? '')
    setCode(template?.code ?? '')
    setDescription(template?.description ?? '')
    setFieldError(null)
  }, [open, template, defaultAgentId])

  const handleSubmit = async () => {
    setFieldError(null)
    if (!name.trim() || (!isEdit && (!code.trim() || !agentId))) {
      setFieldError('Agent, name, and code are required')
      return
    }
    try {
      if (isEdit && template) {
        await update(template.id, {
          name: name.trim(),
          description: description.trim() || null,
        })
      } else {
        await create({
          agentId,
          name: name.trim(),
          code: code.trim(),
          description: description.trim() || null,
        })
      }
      onClose()
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        setFieldError(err.problem.detail || 'Validation failed')
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit template' : 'Create template'}
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: isEdit ? 'Save' : 'Create',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          disabled: saving,
        },
      ]}
    >
      <Stack direction="vertical" spacing="md">
        <Typography variant="caption" tone="muted">
          Template is identity only — prompt content is managed in versions.
        </Typography>
        {fieldError ? (
          <Typography tone="error" variant="small">
            {fieldError}
          </Typography>
        ) : null}
        {!isEdit ? (
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Agent
            </Typography>
            <Select
              value={agentId}
              onValueChange={setAgentId}
              options={agentOptions}
              placeholder="Select agent"
            />
          </div>
        ) : null}
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        {!isEdit ? (
          <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
        ) : (
          <Typography className="font-mono text-sm">{template?.code}</Typography>
        )}
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Stack>
    </Modal>
  )
}
