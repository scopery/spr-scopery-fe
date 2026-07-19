'use client'

import { useCallback, useEffect, useState } from 'react'
import * as evidenceApi from '../../infrastructure/api/evidence.api'
import type { AcceptanceEvidence, AddEvidencePayload } from '../../domain/model/evidence'

export function useAcceptanceEvidence(projectId: string | null, deliverableId: string | null) {
  const [evidence, setEvidence] = useState<AcceptanceEvidence[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !deliverableId) {
      setEvidence([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await evidenceApi.listEvidence(projectId, deliverableId)
      setEvidence(res ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evidence')
      setEvidence([])
    } finally {
      setLoading(false)
    }
  }, [projectId, deliverableId])

  useEffect(() => {
    void load()
  }, [load])

  const addEvidence = useCallback(
    async (body: AddEvidencePayload) => {
      if (!projectId || !deliverableId) return null
      const created = await evidenceApi.addEvidence(projectId, deliverableId, body)
      await load()
      return created
    },
    [projectId, deliverableId, load]
  )

  return { evidence, loading, error, refetch: load, addEvidence }
}
