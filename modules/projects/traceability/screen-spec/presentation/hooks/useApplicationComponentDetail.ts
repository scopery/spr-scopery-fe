'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError, getErrorCode } from '@/shared/lib/api-types'
import * as api from '../../infrastructure/api/screen-spec.api'
import { OptionSourceType } from '../../domain/enums/screen-spec.enum'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import type {
  ApplicationComponentDetail,
  ComponentOption,
  CreateComponentOptionBody,
  UpdateComponentOptionBody,
  UpdateComponentSourceBody,
} from '../../domain/model/screen-spec'

export function useApplicationComponentDetail(
  workspaceId: string | null,
  applicationId: string | null,
  componentId: string | null
) {
  const [component, setComponent] = useState<ApplicationComponentDetail | null>(null)
  const [options, setOptions] = useState<ComponentOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !applicationId || !componentId) {
      setComponent(null)
      setOptions([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const detail = await api.getApplicationComponent(workspaceId, applicationId, componentId)
      setComponent(detail)
      if (detail.optionSourceType === OptionSourceType.Static) {
        try {
          const opt = await api.listComponentOptions(workspaceId, componentId)
          setOptions(opt.items)
        } catch {
          setOptions([])
        }
      } else {
        setOptions([])
      }
    } catch (err) {
      setComponent({
        id: componentId,
        applicationId,
        code: '',
        name: '',
        description: null,
        componentType: null,
        optionSourceType: OptionSourceType.None,
        sourceEntityId: null,
        sourceValueColumn: null,
        sourceLabelColumn: null,
        sourceFilterJson: null,
      })
      setOptions([])
      setError(err instanceof ApiError && err.status === 404 ? null : err instanceof Error ? err.message : null)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, applicationId, componentId])

  useEffect(() => {
    void load()
  }, [load])

  const saveSource = useCallback(
    async (body: UpdateComponentSourceBody) => {
      if (!workspaceId || !applicationId || !componentId) return
      await api.updateApplicationComponentSource(workspaceId, applicationId, componentId, body)
      await load()
    },
    [workspaceId, applicationId, componentId, load]
  )

  const createOption = useCallback(
    async (body: CreateComponentOptionBody) => {
      if (!workspaceId || !componentId) return
      try {
        await api.createComponentOption(workspaceId, componentId, body)
        await load()
      } catch (err) {
        if (getErrorCode(err) === 'COMPONENT_SOURCE_TYPE_NOT_STATIC') {
          throw new ApiError(422, {
            type: 'about:blank',
            title: 'Unprocessable',
            status: 422,
            detail: ScreenSpecMessages.STATIC_OPTIONS_ONLY,
            code: 'COMPONENT_SOURCE_TYPE_NOT_STATIC',
          })
        }
        throw err
      }
    },
    [workspaceId, componentId, load]
  )

  const updateOption = useCallback(
    async (optionId: string, body: UpdateComponentOptionBody) => {
      if (!workspaceId || !componentId) return
      await api.updateComponentOption(workspaceId, componentId, optionId, body)
      await load()
    },
    [workspaceId, componentId, load]
  )

  const removeOption = useCallback(
    async (optionId: string) => {
      if (!workspaceId || !componentId) return
      await api.deleteComponentOption(workspaceId, componentId, optionId)
      await load()
    },
    [workspaceId, componentId, load]
  )

  return {
    component,
    options,
    loading,
    error,
    refetch: load,
    saveSource,
    createOption,
    updateOption,
    removeOption,
  }
}
