'use client'

import { useCallback, useEffect, useState } from 'react'
import * as objectTypesApi from '../../infrastructure/api/object-types.api'
import * as formsApi from '../../infrastructure/api/forms.api'
import type { ObjectType } from '../../domain/model/object-type'
import type { CreateFormPayload, CustomFormDefinition } from '../../domain/model/form'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useFormsStudio(workspaceId: string | null) {
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([])
  const [forms, setForms] = useState<CustomFormDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [types, formList] = await Promise.all([
        objectTypesApi.listObjectTypes(),
        formsApi.listForms(workspaceId),
      ])
      setObjectTypes(types)
      setForms(formList)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load forms'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const createForm = useCallback(
    async (payload: CreateFormPayload) => {
      if (!workspaceId) return
      setCreating(true)
      try {
        const created = await formsApi.createForm(workspaceId, payload)
        toast.success('Form created')
        await load()
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setCreating(false)
      }
    },
    [workspaceId, load]
  )

  return {
    objectTypes,
    forms,
    loading,
    error,
    creating,
    createForm,
    refetch: load,
  }
}
