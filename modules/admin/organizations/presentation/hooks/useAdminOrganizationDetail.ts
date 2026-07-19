'use client'

import { useCallback, useEffect, useState } from 'react'
import * as organizationsApi from '../../infrastructure/api/organizations.api'
import type { Organization, UpdateOrganizationPayload } from '../../domain/model/organization'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useAdminOrganizationDetail(orgId: string | null) {
  const [data, setData] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [acting, setActing] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      setData(await organizationsApi.getOrganization(orgId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

  const save = useCallback(
    async (payload: UpdateOrganizationPayload) => {
      if (!orgId) return
      setSaving(true)
      try {
        const updated = await organizationsApi.updateOrganization(orgId, payload)
        setData(updated)
        toast.success('Organization updated')
        return updated
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setSaving(false)
      }
    },
    [orgId]
  )

  const runAction = useCallback(
    async (action: 'activate' | 'archive') => {
      if (!orgId) return
      setActing(true)
      try {
        const updated =
          action === 'activate'
            ? await organizationsApi.activateOrganization(orgId)
            : await organizationsApi.archiveOrganization(orgId)
        setData(updated)
        toast.success(action === 'activate' ? 'Organization activated' : 'Organization archived')
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setActing(false)
      }
    },
    [orgId]
  )

  return { data, loading, error, acting, saving, refetch: load, save, runAction }
}
