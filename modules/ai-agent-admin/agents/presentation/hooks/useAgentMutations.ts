'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import * as agentsApi from '../../infrastructure/api/agents.api'
import type {
  AiAgent,
  CreateAiAgentPayload,
  UpdateAiAgentPayload,
} from '../../domain/model/agent'

export function useAgentMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)

  const create = useCallback(
    async (body: CreateAiAgentPayload): Promise<AiAgent> => {
      setSaving(true)
      try {
        const created = await agentsApi.createAgent(body)
        toast.success('Agent created')
        onSuccess?.()
        return created
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const update = useCallback(
    async (id: string, body: UpdateAiAgentPayload): Promise<AiAgent> => {
      setSaving(true)
      try {
        const updated = await agentsApi.updateAgent(id, body)
        toast.success('Agent updated')
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
        await agentsApi.activateAgent(id)
        toast.success('Agent activated')
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
        await agentsApi.deactivateAgent(id)
        toast.success('Agent deactivated')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  return { saving, create, update, activate, deactivate }
}
