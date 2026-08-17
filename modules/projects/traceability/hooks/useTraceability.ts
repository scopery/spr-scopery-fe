'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as api from '../api/traceability.api'
import * as qualityApi from '@/modules/quality/infrastructure/api/quality.api'
import * as requirementsApi from '@/modules/projects/requirements/api/requirements.api'
import type { CoverageMatrixCell, TraceLink } from '../api/traceability.api'
import type { TestCase } from '@/modules/quality/domain/model/quality'
import type { Requirement } from '@/modules/projects/requirements/model/requirements'
import {
  buildRequirementCoverageRows,
  mapCoverageSummary,
  type CoverageSummary,
  type RequirementCoverageRow,
} from '../model/requirement-coverage'
import { TraceLinkType } from '@/modules/quality/domain/enums/quality.enum'

export function useTraceabilityMatrix(
  projectId: string | null,
  workspaceId?: string | null
) {
  const [cells, setCells] = useState<CoverageMatrixCell[]>([])
  const [links, setLinks] = useState<TraceLink[]>([])
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [beSummary, setBeSummary] = useState<CoverageSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coverageUnavailable, setCoverageUnavailable] = useState(false)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    setCoverageUnavailable(false)
    try {
      const orgId = workspaceId ?? projectId
      const [matrixResult, linkRes, tcRes, reqRes] = await Promise.all([
        api.getCoverageMatrix(projectId).then(
          (res) => ({ ok: true as const, res }),
          () => ({
            ok: false as const,
            res: {
              summary: null,
              items: [] as CoverageMatrixCell[],
              page: null,
            },
          })
        ),
        api.listTraceLinks(projectId),
        qualityApi.listTestCases(projectId).catch(() => ({ items: [] as TestCase[] })),
        requirementsApi
          .listRequirements(orgId, projectId, { limit: 500 })
          .catch(() => ({ items: [] as Requirement[] })),
      ])
      if (!matrixResult.ok) setCoverageUnavailable(true)
      setCells(matrixResult.res.items ?? [])
      setBeSummary(
        matrixResult.res.summary
          ? mapCoverageSummary(matrixResult.res.summary, [])
          : null
      )
      setLinks(linkRes.items ?? [])
      setTestCases(tcRes.items ?? [])
      setRequirements(reqRes.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load traceability')
    } finally {
      setLoading(false)
    }
  }, [projectId, workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const rows: RequirementCoverageRow[] = useMemo(
    () =>
      buildRequirementCoverageRows({
        requirements,
        links,
        cells,
        testCases,
      }),
    [requirements, links, cells, testCases]
  )

  const summary: CoverageSummary = useMemo(
    () => mapCoverageSummary(beSummary, rows),
    [beSummary, rows]
  )

  const createLink = useCallback(
    async (body: {
      sourceType: string
      sourceId: string
      targetType: string
      targetId: string
      linkType: string
    }) => {
      if (!projectId) return
      await api.createTraceLink(projectId, body)
    },
    [projectId]
  )

  const linkTestsToRequirement = useCallback(
    async (requirementId: string, testCaseIds: string[]) => {
      if (!projectId) return
      try {
        await api.linkTestCasesToRequirement(projectId, requirementId, testCaseIds)
      } catch {
        // Fallback: batch endpoint, then single creates
        try {
          await api.batchCreateTraceLinks(projectId, {
            links: testCaseIds.map((testCaseId) => ({
              sourceType: 'REQUIREMENT',
              sourceId: requirementId,
              targetType: 'TEST_CASE',
              targetId: testCaseId,
              linkType: TraceLinkType.TestedBy,
            })),
          })
        } catch {
          const existing = new Set(
            links
              .filter(
                (l) =>
                  l.sourceType.toUpperCase() === 'REQUIREMENT' &&
                  l.sourceId === requirementId &&
                  l.targetType.toUpperCase() === 'TEST_CASE'
              )
              .map((l) => l.targetId)
          )
          for (const testCaseId of testCaseIds) {
            if (existing.has(testCaseId)) continue
            await api.createTraceLink(projectId, {
              sourceType: 'REQUIREMENT',
              sourceId: requirementId,
              targetType: 'TEST_CASE',
              targetId: testCaseId,
              linkType: TraceLinkType.TestedBy,
            })
          }
        }
      }
      await load()
    },
    [projectId, links, load]
  )

  const loadLinkableTestCases = useCallback(
    async (requirementId: string, q?: string) => {
      if (!projectId) return [] as api.LinkableTestCase[]
      try {
        const res = await api.listLinkableTestCases(projectId, requirementId, {
          q,
          limit: 50,
        })
        return res.items
      } catch {
        return testCases.filter((tc) => {
          const linked = links.some(
            (l) =>
              l.sourceType.toUpperCase() === 'REQUIREMENT' &&
              l.sourceId === requirementId &&
              l.targetType.toUpperCase() === 'TEST_CASE' &&
              l.targetId === tc.id
          )
          return !linked
        })
      }
    },
    [projectId, testCases, links]
  )

  return {
    cells,
    links,
    requirements,
    testCases,
    rows,
    summary,
    loading,
    error,
    coverageUnavailable,
    refetch: load,
    createLink,
    linkTestsToRequirement,
    loadLinkableTestCases,
  }
}

export function useApplicationRegistry(workspaceId: string | null) {
  const [items, setItems] = useState<api.ApplicationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listApplications(workspaceId)
      setItems(res.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (name: string, code: string) => {
      if (!workspaceId) return
      await api.createApplication(workspaceId, { name, code })
      await load()
    },
    [workspaceId, load]
  )

  const update = useCallback(
    async (applicationId: string, name: string) => {
      if (!workspaceId) return
      await api.updateApplication(workspaceId, applicationId, { name })
      await load()
    },
    [workspaceId, load]
  )

  return { items, loading, error, refetch: load, create, update }
}
