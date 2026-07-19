'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { isSecretValueWithinLimit } from '../../domain/rules/provider-secret.rules'
import type { AiProviderSecret } from '../../domain/model/provider-secret'
import { useProviderSecretMutations } from '../hooks/useProviderSecretMutations'

interface RotateProviderSecretDialogProps {
  open: boolean
  onClose: () => void
  secret: AiProviderSecret | null
  onSaved: () => void
}

export function RotateProviderSecretDialog({
  open,
  onClose,
  secret,
  onSaved,
}: RotateProviderSecretDialogProps) {
  const { saving, rotate } = useProviderSecretMutations(onSaved)
  const [secretValue, setSecretValue] = useState('')
  const [description, setDescription] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setSecretValue('')
    setDescription('')
    setConfirmed(false)
    setFieldError(null)
  }, [open, secret?.id])

  const clearSensitive = () => setSecretValue('')

  const handleClose = () => {
    clearSensitive()
    onClose()
  }

  const handleSubmit = async () => {
    if (!secret) return
    setFieldError(null)
    if (!confirmed) {
      setFieldError('Confirm rotation to continue')
      return
    }
    if (!isSecretValueWithinLimit(secretValue)) {
      setFieldError('New secret value is required (max 5000 characters)')
      return
    }

    try {
      await rotate(secret.id, {
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
      title="Rotate secret"
      size="md"
      actions={[
        { label: 'Cancel', onClick: handleClose, variant: 'ghost' },
        {
          label: 'Rotate',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          disabled: saving || !confirmed,
        },
      ]}
    >
      <Stack direction="vertical" spacing="md">
        <Typography variant="small">
          Creates a new secret version and deactivates the current one. The previous raw value
          cannot be recovered.
        </Typography>
        {secret ? (
          <Typography variant="caption" tone="muted" className="font-mono">
            Current: {secret.maskedValue} · {secret.keyVersion}
          </Typography>
        ) : null}
        {fieldError ? (
          <Typography tone="error" variant="small">
            {fieldError}
          </Typography>
        ) : null}
        <Input
          label="New secret value"
          type="password"
          autoComplete="new-password"
          value={secretValue}
          onChange={(e) => setSecretValue(e.target.value)}
          required
        />
        <Input
          label="Reason / description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label className="flex items-start gap-sm text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>I understand the previous secret will be deactivated immediately.</span>
        </label>
      </Stack>
    </Modal>
  )
}
