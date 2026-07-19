'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/integration.api'
import type { CredentialReference } from '../../infrastructure/api/integration.api'
import type { IntegrationConnection } from '../../domain/model/integration'

export function useIntegrations(workspaceId: string | null) {
  const [items, setItems] = useState<IntegrationConnection[]>([])
  const [credentials, setCredentials] = useState<CredentialReference[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionResult, setActionResult] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [conn, cred] = await Promise.all([
        api.listConnections(workspaceId),
        api.listCredentialReferences(workspaceId),
      ])
      setItems(conn.items ?? [])
      setCredentials(cred.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const enable = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.enableConnection(workspaceId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Enable failed')
      }
    },
    [workspaceId, load]
  )

  const disable = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.disableConnection(workspaceId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Disable failed')
      }
    },
    [workspaceId, load]
  )

  const archive = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.archiveConnection(workspaceId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Archive failed')
      }
    },
    [workspaceId, load]
  )

  const healthCheck = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      setActionError(null)
      setActionResult(null)
      try {
        const res = await api.runHealthCheck(workspaceId, id)
        setActionResult(`Health check: ${res.status}`)
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Health check failed')
      }
    },
    [workspaceId]
  )

  const test = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      setActionError(null)
      setActionResult(null)
      try {
        const res = await api.testConnection(workspaceId, id)
        setActionResult(`Test connection: ${res.status}`)
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Test connection failed')
      }
    },
    [workspaceId]
  )

  const pull = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      setActionError(null)
      setActionResult(null)
      try {
        const res = await api.syncPull(workspaceId, id)
        setActionResult(`Sync pull: ${res.status}`)
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Sync pull failed')
      }
    },
    [workspaceId]
  )

  const rotate = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.rotateCredential(workspaceId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Rotate credential failed')
      }
    },
    [workspaceId, load]
  )

  const revoke = useCallback(
    async (id: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.revokeCredential(workspaceId, id)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Revoke credential failed')
      }
    },
    [workspaceId, load]
  )

  return {
    items,
    credentials,
    loading,
    error,
    actionError,
    actionResult,
    refetch: load,
    enable,
    disable,
    archive,
    healthCheck,
    test,
    pull,
    rotate,
    revoke,
  }
}
