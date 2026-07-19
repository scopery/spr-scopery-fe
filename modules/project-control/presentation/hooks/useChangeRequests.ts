'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as api from '../../infrastructure/api/project-control.api'
import type {
  ChangeImpact,
  ChangeRequest,
  CreateChangeRequestPayload,
} from '../../domain/model/project-control'

export function useChangeRequests(projectId: string | null) {
  const [items, setItems] = useState<ChangeRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [view, setView] = useState<'register' | 'board'>('register')

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      setItems(await api.listChangeRequests(projectId))
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load change requests')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (body: CreateChangeRequestPayload) => {
      if (!projectId) return null
      const created = await api.createChangeRequest(projectId, body)
      await load()
      return created
    },
    [projectId, load]
  )

  const filtered =
    statusFilter === 'all' ? items : items.filter((i) => i.status === statusFilter)

  return {
    items: filtered,
    allItems: items,
    loading,
    error,
    forbidden,
    statusFilter,
    setStatusFilter,
    view,
    setView,
    refetch: load,
    create,
  }
}

export type CrWorkbenchTab = 'overview' | 'items' | 'impact' | 'orders'

export function useChangeRequestWorkbench(
  projectId: string | null,
  changeRequestId: string | null
) {
  const [tab, setTab] = useState<CrWorkbenchTab>('overview')
  const [cr, setCr] = useState<ChangeRequest | null>(null)
  const [items, setItems] = useState<Awaited<ReturnType<typeof api.listChangeRequestItems>>>(
    []
  )
  const [impact, setImpact] = useState<ChangeImpact | null>(null)
  const [orders, setOrders] = useState<Awaited<ReturnType<typeof api.listChangeOrders>>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    if (!projectId || !changeRequestId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const [c, its, imp, ors] = await Promise.all([
        api.getChangeRequest(projectId, changeRequestId),
        api.listChangeRequestItems(projectId, changeRequestId),
        api.getChangeImpact(projectId, changeRequestId),
        api.listChangeOrders(projectId, changeRequestId),
      ])
      setCr(c)
      setItems(its)
      setImpact(imp)
      setOrders(ors)
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load change request')
      setCr(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, changeRequestId])

  useEffect(() => {
    void load()
  }, [load])

  const lifecycle = useCallback(
    async (
      action: 'submit' | 'approve' | 'reject' | 'cancel' | 'apply' | 'archive',
      reason?: string
    ) => {
      if (!projectId || !changeRequestId) return null
      let result: ChangeRequest
      switch (action) {
        case 'submit':
          result = await api.submitChangeRequest(projectId, changeRequestId)
          break
        case 'approve':
          result = await api.approveChangeRequest(projectId, changeRequestId)
          break
        case 'reject':
          result = await api.rejectChangeRequest(
            projectId,
            changeRequestId,
            reason ?? ''
          )
          break
        case 'cancel':
          result = await api.cancelChangeRequest(projectId, changeRequestId)
          break
        case 'apply':
          result = await api.applyChangeRequest(projectId, changeRequestId)
          break
        case 'archive':
          result = await api.archiveChangeRequest(projectId, changeRequestId)
          break
      }
      await load()
      return result
    },
    [projectId, changeRequestId, load]
  )

  const addItem = useCallback(
    async (body: Parameters<typeof api.createChangeRequestItem>[2]) => {
      if (!projectId || !changeRequestId) return null
      const created = await api.createChangeRequestItem(
        projectId,
        changeRequestId,
        body
      )
      await load()
      return created
    },
    [projectId, changeRequestId, load]
  )

  const removeItem = useCallback(
    async (itemId: string) => {
      if (!projectId || !changeRequestId) return
      await api.deleteChangeRequestItem(projectId, changeRequestId, itemId)
      await load()
    },
    [projectId, changeRequestId, load]
  )

  const calculateImpact = useCallback(async () => {
    if (!projectId || !changeRequestId) return null
    const result = await api.calculateChangeImpact(projectId, changeRequestId)
    setImpact(result)
    return result
  }, [projectId, changeRequestId])

  const saveImpact = useCallback(
    async (body: Parameters<typeof api.putChangeImpact>[2]) => {
      if (!projectId || !changeRequestId) return null
      const result = await api.putChangeImpact(projectId, changeRequestId, body)
      setImpact(result)
      return result
    },
    [projectId, changeRequestId]
  )

  const addOrder = useCallback(
    async (body: Parameters<typeof api.createChangeOrder>[2]) => {
      if (!projectId || !changeRequestId) return null
      const created = await api.createChangeOrder(projectId, changeRequestId, body)
      await load()
      return created
    },
    [projectId, changeRequestId, load]
  )

  return {
    tab,
    setTab,
    cr,
    items,
    impact,
    orders,
    loading,
    error,
    forbidden,
    refetch: load,
    lifecycle,
    addItem,
    removeItem,
    calculateImpact,
    saveImpact,
    addOrder,
  }
}
