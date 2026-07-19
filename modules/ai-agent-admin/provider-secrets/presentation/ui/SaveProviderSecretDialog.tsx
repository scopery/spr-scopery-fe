'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import {
  PROVIDER_SECRET_TYPE_OPTIONS,
  ProviderSecretType,
} from '../../domain/enums/provider-secret.enum'
import { isSecretValueWithinLimit } from '../../domain/rules/provider-secret.rules'
import { useProviderSecretMutations } from '../hooks/useProviderSecretMutations'

interface SaveProviderSecretDialogProps {
  open: boolean
  onClose: () => void
  providerId: string
  providerOptions: Array<{ value: string; label: string }>
  onSaved: () => void
}

/**
 * Raw secret lives only in local input state and is cleared after submit.
 * Never logged or written to storage.
 */
export function SaveProviderSecretDialog({
  open,
  onClose,
  providerId,
  providerOptions,
  onSaved,
}: SaveProviderSecretDialogProps) {
  const { saving, save } = useProviderSecretMutations(onSaved)
  const [selectedProviderId, setSelectedProviderId] = useState(providerId)
  const [secretType, setSecretType] = useState<ProviderSecretType>(ProviderSecretType.ApiKey)
  const [secretValue, setSecretValue] = useState('')
  const [description, setDescription] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSelectedProviderId(providerId)
    setSecretType(ProviderSecretType.ApiKey)
    setSecretValue('')
    setDescription('')
    setFieldError(null)
  }, [open, providerId])

  const clearSensitive = () => {
    setSecretValue('')
  }

  const handleClose = () => {
    clearSensitive()
    onClose()
  }

  const handleSubmit = async () => {
    setFieldError(null)
    if (!selectedProviderId) {
      setFieldError('Provider is required')
      return
    }
    if (!isSecretValueWithinLimit(secretValue)) {
      setFieldError('Secret value is required (max 5000 characters)')
      return
    }

    try {
      await save({
        providerId: selectedProviderId,
        secretType,
        secretValue,
        description: description.trim() || null,
      })
      clearSensitive()
      onClose()
    } catch (err) {
      clearSensitive()
      if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        setFieldError(err.problem.detail || 'Validation failed')
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Save provider secret"
      size="md"
      actions={[
        { label: 'Cancel', onClick: handleClose, variant: 'ghost' },
        {
          label: 'Save',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          disabled: saving,
        },
      ]}
    >
      <Stack direction="vertical" spacing="md">
        <Typography variant="caption" tone="muted">
          Raw secret is sent once and never shown again. Only a masked value is stored in UI
          state.
        </Typography>
        {fieldError ? (
          <Typography tone="error" variant="small">
            {fieldError}
          </Typography>
        ) : null}
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Provider
          </Typography>
          <Select
            value={selectedProviderId}
            onValueChange={setSelectedProviderId}
            options={providerOptions}
            placeholder="Select provider"
          />
        </div>
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Secret type
          </Typography>
          <Select
            value={secretType}
            onValueChange={(v: string) => setSecretType(v as ProviderSecretType)}
            options={PROVIDER_SECRET_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
        </div>
        <Input
          label="Secret value"
          type="password"
          autoComplete="new-password"
          value={secretValue}
          onChange={(e) => setSecretValue(e.target.value)}
          required
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
