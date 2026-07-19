'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import * as toolsApi from '../../infrastructure/api/tools.api'
import type {
  AddToolPermissionPayload,
  AiTool,
  BindToolAgentPayload,
  CreateAiToolPayload,
  ExecuteToolPayload,
  ExecuteToolResult,
  UpdateAiToolPayload,
} from '../../domain/model/tool'

export function useToolMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)

  const create = useCallback(
    async (body: CreateAiToolPayload): Promise<AiTool> => {
      setSaving(true)
      try {
        const created = await toolsApi.createTool(body)
        toast.success('Tool created')
        onSuccess?.()
        return created
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const update = useCallback(
    async (id: string, body: UpdateAiToolPayload): Promise<AiTool> => {
      setSaving(true)
      try {
        const updated = await toolsApi.updateTool(id, body)
        toast.success('Tool updated')
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
        await toolsApi.activateTool(id)
        toast.success('Tool activated')
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
        await toolsApi.deactivateTool(id)
        toast.success('Tool deactivated')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const addPermission = useCallback(
    async (toolId: string, body: AddToolPermissionPayload) => {
      setSaving(true)
      try {
        await toolsApi.addToolPermission(toolId, body)
        toast.success('Permission added')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const removePermission = useCallback(
    async (toolId: string, permissionId: string) => {
      setSaving(true)
      try {
        await toolsApi.removeToolPermission(toolId, permissionId)
        toast.success('Permission removed')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const bindAgent = useCallback(
    async (toolId: string, body: BindToolAgentPayload) => {
      setSaving(true)
      try {
        await toolsApi.bindToolAgent(toolId, body)
        toast.success('Agent bound')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const unbindAgent = useCallback(
    async (toolId: string, agentId: string) => {
      setSaving(true)
      try {
        await toolsApi.unbindToolAgent(toolId, agentId)
        toast.success('Agent unbound')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const execute = useCallback(
    async (toolId: string, body?: ExecuteToolPayload): Promise<ExecuteToolResult> => {
      setSaving(true)
      try {
        const result = await toolsApi.executeTool(toolId, body)
        toast.success('Debug execute completed (stub)')
        onSuccess?.()
        return result
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  return {
    saving,
    create,
    update,
    activate,
    deactivate,
    addPermission,
    removePermission,
    bindAgent,
    unbindAgent,
    execute,
  }
}
