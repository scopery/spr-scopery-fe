'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as organizationsApi from '../../infrastructure/api/organizations.api'
import type { Organization, SearchOrganizationsParams } from '../../domain/model/organization'

export function useOrganizations(params?: SearchOrganizationsParams) {
  const [items, setItems] = useState<Organization[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await organizationsApi.searchOrganizations(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useOrganization(orgId: string | null) {
  const [data, setData] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const res = await organizationsApi.getOrganization(orgId)
      setData(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load organization')
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
