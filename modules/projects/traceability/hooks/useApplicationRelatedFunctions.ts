'use client'

import { useCallback, useEffect, useState } from 'react'
import * as projectsApi from '@/modules/projects/project/api/projects.api'
import * as catalogApi from '../api/functional-catalog.api'
import * as traceabilityApi from '../api/traceability.api'
import type { BrowseCatalogNode } from '../model/architecture-workbench'

export function useApplicationRelatedFunctions(
  workspaceId: string | null | undefined,
  applicationId: string | null | undefined,
  enabled = true
) {
  const [items, setItems] = useState<BrowseCatalogNode[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId || !applicationId) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [tree, projectsRes] = await Promise.all([
        traceabilityApi.getOverallStructure(workspaceId, applicationId),
        projectsApi.listProjects(workspaceId, { size: 100, page: 0 }),
      ])

      const moduleById = new Map(
        (tree.modules ?? []).map((m) => [m.id, m] as const)
      )
      const moduleIds = new Set(moduleById.keys())
      if (moduleIds.size === 0) {
        setItems([])
        return
      }

      const projectNameById = new Map(
        projectsRes.items.map((p) => [p.id, p.name] as const)
      )

      const lists = await Promise.all(
        projectsRes.items.map(async (project) => {
          try {
            const res = await catalogApi.listFunctionalItems(project.id)
            return res.items ?? []
          } catch {
            return []
          }
        })
      )

      const nodes: BrowseCatalogNode[] = []
      const seen = new Set<string>()

      for (const fi of lists.flat()) {
        if (!fi.moduleId || !moduleIds.has(fi.moduleId)) continue
        if (seen.has(fi.id)) continue
        seen.add(fi.id)
        const mod = moduleById.get(fi.moduleId)
        const projectName =
          projectNameById.get(fi.projectId) ?? fi.projectId ?? 'Project'
        nodes.push({
          id: fi.id,
          type: 'FUNCTION',
          code: fi.code,
          name: fi.title,
          status: fi.status,
          moduleId: fi.moduleId,
          projectId: fi.projectId,
          projectName,
          secondary: mod
            ? `${projectName} · ${mod.code}`
            : projectName,
          description: fi.description ?? null,
        })
      }

      // Fallback: BE overall-structure may still carry assigned FRs not returned by catalog.
      for (const mod of tree.modules ?? []) {
        for (const fn of mod.functions ?? []) {
          if (seen.has(fn.id)) continue
          seen.add(fn.id)
          const projectName = fn.projectId
            ? (projectNameById.get(fn.projectId) ?? fn.projectId)
            : 'Project'
          nodes.push({
            id: fn.id,
            type: 'FUNCTION',
            code: fn.code,
            name: fn.title,
            moduleId: mod.id,
            projectId: fn.projectId ?? null,
            projectName,
            secondary: `${projectName} · ${mod.code}`,
            description: null,
          })
        }
      }

      nodes.sort((a, b) => {
        const p = (a.projectName ?? '').localeCompare(b.projectName ?? '')
        if (p !== 0) return p
        return a.code.localeCompare(b.code)
      })

      setItems(nodes)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load related functions')
      // Keep previous items so selection/dock does not flash empty mid-reload.
    } finally {
      setLoading(false)
    }
  }, [workspaceId, applicationId])

  useEffect(() => {
    if (!enabled) return
    void load()
  }, [enabled, load])

  return { items, loading, error, refetch: load }
}
