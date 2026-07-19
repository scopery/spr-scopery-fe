'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import {
  PROVIDER_TYPE_OPTIONS,
  ProviderType,
} from '../../domain/enums/provider.enum'
import {
  isValidApiBaseUrl,
  normalizeProviderCode,
} from '../../domain/rules/provider.rules'
import type { AiProvider } from '../../domain/model/provider'
import { useProviderMutations } from '../hooks/useProviderMutations'

interface ProviderFormModalProps {
  open: boolean
  onClose: () => void
  provider: AiProvider | null
  onSaved: () => void
}

export function ProviderFormModal({
  open,
  onClose,
  provider,
  onSaved,
}: ProviderFormModalProps) {
  const isEdit = provider != null
  const { saving, create, update } = useProviderMutations(onSaved)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [type, setType] = useState<ProviderType>(ProviderType.Llm)
  const [apiBaseUrl, setApiBaseUrl] = useState('')
  const [description, setDescription] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(provider?.name ?? '')
    setCode(provider?.code ?? '')
    setType(provider?.type ?? ProviderType.Llm)
    setApiBaseUrl(provider?.apiBaseUrl ?? '')
    setDescription(provider?.description ?? '')
    setFieldError(null)
  }, [open, provider])

  const handleSubmit = async () => {
    setFieldError(null)
    if (!name.trim()) {
      setFieldError('Name is required')
      return
    }
    if (!isEdit && !code.trim()) {
      setFieldError('Code is required')
      return
    }
    if (!isValidApiBaseUrl(apiBaseUrl)) {
      setFieldError('API base URL must be http(s)')
      return
    }

    const url = apiBaseUrl.trim() || null
    const desc = description.trim() || null

    try {
      if (isEdit && provider) {
        await update(provider.id, {
          name: name.trim(),
          type,
          apiBaseUrl: url,
          description: desc,
        })
      } else {
        await create({
          name: name.trim(),
          code: normalizeProviderCode(code),
          type,
          apiBaseUrl: url,
          description: desc,
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
      title={isEdit ? 'Edit provider' : 'Create provider'}
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
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        {!isEdit ? (
          <Input
            label="Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            helperText="Unique code (normalized to UPPER_SNAKE)"
            required
          />
        ) : (
          <div>
            <Typography variant="caption" tone="muted">
              Code
            </Typography>
            <Typography className="mt-1 font-mono">{provider?.code}</Typography>
          </div>
        )}
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Type
          </Typography>
          <Select
            value={type}
            onValueChange={(v: string) => setType(v as ProviderType)}
            options={PROVIDER_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
        <Input
          label="API base URL"
          value={apiBaseUrl}
          onChange={(e) => setApiBaseUrl(e.target.value)}
          placeholder="https://api.example.com"
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
