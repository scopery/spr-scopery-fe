'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import * as usagePoliciesApi from '../../infrastructure/api/usage-policies.api'
import type {
  AiUsagePolicy,
  CreateAiUsagePolicyPayload,
  UpdateAiUsagePolicyPayload,
} from '../../domain/model/usage-policy'

export function useUsagePolicyMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)

  const create = useCallback(
    async (body: CreateAiUsagePolicyPayload): Promise<AiUsagePolicy> => {
      setSaving(true)
      try {
        const created = await usagePoliciesApi.createUsagePolicy(body)
        toast.success('Usage policy created')
        onSuccess?.()
        return created
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const update = useCallback(
    async (id: string, body: UpdateAiUsagePolicyPayload): Promise<AiUsagePolicy> => {
      setSaving(true)
      try {
        const updated = await usagePoliciesApi.updateUsagePolicy(id, body)
        toast.success('Usage policy updated')
        onSuccess?.()
        return updated
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const activate = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await usagePoliciesApi.activateUsagePolicy(id)
        toast.success('Usage policy activated')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const deactivate = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await usagePoliciesApi.deactivateUsagePolicy(id)
        toast.success('Usage policy deactivated')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  return { saving, create, update, activate, deactivate }
}
