'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import * as api from '../../infrastructure/api/knowledge-base.api'
import type {
  AiGuideDefinition,
  CreateAiGuideDefinitionPayload,
  UpdateAiGuideDefinitionPayload,
} from '../../domain/model/guide-definition'

export function useKnowledgeMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)

  const create = useCallback(
    async (body: CreateAiGuideDefinitionPayload): Promise<AiGuideDefinition> => {
      setSaving(true)
      try {
        const created = await api.createGuideDefinition(body)
        toast.success('Guide created')
        onSuccess?.()
        return created
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const update = useCallback(
    async (id: string, body: UpdateAiGuideDefinitionPayload): Promise<AiGuideDefinition> => {
      setSaving(true)
      try {
        const updated = await api.updateGuideDefinition(id, body)
        toast.success('Guide saved')
        onSuccess?.()
        return updated
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const retire = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await api.retireGuideDefinition(id)
        toast.success('Guide retired')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  return { saving, create, update, retire }
}
