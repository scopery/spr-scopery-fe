'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as api from '../api/traceability.api'
import type { ArchitectureCatalogNode } from '../model/architecture-workbench'
import type { RegistryApplication } from '../model/application-registry'

function buildNodes(
  modules: Awaited<ReturnType<typeof api.listAppModules>>['items'],
  screens: Awaited<ReturnType<typeof api.listScreens>>['items'],
  endpoints: Awaited<ReturnType<typeof api.listApiEndpoints>>['items'],
  components: Awaited<ReturnType<typeof api.listAppComponents>>['items'],
  entities: Awaited<ReturnType<typeof api.listDataEntities>>['items']
): ArchitectureCatalogNode[] {
  return [
    ...(modules ?? []).map((m) => ({
      id: m.id,
      type: 'MODULE' as const,
      code: m.code,
      name: m.name,
      status: m.status,
      secondary: m.description ?? null,
    })),
    ...(screens ?? []).map((s) => ({
      id: s.id,
      type: 'SCREEN' as const,
      code: s.code,
      name: s.name,
      status: s.status,
      secondary: s.routePath ?? null,
    })),
    ...(endpoints ?? []).map((e) => ({
      id: e.id,
      type: 'API_ENDPOINT' as const,
      code: e.method,
      name: e.pathPattern,
      status: e.status,
      secondary: e.name ?? null,
    })),
    ...(components ?? []).map((c) => ({
      id: c.id,
      type: 'COMPONENT' as const,
      code: c.code,
      name: c.name,
      status: c.status,
      secondary: c.componentType ?? null,
    })),
    ...(entities ?? []).map((e) => ({
      id: e.id,
      type: 'DATA_ENTITY' as const,
      code: e.code,
      name: e.name,
      status: e.status,
      secondary: e.tableName ?? null,
    })),
  ]
}

/**
 * Loads workspace applications + architecture nodes for a selected application
 * (picker / mapping / coverage — read-only).
 */
export function useArchitectureNodeCatalog(
  workspaceId: string | null,
  applicationId: string | null
) {
  const [applications, setApplications] = useState<RegistryApplication[]>([])
  const [nodes, setNodes] = useState<ArchitectureCatalogNode[]>([])
  const [loadingApps, setLoadingApps] = useState(false)
  const [loadingNodes, setLoadingNodes] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadApps = useCallback(async () => {
    if (!workspaceId) return
    setLoadingApps(true)
    setError(null)
    try {
      const res = await api.listApplications(workspaceId)
      setApplications(res.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoadingApps(false)
    }
  }, [workspaceId])

  const loadNodes = useCallback(async () => {
    if (!workspaceId || !applicationId) {
      setNodes([])
      return
    }
    setLoadingNodes(true)
    setError(null)
    try {
      const [moduleRes, screenRes, endpointRes, componentRes, entityRes] = await Promise.all([
        api.listAppModules(workspaceId, applicationId),
        api.listScreens(workspaceId, applicationId),
        api.listApiEndpoints(workspaceId, applicationId),
        api.listAppComponents(workspaceId, applicationId),
        api.listDataEntities(workspaceId, applicationId),
      ])
      setNodes(
        buildNodes(
          moduleRes.items,
          screenRes.items,
          endpointRes.items,
          componentRes.items,
          entityRes.items
        )
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load architecture nodes')
      setNodes([])
    } finally {
      setLoadingNodes(false)
    }
  }, [workspaceId, applicationId])

  useEffect(() => {
    void loadApps()
  }, [loadApps])

  useEffect(() => {
    void loadNodes()
  }, [loadNodes])

  const nodeById = useMemo(() => {
    const map = new Map<string, ArchitectureCatalogNode>()
    for (const n of nodes) map.set(n.id, n)
    return map
  }, [nodes])

  return {
    applications,
    nodes,
    nodeById,
    loading: loadingApps || loadingNodes,
    loadingApps,
    loadingNodes,
    error,
    refetchApps: loadApps,
    refetchNodes: loadNodes,
  }
}
