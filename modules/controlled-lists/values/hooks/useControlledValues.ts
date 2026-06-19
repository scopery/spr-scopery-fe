'use client'

import { useCallback, useState } from 'react'
import type {
  ControlledValue,
  CreateValuePayload,
  UpdateValuePatch,
} from '@/modules/controlled-lists/lists/model/controlled-lists'
import * as controlledValuesApi from '../api/controlled-values.api'

/**
 * Session-scoped values list — no GET endpoint to list values.
 */
export function useControlledValues() {
  const [values, setValues] = useState<ControlledValue[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createValue = useCallback(
    async (
      orgId: string,
      listId: string,
      payload: CreateValuePayload
    ): Promise<ControlledValue> => {
      setLoading(true)
      setError(null)
      try {
        const created = await controlledValuesApi.createControlledValue(orgId, listId, payload)
        setValues((prev) => [created, ...prev])
        return created
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to create controlled value'
        setError(msg)
        throw e
      } finally {
        setLoading(false)
      }
    },
    []
  )

  const updateValue = useCallback(
    async (orgId: string, valueId: string, patch: UpdateValuePatch): Promise<ControlledValue> => {
      setError(null)
      const updated = await controlledValuesApi.updateControlledValue(orgId, valueId, patch)
      setValues((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
      return updated
    },
    []
  )

  const deleteValue = useCallback(async (orgId: string, valueId: string): Promise<void> => {
    setError(null)
    await controlledValuesApi.deleteControlledValue(orgId, valueId)
    setValues((prev) => prev.filter((v) => v.id !== valueId))
  }, [])

  return {
    values,
    loading,
    error,
    createValue,
    updateValue,
    deleteValue,
  }
}
