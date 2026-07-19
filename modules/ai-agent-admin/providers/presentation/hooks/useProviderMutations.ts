'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import * as providersApi from '../../infrastructure/api/providers.api'
import type {
  AiProvider,
  CreateAiProviderPayload,
  UpdateAiProviderPayload,
} from '../../domain/model/provider'

export function useProviderMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)

  const create = useCallback(
    async (body: CreateAiProviderPayload): Promise<AiProvider | null> => {
      setSaving(true)
      try {
        const created = await providersApi.createProvider(body)
        toast.success('Provider created')
        onSuccess?.()
        return created
      } catch (err) {
        if (err instanceof ApiError && err.status !== 400 && err.status !== 422) {
          // global interceptor handles generic toast
        }
        throw err
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const update = useCallback(
    async (id: string, body: UpdateAiProviderPayload): Promise<AiProvider | null> => {
      setSaving(true)
      try {
        const updated = await providersApi.updateProvider(id, body)
        toast.success('Provider updated')
        onSuccess?.()
        return updated
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const activate = useCallback(
    async (id: string): Promise<void> => {
      setSaving(true)
      try {
        await providersApi.activateProvider(id)
        toast.success('Provider activated')
        onSuccess?.()
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
        await providersApi.deactivateProvider(id)
        toast.success('Provider deactivated')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  return { saving, create, update, activate, deactivate }
}
