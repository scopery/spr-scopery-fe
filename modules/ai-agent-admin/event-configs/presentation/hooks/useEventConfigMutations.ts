'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import * as eventConfigsApi from '../../infrastructure/api/event-configs.api'
import type {
  AiEventConfig,
  CreateAiEventConfigPayload,
  UpdateAiEventConfigPayload,
} from '../../domain/model/event-config'

export function useEventConfigMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)

  const create = useCallback(
    async (body: CreateAiEventConfigPayload): Promise<AiEventConfig> => {
      setSaving(true)
      try {
        const created = await eventConfigsApi.createEventConfig(body)
        toast.success('Event config created')
        onSuccess?.()
        return created
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const update = useCallback(
    async (id: string, body: UpdateAiEventConfigPayload): Promise<AiEventConfig> => {
      setSaving(true)
      try {
        const updated = await eventConfigsApi.updateEventConfig(id, body)
        toast.success('Event config updated')
        onSuccess?.()
        return updated
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const activate = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await eventConfigsApi.activateEventConfig(id)
        toast.success('Event config activated')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const deactivate = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await eventConfigsApi.deactivateEventConfig(id)
        toast.success('Event config deactivated')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  return { saving, create, update, activate, deactivate }
}
