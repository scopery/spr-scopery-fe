'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as api from '../../infrastructure/api/phase-definitions.api'
import { PhaseDefinitionScope } from '../../domain/enums/phase-definition.enum'
import type {
  CreatePhaseDefinitionPayload,
  PhaseDefinition,
  SearchPhaseDefinitionsParams,
} from '../../domain/model/phase-definition'

export function usePhaseDefinitions(params?: SearchPhaseDefinitionsParams) {
  const [definitions, setDefinitions] = useState<PhaseDefinition[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)
  const paramsKey = JSON.stringify(params ?? {})

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await api.searchPhaseDefinitions(params)
      setDefinitions(res.items ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true)
      }
      setError(err instanceof Error ? err.message : 'Failed to load phase definitions')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey])

  useEffect(() => {
    void load()
  }, [load])

  const createDefinition = useCallback(
    async (scope: string, body: CreatePhaseDefinitionPayload & { workspaceId?: string }) => {
      if (scope === PhaseDefinitionScope.System) {
        await api.createSystemPhaseDefinition(body)
      } else if (scope === PhaseDefinitionScope.Organization) {
        await api.createOrgPhaseDefinition(body)
      } else {
        const { workspaceId = '', ...rest } = body
        await api.createWorkspacePhaseDefinition(workspaceId, rest)
      }
      await load()
    },
    [load]
  )

  const activate = useCallback(
    async (id: string) => {
      setActingId(id)
      try {
        await api.activatePhaseDefinition(id)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [load]
  )

  const deactivate = useCallback(
    async (id: string) => {
      setActingId(id)
      try {
        await api.deactivatePhaseDefinition(id)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [load]
  )

  const archive = useCallback(
    async (id: string) => {
      setActingId(id)
      try {
        await api.archivePhaseDefinition(id)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [load]
  )

  return {
    definitions,
    loading,
    error,
    forbidden,
    actingId,
    refetch: load,
    createDefinition,
    activate,
    deactivate,
    archive,
  }
}
