'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import * as deploymentsApi from '../../infrastructure/api/deployments.api'
import type {
  AiModelDeployment,
  CreateAiModelDeploymentPayload,
  UpdateAiModelDeploymentPayload,
} from '../../domain/model/deployment'

export function useDeploymentMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)

  const create = useCallback(
    async (body: CreateAiModelDeploymentPayload): Promise<AiModelDeployment> => {
      setSaving(true)
      try {
        const created = await deploymentsApi.createDeployment(body)
        toast.success('Deployment created')
        onSuccess?.()
        return created
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const update = useCallback(
    async (id: string, body: UpdateAiModelDeploymentPayload): Promise<AiModelDeployment> => {
      setSaving(true)
      try {
        const updated = await deploymentsApi.updateDeployment(id, body)
        toast.success('Deployment updated')
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
        await deploymentsApi.activateDeployment(id)
        toast.success('Deployment activated')
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
        await deploymentsApi.deactivateDeployment(id)
        toast.success('Deployment deactivated')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const setDefault = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await deploymentsApi.setDefaultDeployment(id)
        toast.success('Default deployment updated')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  return { saving, create, update, activate, deactivate, setDefault }
}
