'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError, getErrorCode } from '@/shared/lib/api-types'
import * as api from '../../infrastructure/api/screen-spec.api'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import type {
  ComponentApiLink,
  CreateComponentApiLinkBody,
  UpdateComponentApiLinkBody,
} from '../../domain/model/screen-spec'

export function useComponentApis(workspaceId: string | null, componentId: string | null) {
  const [items, setItems] = useState<ComponentApiLink[]>([])
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
      const res = await api.listComponentApis(workspaceId, componentId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load component APIs')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, componentId])

  useEffect(() => {
    void load()
  }, [load])

  const createLink = useCallback(
    async (body: CreateComponentApiLinkBody) => {
      if (!workspaceId || !componentId) return
      try {
        await api.createComponentApi(workspaceId, componentId, body)
        await load()
      } catch (err) {
        const code = getErrorCode(err)
        if (code === 'COMPONENT_API_DUPLICATE') {
          throw new ApiError(409, {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: ScreenSpecMessages.COMPONENT_API_DUPLICATE,
            code: 'COMPONENT_API_DUPLICATE',
          })
        }
        if (code === 'API_ENDPOINT_NOT_IN_WORKSPACE') {
          throw new ApiError(404, {
            type: 'about:blank',
            title: 'Not found',
            status: 404,
            detail: ScreenSpecMessages.API_ENDPOINT_NOT_IN_WORKSPACE,
            code: 'API_ENDPOINT_NOT_IN_WORKSPACE',
          })
        }
        throw err
      }
    },
    [workspaceId, componentId, load]
  )

  const updateLink = useCallback(
    async (apiLinkId: string, body: UpdateComponentApiLinkBody) => {
      if (!workspaceId || !componentId) return
      try {
        await api.updateComponentApi(workspaceId, componentId, apiLinkId, body)
        await load()
      } catch (err) {
        const code = getErrorCode(err)
        if (code === 'COMPONENT_API_DUPLICATE') {
          throw new ApiError(409, {
            type: 'about:blank',
            title: 'Conflict',
            status: 409,
            detail: ScreenSpecMessages.COMPONENT_API_DUPLICATE,
            code: 'COMPONENT_API_DUPLICATE',
          })
        }
        throw err
      }
    },
    [workspaceId, componentId, load]
  )

  const removeLink = useCallback(
    async (apiLinkId: string) => {
      if (!workspaceId || !componentId) return
      await api.deleteComponentApi(workspaceId, componentId, apiLinkId)
      await load()
    },
    [workspaceId, componentId, load]
  )

  return { items, loading, error, refetch: load, createLink, updateLink, removeLink }
}
