'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as workspacesApi from '../../infrastructure/api/workspaces.api'
import type {
  Workspace,
  WorkspaceMember,
  WorkspaceTeam,
  SearchWorkspacesParams,
} from '../../domain/model/workspace'

export function useWorkspacesV1(params?: SearchWorkspacesParams) {
  const [items, setItems] = useState<Workspace[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await workspacesApi.searchWorkspaces(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useWorkspaceMembers(
  workspaceId: string | null,
  params?: { userId?: string; status?: string; page?: number; size?: number }
) {
  const [items, setItems] = useState<WorkspaceMember[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await workspacesApi.listWorkspaceMembers(workspaceId, params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load workspace members')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, JSON.stringify(params)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load()
  }, [load])

  const activateMember = useCallback(
    async (memberId: string) => {
      if (!workspaceId) return
      setActingId(memberId)
      try {
        await workspacesApi.activateWorkspaceMember(workspaceId, memberId)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [workspaceId, load]
  )

  const deactivateMember = useCallback(
    async (memberId: string) => {
      if (!workspaceId) return
      setActingId(memberId)
      try {
        await workspacesApi.deactivateWorkspaceMember(workspaceId, memberId)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [workspaceId, load]
  )

  return {
    items,
    totalElements,
    loading,
    error,
    actingId,
    refetch: load,
    activateMember,
    deactivateMember,
  }
}

export function useWorkspaceTeams(
  workspaceId: string | null,
  params?: { status?: string; page?: number; size?: number }
) {
  const [items, setItems] = useState<WorkspaceTeam[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await workspacesApi.searchTeams(workspaceId, params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load workspace teams')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, JSON.stringify(params)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load()
  }, [load])

  const activateTeam = useCallback(
    async (teamId: string) => {
      if (!workspaceId) return
      setActingId(teamId)
      try {
        await workspacesApi.activateTeam(workspaceId, teamId)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [workspaceId, load]
  )

  const archiveTeam = useCallback(
    async (teamId: string) => {
      if (!workspaceId) return
      setActingId(teamId)
      try {
        await workspacesApi.archiveTeam(workspaceId, teamId)
        await load()
      } finally {
        setActingId(null)
      }
    },
    [workspaceId, load]
  )

  return {
    items,
    totalElements,
    loading,
    error,
    actingId,
    refetch: load,
    activateTeam,
    archiveTeam,
  }
}
