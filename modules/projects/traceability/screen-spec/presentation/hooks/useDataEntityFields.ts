'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError, getErrorCode } from '@/shared/lib/api-types'
import * as api from '../../infrastructure/api/screen-spec.api'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import type {
  CreateDataEntityFieldBody,
  DataEntityField,
  UpdateDataEntityFieldBody,
} from '../../domain/model/screen-spec'

export function useDataEntityFields(workspaceId: string | null, entityId: string | null) {
  const [items, setItems] = useState<DataEntityField[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !entityId) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.listDataEntityFields(workspaceId, entityId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load columns')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, entityId])

  useEffect(() => {
    void load()
  }, [load])

  const createField = useCallback(
    async (body: CreateDataEntityFieldBody) => {
      if (!workspaceId || !entityId) return
      try {
        await api.createDataEntityField(workspaceId, entityId, body)
        await load()
      } catch (err) {
        if (getErrorCode(err) === 'DATA_ENTITY_FIELD_COLUMN_ALREADY_EXISTS') {
          throw new ApiError(409, {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: ScreenSpecMessages.COLUMN_EXISTS,
            code: 'DATA_ENTITY_FIELD_COLUMN_ALREADY_EXISTS',
          })
        }
        throw err
      }
    },
    [workspaceId, entityId, load]
  )

  const createFieldsBulk = useCallback(
    async (items: CreateDataEntityFieldBody[]) => {
      if (!workspaceId || !entityId) return { failed: [] }
      const job = await api.submitDataEntityFieldsBulk(workspaceId, entityId, items)
      const result = await api.waitForFieldBulkJob(job)
      await load()
      return result
    },
    [workspaceId, entityId, load]
  )

  const updateField = useCallback(
    async (fieldId: string, body: UpdateDataEntityFieldBody) => {
      if (!workspaceId || !entityId) return
      await api.updateDataEntityField(workspaceId, entityId, fieldId, body)
      await load()
    },
    [workspaceId, entityId, load]
  )

  const removeField = useCallback(
    async (fieldId: string) => {
      if (!workspaceId || !entityId) return
      await api.deleteDataEntityField(workspaceId, entityId, fieldId)
      await load()
    },
    [workspaceId, entityId, load]
  )

  return { items, loading, error, refetch: load, createField, createFieldsBulk, updateField, removeField }
}
