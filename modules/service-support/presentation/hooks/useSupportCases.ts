'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import * as api from '../../infrastructure/api/support.api'
import type { SupportCase, SupportDashboardSummary, CreateSupportCasePayload } from '../../domain/model/support'
import type { SupportComment } from '../../infrastructure/api/support.api'

export function useSupportCases(workspaceId: string | null) {
  const [items, setItems] = useState<SupportCase[]>([])
  const [dashboard, setDashboard] = useState<SupportDashboardSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [cases, dash] = await Promise.all([
        api.listSupportCases(workspaceId),
        api.getSupportDashboard(workspaceId),
      ])
      setItems(cases.items)
      setDashboard(dash)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load support')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const createCase = useCallback(
    async (body: CreateSupportCasePayload) => {
      if (!workspaceId) return null
      setCreating(true)
      try {
        const created = await api.createSupportCase(workspaceId, {
          ...body,
          source: body.source ?? 'INTERNAL_CREATE',
          portalVisible: body.portalVisible ?? false,
        })
        toast.success('Support case created')
        await load()
        return created
      } finally {
        setCreating(false)
      }
    },
    [workspaceId, load]
  )

  return { items, dashboard, loading, error, creating, refetch: load, createCase }
}

export function useSupportCaseDetail(workspaceId: string | null, caseId: string | null) {
  const [item, setItem] = useState<SupportCase | null>(null)
  const [comments, setComments] = useState<SupportComment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !caseId) return
    setLoading(true)
    setError(null)
    try {
      const [caseRes, commentRes] = await Promise.all([
        api.getSupportCase(workspaceId, caseId),
        api.listCaseComments(workspaceId, caseId),
      ])
      setItem(caseRes)
      setComments(commentRes.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load case')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, caseId])

  useEffect(() => {
    void load()
  }, [load])

  const triage = useCallback(async () => {
    if (!workspaceId || !caseId) return
    setActionError(null)
    try {
      await api.triageSupportCase(workspaceId, caseId)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Triage failed')
    }
  }, [workspaceId, caseId, load])

  const resolve = useCallback(async () => {
    if (!workspaceId || !caseId) return
    setActionError(null)
    try {
      await api.resolveSupportCase(workspaceId, caseId)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Resolve failed')
    }
  }, [workspaceId, caseId, load])

  const close = useCallback(async () => {
    if (!workspaceId || !caseId) return
    setActionError(null)
    try {
      await api.closeSupportCase(workspaceId, caseId)
      await load()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Close failed')
    }
  }, [workspaceId, caseId, load])

  const addComment = useCallback(
    async (body: string) => {
      if (!workspaceId || !caseId || !body.trim()) return
      setActionError(null)
      try {
        await api.addCaseComment(workspaceId, caseId, body.trim())
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Comment failed')
      }
    },
    [workspaceId, caseId, load]
  )

  return {
    item,
    comments,
    loading,
    error,
    actionError,
    refetch: load,
    triage,
    resolve,
    close,
    addComment,
  }
}
