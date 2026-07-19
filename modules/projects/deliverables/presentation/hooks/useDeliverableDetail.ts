'use client'

import { useCallback, useEffect, useState } from 'react'
import * as deliverablesApi from '../../infrastructure/api/deliverables.api'
import type {
  AcceptanceCriteria,
  ChangeDeliverableStatusPayload,
  CreateAcceptanceCriteriaPayload,
  Deliverable,
} from '../../domain/model/deliverable'

/** Loads acceptance criteria + lifecycle actions for a deliverable shown in the detail drawer. */
export function useDeliverableDetail(projectId: string | null, deliverableId: string | null) {
  const [criteria, setCriteria] = useState<AcceptanceCriteria[]>([])
  const [loading, setLoading] = useState(false)
  const [acting, setActing] = useState(false)

  const loadCriteria = useCallback(async () => {
    if (!projectId || !deliverableId) {
      setCriteria([])
      return
    }
    setLoading(true)
    try {
      const res = await deliverablesApi.listAcceptanceCriteria(projectId, deliverableId)
      setCriteria(res ?? [])
    } catch {
      setCriteria([])
    } finally {
      setLoading(false)
    }
  }, [projectId, deliverableId])

  useEffect(() => {
    void loadCriteria()
  }, [loadCriteria])

  const changeStatus = useCallback(
    async (body: ChangeDeliverableStatusPayload): Promise<Deliverable | null> => {
      if (!projectId || !deliverableId) return null
      setActing(true)
      try {
        return await deliverablesApi.changeDeliverableStatus(projectId, deliverableId, body)
      } finally {
        setActing(false)
      }
    },
    [projectId, deliverableId]
  )

  const accept = useCallback(async (): Promise<Deliverable | null> => {
    if (!projectId || !deliverableId) return null
    setActing(true)
    try {
      return await deliverablesApi.acceptDeliverable(projectId, deliverableId)
    } finally {
      setActing(false)
    }
  }, [projectId, deliverableId])

  const reopen = useCallback(async (): Promise<Deliverable | null> => {
    if (!projectId || !deliverableId) return null
    setActing(true)
    try {
      return await deliverablesApi.reopenDeliverable(projectId, deliverableId)
    } finally {
      setActing(false)
    }
  }, [projectId, deliverableId])

  const archive = useCallback(async (): Promise<Deliverable | null> => {
    if (!projectId || !deliverableId) return null
    setActing(true)
    try {
      return await deliverablesApi.archiveDeliverable(projectId, deliverableId)
    } finally {
      setActing(false)
    }
  }, [projectId, deliverableId])

  const createCriteria = useCallback(
    async (body: CreateAcceptanceCriteriaPayload) => {
      if (!projectId || !deliverableId) return null
      const created = await deliverablesApi.createAcceptanceCriteria(
        projectId,
        deliverableId,
        body
      )
      await loadCriteria()
      return created
    },
    [projectId, deliverableId, loadCriteria]
  )

  const satisfyCriteria = useCallback(
    async (criteriaId: string) => {
      if (!projectId) return null
      const updated = await deliverablesApi.satisfyAcceptanceCriteria(projectId, criteriaId)
      await loadCriteria()
      return updated
    },
    [projectId, loadCriteria]
  )

  const waiveCriteria = useCallback(
    async (criteriaId: string) => {
      if (!projectId) return null
      const updated = await deliverablesApi.waiveAcceptanceCriteria(projectId, criteriaId)
      await loadCriteria()
      return updated
    },
    [projectId, loadCriteria]
  )

  return {
    criteria,
    loading,
    acting,
    refetchCriteria: loadCriteria,
    changeStatus,
    accept,
    reopen,
    archive,
    createCriteria,
    satisfyCriteria,
    waiveCriteria,
  }
}
