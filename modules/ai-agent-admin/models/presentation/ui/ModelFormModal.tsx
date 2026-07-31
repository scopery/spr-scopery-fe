'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { MODEL_TYPE_OPTIONS, ModelType } from '../../domain/enums/model.enum'
import type { AiModel } from '../../domain/model/ai-model'
import { useModelMutations } from '../hooks/useModelMutations'

interface ModelFormModalProps {
  open: boolean
  onClose: () => void
  model: AiModel | null
  providerOptions: Array<{ value: string; label: string }>
  defaultProviderId?: string
  onSaved: () => void
}

export function ModelFormModal({
  open,
  onClose,
  model,
  providerOptions,
  defaultProviderId = '',
  onSaved,
}: ModelFormModalProps) {
  const isEdit = model != null
  const { saving, create, update } = useModelMutations(onSaved)
  const [providerId, setProviderId] = useState(defaultProviderId)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [providerModelId, setProviderModelId] = useState('')
  const [type, setType] = useState<ModelType>(ModelType.Chat)
  const [description, setDescription] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setProviderId(model?.providerId ?? defaultProviderId)
    setName(model?.name ?? '')
    setCode(model?.code ?? '')
    setProviderModelId(model?.providerModelId ?? '')
    setType(model?.type ?? ModelType.Chat)
    setDescription(model?.description ?? '')
    setFieldError(null)
  }, [open, model, defaultProviderId])

  const handleSubmit = async () => {
    setFieldError(null)
    if (!isEdit && !providerId) {
      setFieldError('Provider is required')
      return
    }
    if (!name.trim() || (!isEdit && !code.trim())) {
      setFieldError('Name and code are required')
      return
    }
    try {
      if (isEdit && model) {
        await update(model.id, {
          name: name.trim(),
          type,
          providerModelId: providerModelId.trim() || null,
          description: description.trim() || null,
        })
      } else {
        await create({
          providerId,
          name: name.trim(),
          code: code.trim(),
          type,
          providerModelId: providerModelId.trim() || null,
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
      title={isEdit ? 'Edit model' : 'Create model'}
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
        {fieldError ? (
          <Typography tone="error" variant="small">
            {fieldError}
          </Typography>
        ) : null}
        {!isEdit ? (
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Provider
            </Typography>
            <Select
              value={providerId}
              onValueChange={setProviderId}
              options={providerOptions}
              placeholder="Select provider"
            />
          </div>
        ) : null}
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        {!isEdit ? (
          <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
        ) : (
          <Typography className="font-mono text-sm">{model?.code}</Typography>
        )}
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Type
          </Typography>
          <Select
            value={type}
            onValueChange={(v: string) => setType(v as ModelType)}
            options={MODEL_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
        <Input
          label="Provider model key"
          value={providerModelId}
          onChange={(e) => setProviderModelId(e.target.value)}
          placeholder="e.g. gpt-4o"
        />
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Stack>
    </Modal>
  )
}
