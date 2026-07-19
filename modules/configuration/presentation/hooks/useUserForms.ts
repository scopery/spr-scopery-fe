'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as formsApi from '../../infrastructure/api/forms.api'
import type { CustomFormDefinition } from '../../domain/model/form'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

/** Forms available for a workspace member to fill in — only forms with a published version. */
export function useUserForms(workspaceId: string | null) {
  const [forms, setForms] = useState<CustomFormDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const formList = await formsApi.listForms(workspaceId)
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

  const availableForms = useMemo(
    () => forms.filter((f) => Boolean(f.currentVersionId)),
    [forms]
  )

  return {
    forms: availableForms,
    allForms: forms,
    loading,
    error,
    refetch: load,
  }
}
