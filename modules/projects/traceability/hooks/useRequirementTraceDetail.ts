'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as requirementsApi from '@/modules/projects/requirements/api/requirements.api'
import * as api from '../api/requirement-traceability.api'
import type { RequirementTraceDetailResponse } from '../model/requirement-traceability'

export function useRequirementTraceDetail(
  projectId: string | null,
  requirementId: string | null,
  seedDescription?: string | null,
  seedPriority?: string | null
) {
  const [data, setData] = useState<RequirementTraceDetailResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !requirementId) {
      setData(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      let detail = await api.getRequirementTraceDetail(projectId, requirementId)
      let description =
        detail.requirement.description?.trim() || seedDescription?.trim() || ''
      let priority = detail.requirement.priority ?? seedPriority ?? null

      // Trace detail often omits description — enrich from requirement GET.
      if (!description) {
        try {
          const full = await requirementsApi.getRequirement('', projectId, requirementId)
          description = full.description?.trim() || ''
          priority = priority ?? full.priority ?? null
        } catch {
          /* keep seed / empty */
        }
      }

      detail = {
        ...detail,
        requirement: {
          ...detail.requirement,
          description: description || null,
          priority,
        },
      }
      setData(detail)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load requirement trace')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [projectId, requirementId, seedDescription, seedPriority])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, refetch: load }
}
