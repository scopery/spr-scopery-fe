'use client'

import { useCallback, useState } from 'react'
import * as formSubmissionsApi from '../../infrastructure/api/form-submissions.api'
import type { SubmitFormPayload } from '../../domain/model/form-submission'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

/** Submit action for a user filling in a form. Structure comes from useFormBuilder. */
export function useFormSubmission(workspaceId: string | null, formId: string | null) {
  const [submitting, setSubmitting] = useState(false)

  const submit = useCallback(
    async (payload: SubmitFormPayload) => {
      if (!workspaceId || !formId) return
      setSubmitting(true)
      try {
        const submission = await formSubmissionsApi.submitForm(workspaceId, formId, payload)
        toast.success('Form submitted')
        return submission
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSubmitting(false)
      }
    },
    [workspaceId, formId]
  )

  return { submit, submitting }
}
