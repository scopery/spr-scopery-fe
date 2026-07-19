'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import * as secretsApi from '../../infrastructure/api/provider-secrets.api'
import type {
  AiProviderSecret,
  RotateAiProviderSecretPayload,
  SaveAiProviderSecretPayload,
} from '../../domain/model/provider-secret'

/**
 * Mutations never retain secretValue after the request settles.
 * Callers must clear local form state on success.
 */
export function useProviderSecretMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)

  const save = useCallback(
    async (body: SaveAiProviderSecretPayload): Promise<AiProviderSecret> => {
      setSaving(true)
      try {
        const created = await secretsApi.saveProviderSecret(body)
        toast.success('Secret saved')
        onSuccess?.()
        return created
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const rotate = useCallback(
    async (
      id: string,
      body: RotateAiProviderSecretPayload
    ): Promise<AiProviderSecret> => {
      setSaving(true)
      try {
        const rotated = await secretsApi.rotateProviderSecret(id, body)
        toast.success('Secret rotated')
        onSuccess?.()
        return rotated
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const deactivate = useCallback(
    async (id: string): Promise<void> => {
      setSaving(true)
      try {
        await secretsApi.deactivateProviderSecret(id)
        toast.success('Secret deactivated')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  return { saving, save, rotate, deactivate }
}
