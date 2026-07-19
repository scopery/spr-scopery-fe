'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import {
  TOOL_MUTATION_TYPE_OPTIONS,
  ToolMutationType,
  type ToolMutationType as MutationType,
} from '../../domain/enums/tool.enum'
import type { AiTool } from '../../domain/model/tool'
import { useToolMutations } from '../hooks/useToolMutations'

interface ToolFormModalProps {
  open: boolean
  onClose: () => void
  tool: AiTool | null
  onSaved: () => void
}

export function ToolFormModal({ open, onClose, tool, onSaved }: ToolFormModalProps) {
  const isEdit = tool != null
  const { saving, create, update } = useToolMutations(onSaved)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [mutationType, setMutationType] = useState<MutationType | ''>('')
  const [requiresHumanApproval, setRequiresHumanApproval] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCode(tool?.code ?? '')
    setName(tool?.name ?? '')
    setDescription(tool?.description ?? '')
    setCategory(tool?.category ?? '')
    setMutationType(tool?.mutationType ?? '')
    setRequiresHumanApproval(Boolean(tool?.requiresHumanApproval))
    setFieldError(null)
  }, [open, tool])

  const handleSubmit = async () => {
    setFieldError(null)
    if (!name.trim() || (!isEdit && !code.trim())) {
      setFieldError('Code and name are required')
      return
    }
    const body = {
      name: name.trim(),
      description: description.trim() || null,
      category: category.trim() || null,
      mutationType: (mutationType || null) as MutationType | null,
      requiresHumanApproval,
    }
    try {
      if (isEdit) {
        await update(tool.id, body)
      } else {
        await create({ code: code.trim(), ...body })
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
      title={isEdit ? 'Edit tool' : 'Create tool'}
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
      <Stack direction="vertical" spacing="sm">
        {!isEdit ? (
          <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
        ) : (
          <Typography variant="caption" tone="muted" className="font-mono">
            {tool.code}
          </Typography>
        )}
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="e.g. search, documents"
        />
        <div>
          <Typography variant="caption" className="mb-1 block">
            Mutation type
          </Typography>
          <Select
            value={mutationType}
            onValueChange={(v: string) => setMutationType((v || '') as MutationType | '')}
            options={[
              { value: '', label: '—' },
              ...TOOL_MUTATION_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
          {mutationType === ToolMutationType.Write ||
          mutationType === ToolMutationType.ReadWrite ? (
            <Typography variant="caption" tone="muted" className="mt-1 block">
              Write tools can change system state — require stronger review and confirm on debug
              execute.
            </Typography>
          ) : null}
        </div>
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="flex items-center gap-sm text-sm">
          <input
            type="checkbox"
            checked={requiresHumanApproval}
            onChange={(e) => setRequiresHumanApproval(e.target.checked)}
          />
          Requires human approval
        </label>
        {fieldError ? (
          <Typography tone="error" variant="small">
            {fieldError}
          </Typography>
        ) : null}
      </Stack>
    </Modal>
  )
}
