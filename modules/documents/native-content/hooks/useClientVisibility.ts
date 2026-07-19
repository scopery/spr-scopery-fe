'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as visibilityApi from '../api/client-visibility.api'
import type { ClientVisibilityValidation } from '../model/intelligence'

export function useClientVisibility(projectId: string, documentId: string) {
  const [validation, setValidation] = useState<ClientVisibilityValidation | null>(null)
  const [clientVisible, setClientVisible] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)

  const validate = useCallback(async () => {
    setBusy(true)
    try {
      const result = await visibilityApi.validateClientVisibility(projectId, documentId)
      setValidation(result)
      return result
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      return null
    } finally {
      setBusy(false)
    }
  }, [projectId, documentId])

  const enable = useCallback(async () => {
    setBusy(true)
    try {
      const check = await visibilityApi.validateClientVisibility(projectId, documentId)
      setValidation(check)
      if (!check.valid) {
        toast.error('Fix validation issues before enabling client visibility')
        return false
      }
      await visibilityApi.enableClientVisibility(projectId, documentId)
      setClientVisible(true)
      toast.success('Client visibility enabled')
      return true
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      return false
    } finally {
      setBusy(false)
    }
  }, [projectId, documentId])

  const disable = useCallback(async () => {
    setBusy(true)
    try {
      await visibilityApi.disableClientVisibility(projectId, documentId)
      setClientVisible(false)
      toast.success('Client visibility disabled')
      return true
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      return false
    } finally {
      setBusy(false)
    }
  }, [projectId, documentId])

  return { validation, clientVisible, busy, validate, enable, disable }
}
