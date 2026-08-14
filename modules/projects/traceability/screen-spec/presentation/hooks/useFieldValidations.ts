'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError, getErrorCode } from '@/shared/lib/api-types'
import * as api from '../../infrastructure/api/screen-spec.api'
import { ScreenSpecMessages } from '../../domain/messages/screen-spec.messages'
import type {
  CreateFieldValidationBody,
  ScreenFieldValidation,
  UpdateFieldValidationBody,
  ValidationRuleType,
} from '../../domain/model/screen-spec'

export function useValidationRuleTypes(workspaceId: string | null) {
  const [items, setItems] = useState<ValidationRuleType[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      const res = await api.listValidationRuleTypes(workspaceId)
      setItems(res.items)
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, refetch: load }
}

export function useFieldValidations(
  workspaceId: string | null,
  screenId: string | null,
  fieldId: string | null
) {
  const [items, setItems] = useState<ScreenFieldValidation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !screenId || !fieldId) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await api.listFieldValidations(workspaceId, screenId, fieldId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load validations')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [workspaceId, screenId, fieldId])

  useEffect(() => {
    void load()
  }, [load])

  const createValidation = useCallback(
    async (body: CreateFieldValidationBody) => {
      if (!workspaceId || !screenId || !fieldId) return
      try {
        await api.createFieldValidation(workspaceId, screenId, fieldId, body)
        await load()
      } catch (err) {
        if (getErrorCode(err) === 'FIELD_VALIDATION_RULE_PARAM_INVALID') {
          throw new ApiError(422, {
            type: 'about:blank',
            title: 'Unprocessable',
            status: 422,
            detail: ScreenSpecMessages.RULE_PARAM_INVALID,
            code: 'FIELD_VALIDATION_RULE_PARAM_INVALID',
          })
        }
        throw err
      }
    },
    [workspaceId, screenId, fieldId, load]
  )

  const updateValidation = useCallback(
    async (validationId: string, body: UpdateFieldValidationBody) => {
      if (!workspaceId || !screenId || !fieldId) return
      await api.updateFieldValidation(workspaceId, screenId, fieldId, validationId, body)
      await load()
    },
    [workspaceId, screenId, fieldId, load]
  )

  const removeValidation = useCallback(
    async (validationId: string) => {
      if (!workspaceId || !screenId || !fieldId) return
      await api.deleteFieldValidation(workspaceId, screenId, fieldId, validationId)
      await load()
    },
    [workspaceId, screenId, fieldId, load]
  )

  return { items, loading, error, refetch: load, createValidation, updateValidation, removeValidation }
}
