'use client'

import { useCallback, useEffect, useState } from 'react'
import { iamGrantsApi, iamRightsApi } from '@/modules/auth/iam'
import type { IamRight } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export type WizardStep = 1 | 2 | 3 | 4

export interface WizardForm {
  subjectType: 'USER' | 'ROLE'
  subjectId: string
  resourceId: string
  roleId: string
  effect: 'ALLOW' | 'DENY'
  scopeType: string
  scopeRefId: string
  workspaceId: string
  rightIds: string[]
}

const DEFAULT_FORM: WizardForm = {
  subjectType: 'USER',
  subjectId: '',
  resourceId: '',
  roleId: '',
  effect: 'ALLOW',
  scopeType: 'SYSTEM',
  scopeRefId: '',
  workspaceId: '',
  rightIds: [],
}

export function useGrantAccessWizard() {
  const [step, setStep] = useState<WizardStep>(1)
  const [form, setForm] = useState<WizardForm>(DEFAULT_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [availableRights, setAvailableRights] = useState<IamRight[]>([])
  const [rightsLoading, setRightsLoading] = useState(false)

  const setField = useCallback(<K extends keyof WizardForm>(key: K, value: WizardForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const toggleRight = useCallback((rightId: string) => {
    setForm((prev) => ({
      ...prev,
      rightIds: prev.rightIds.includes(rightId)
        ? prev.rightIds.filter((id) => id !== rightId)
        : [...prev.rightIds, rightId],
    }))
  }, [])

  const loadRights = useCallback(async () => {
    if (availableRights.length > 0) return
    setRightsLoading(true)
    try {
      const res = await iamRightsApi.searchRights({ page: 0, size: 200 })
      setAvailableRights(res.items)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setRightsLoading(false)
    }
  }, [availableRights.length])

  useEffect(() => {
    if (step === 3) {
      void loadRights()
    }
  }, [step, loadRights])

  const canAdvance = useCallback(() => {
    if (step === 1) return form.subjectId.trim().length > 0
    if (step === 2) {
      if (!form.resourceId.trim()) return false
      if (form.scopeType === 'WORKSPACE' && !form.workspaceId.trim()) return false
      return true
    }
    if (step === 3) return true
    return false
  }, [step, form])

  const nextStep = useCallback(() => {
    if (step < 4 && canAdvance()) setStep((s) => (s + 1) as WizardStep)
  }, [step, canAdvance])

  const prevStep = useCallback(() => {
    if (step > 1) setStep((s) => (s - 1) as WizardStep)
  }, [step])

  const submit = useCallback(async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      const grant = await iamGrantsApi.createGrant({
        subjectType: form.subjectType,
        subjectId: form.subjectId.trim(),
        resourceId: form.resourceId.trim(),
        roleId: form.roleId.trim() || undefined,
        effect: form.effect,
        scopeType: form.scopeType || undefined,
        scopeRefId: form.scopeRefId.trim() || undefined,
        workspaceId: form.workspaceId.trim() || undefined,
      })
      for (const rightId of form.rightIds) {
        await iamGrantsApi.addGrantRight(grant.id, { rightId })
      }
      toast.success('Access granted successfully')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to grant access'
      setSubmitError(msg)
      toast.error(getProblemToastMessage(err))
      throw err
    } finally {
      setSubmitting(false)
    }
  }, [form])

  const resetWizard = useCallback(() => {
    setStep(1)
    setForm(DEFAULT_FORM)
    setSubmitError(null)
  }, [])

  return {
    step,
    form,
    setField,
    toggleRight,
    nextStep,
    prevStep,
    canAdvance,
    submitting,
    submitError,
    submit,
    resetWizard,
    availableRights,
    rightsLoading,
  }
}
