'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import * as modelsApi from '../../infrastructure/api/models.api'
import type {
  AiModel,
  CreateAiModelPayload,
  UpdateAiModelPayload,
} from '../../domain/model/ai-model'

export function useModelMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)

  const create = useCallback(
    async (body: CreateAiModelPayload): Promise<AiModel> => {
      setSaving(true)
      try {
        const created = await modelsApi.createModel(body)
        toast.success('Model created')
        onSuccess?.()
        return created
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const update = useCallback(
    async (id: string, body: UpdateAiModelPayload): Promise<AiModel> => {
      setSaving(true)
      try {
        const updated = await modelsApi.updateModel(id, body)
        toast.success('Model updated')
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
        await modelsApi.activateModel(id)
        toast.success('Model activated')
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
        await modelsApi.deactivateModel(id)
        toast.success('Model deactivated')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  return { saving, create, update, activate, deactivate }
}
