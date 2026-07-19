'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as deliverablesApi from '../../infrastructure/api/deliverables.api'
import type {
  AcceptanceCriteria,
  CreateAcceptanceCriteriaPayload,
  CreateDeliverablePayload,
  Deliverable,
} from '../../domain/model/deliverable'

export function useDeliverables(projectId: string | null) {
  const [deliverables, setDeliverables] = useState<Deliverable[]>([])
  const [selectedDeliverableId, setSelectedDeliverableId] = useState<string | null>(null)
  const [criteria, setCriteria] = useState<AcceptanceCriteria[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCriteria, setLoadingCriteria] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await deliverablesApi.listDeliverables(projectId)
      setDeliverables(res ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load deliverables')
      setDeliverables([])
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const loadCriteria = useCallback(async () => {
    if (!projectId || !selectedDeliverableId) {
      setCriteria([])
      return
    }
    setLoadingCriteria(true)
    try {
      const res = await deliverablesApi.listAcceptanceCriteria(projectId, selectedDeliverableId)
      setCriteria(res ?? [])
    } catch {
      setCriteria([])
    } finally {
      setLoadingCriteria(false)
    }
  }, [projectId, selectedDeliverableId])

  useEffect(() => {
    void loadCriteria()
  }, [loadCriteria])

  const createDeliverable = useCallback(
    async (body: CreateDeliverablePayload) => {
      if (!projectId) return null
      const created = await deliverablesApi.createDeliverable(projectId, body)
      await load()
      return created
    },
    [projectId, load]
  )

  const createCriteria = useCallback(
    async (body: CreateAcceptanceCriteriaPayload) => {
      if (!projectId || !selectedDeliverableId) return null
      const created = await deliverablesApi.createAcceptanceCriteria(
        projectId,
        selectedDeliverableId,
        body
      )
      await loadCriteria()
      return created
    },
    [projectId, selectedDeliverableId, loadCriteria]
  )

  const runAction = useCallback(
    async (deliverableId: string, action: 'accept' | 'reopen' | 'archive') => {
      if (!projectId) return
      setActingId(deliverableId)
      try {
        if (action === 'accept') await deliverablesApi.acceptDeliverable(projectId, deliverableId)
        else if (action === 'reopen') await deliverablesApi.reopenDeliverable(projectId, deliverableId)
        else await deliverablesApi.archiveDeliverable(projectId, deliverableId)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [projectId, load]
  )

  const selectedDeliverable = useMemo(
    () => deliverables.find((d) => d.id === selectedDeliverableId) ?? null,
    [deliverables, selectedDeliverableId]
  )

  return {
    deliverables,
    selectedDeliverable,
    selectedDeliverableId,
    setSelectedDeliverableId,
    criteria,
    loading,
    loadingCriteria,
    error,
    forbidden,
    actingId,
    refetch: load,
    refetchCriteria: loadCriteria,
    createDeliverable,
    createCriteria,
    runAction,
  }
}
