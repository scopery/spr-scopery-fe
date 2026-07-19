'use client'

import { useCallback, useEffect, useState } from 'react'
import * as formSubmissionsApi from '../../infrastructure/api/form-submissions.api'
import * as formsApi from '../../infrastructure/api/forms.api'
import type { FormSubmission } from '../../domain/model/form-submission'
import type { CustomFormDefinition } from '../../domain/model/form'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useUserSubmissions(workspaceId: string | null) {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [forms, setForms] = useState<CustomFormDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [submissionList, formList] = await Promise.all([
        formSubmissionsApi.listFormSubmissions(workspaceId),
        formsApi.listForms(workspaceId),
      ])
      setSubmissions(submissionList)
      setForms(formList)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load submissions'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const formNameById = (formDefinitionId: string) =>
    forms.find((f) => f.id === formDefinitionId)?.name ?? formDefinitionId

  return {
    submissions,
    forms,
    formNameById,
    loading,
    error,
    refetch: load,
  }
}
