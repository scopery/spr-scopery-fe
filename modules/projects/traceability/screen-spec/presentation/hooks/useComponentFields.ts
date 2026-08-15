'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError, getErrorCode } from '@/shared/lib/api-types'
import * as api from '../../infrastructure/api/screen-spec.api'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import type {
  ApplicationComponentField,
  CreateComponentFieldBody,
  UpdateComponentFieldBody,
} from '../../domain/model/screen-spec'

export function useComponentFields(workspaceId: string | null, componentId: string | null) {
  const [items, setItems] = useState<ApplicationComponentField[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !componentId) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.listComponentFields(workspaceId, componentId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load component fields')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, componentId])

  useEffect(() => {
    void load()
  }, [load])

  const createField = useCallback(
    async (body: CreateComponentFieldBody) => {
      if (!workspaceId || !componentId) return
      try {
        await api.createComponentField(workspaceId, componentId, body)
        await load()
      } catch (err) {
        if (getErrorCode(err) === 'COMPONENT_FIELD_KEY_ALREADY_EXISTS') {
          throw new ApiError(409, {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: ScreenSpecMessages.COMPONENT_FIELD_EXISTS,
            code: 'COMPONENT_FIELD_KEY_ALREADY_EXISTS',
          })
        }
        throw err
      }
    },
    [workspaceId, componentId, load]
  )

  const createFieldsBulk = useCallback(
    async (items: CreateComponentFieldBody[]) => {
      if (!workspaceId || !componentId) return { failed: [] }
      const job = await api.submitComponentFieldsBulk(workspaceId, componentId, items)
      const result = await api.waitForFieldBulkJob(job)
      await load()
      return result
    },
    [workspaceId, componentId, load]
  )

  const updateField = useCallback(
    async (fieldId: string, body: UpdateComponentFieldBody) => {
      if (!workspaceId || !componentId) return
      await api.updateComponentField(workspaceId, componentId, fieldId, body)
      await load()
    },
    [workspaceId, componentId, load]
  )

  const removeField = useCallback(
    async (fieldId: string) => {
      if (!workspaceId || !componentId) return
      await api.deleteComponentField(workspaceId, componentId, fieldId)
      await load()
    },
    [workspaceId, componentId, load]
  )

  return { items, loading, error, refetch: load, createField, createFieldsBulk, updateField, removeField }
}
