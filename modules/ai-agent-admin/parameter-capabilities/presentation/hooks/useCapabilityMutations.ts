'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import * as capabilitiesApi from '../../infrastructure/api/capabilities.api'
import type {
  AiParameterCapability,
  CreateAiParameterCapabilityPayload,
  UpdateAiParameterCapabilityPayload,
} from '../../domain/model/capability'

export function useCapabilityMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)

  const create = useCallback(
    async (body: CreateAiParameterCapabilityPayload): Promise<AiParameterCapability> => {
      setSaving(true)
      try {
        const created = await capabilitiesApi.createCapability(body)
        toast.success('Capability added')
        onSuccess?.()
        return created
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const update = useCallback(
    async (
      id: string,
      body: UpdateAiParameterCapabilityPayload
    ): Promise<AiParameterCapability> => {
      setSaving(true)
      try {
        const updated = await capabilitiesApi.updateCapability(id, body)
        toast.success('Capability updated')
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
        await capabilitiesApi.activateCapability(id)
        toast.success('Capability activated')
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
        await capabilitiesApi.deactivateCapability(id)
        toast.success('Capability deactivated')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  return { saving, create, update, activate, deactivate }
}
