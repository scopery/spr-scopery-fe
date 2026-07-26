'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { aiRecommendationApi } from '@/modules/ai-recommendation'
import { projectControlApi } from '@/modules/project-control'
import * as api from '../../infrastructure/api/reporting.api'
import { PROJECT_REPORT_KEYS } from '../../infrastructure/api/reporting.api'
import {
  mapActivityFeedItem,
  type ActivityFeedItem,
  type ProjectDashboardSummary,
} from '../../domain/model/report'
import type {
  PulseFilterOption,
  PulsePeriodFilter,
  ProjectPulseViewModel,
} from '../../domain/model/project-pulse'
import { mapProjectPulseViewModel } from '../view-models/project-pulse.vm'
import {
  buildPulseVisitSnapshot,
  readPulseVisitSnapshot,
  writePulseVisitSnapshot,
  type PulseVisitSnapshot,
} from '../view-models/project-pulse-p1.vm'
import { asRecord, firstStr } from '../view-models/insight-field'

export function useProjectDashboard(
  workspaceId: string | null,
  projectId: string | null
) {
  const router = useRouter()
  const [data, setData] = useState<ProjectDashboardSummary | null>(null)
  const [healthPayload, setHealthPayload] = useState<Record<string, unknown> | null>(null)
  const [kpisPayload, setKpisPayload] = useState<Record<string, unknown> | null>(null)
  const [attentionPayload, setAttentionPayload] = useState<Record<string, unknown> | null>(
    null
  )
  const [reports, setReports] = useState<Record<string, Record<string, unknown>>>({})
  const [activity, setActivity] = useState<ActivityFeedItem[]>([])
  const [recommendations, setRecommendations] = useState<
    Array<{ id: string; title: string; summary?: string | null; suggestionRef?: string }>
  >([])
  const [baselineOptions, setBaselineOptions] = useState<PulseFilterOption[]>([
    { value: 'current', label: 'Current baseline' },
  ])
  const [baselineMeta, setBaselineMeta] = useState<{
    currentId: string | null
    createdAtById: Record<string, string>
    nameById: Record<string, string>
  }>({ currentId: null, createdAtById: {}, nameById: {} })
  const [phaseOptions, setPhaseOptions] = useState<PulseFilterOption[]>([
    { value: 'all', label: 'All phases' },
  ])
  const [period, setPeriod] = useState<PulsePeriodFilter>('last_visit')
  const [phase, setPhase] = useState('all')
  const [baseline, setBaseline] = useState('current')
  const [lastVisit, setLastVisit] = useState<PulseVisitSnapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [dash, health, kpis, attention, feed, baselineList, recs, ...reportResults] =
        await Promise.all([
          api.getProjectDashboard(projectId),
          api.getProjectDashboardHealth(projectId),
          api.getProjectDashboardKpis(projectId),
          api.getProjectDashboardAttention(projectId),
          api
            .listActivityFeed(projectId)
            .catch(() => ({ items: [] as Record<string, unknown>[] })),
          projectControlApi.listBaselines(projectId).catch(() => []),
          aiRecommendationApi
            .listRecommendations(
              { projectId, workspaceId: workspaceId ?? undefined },
              { skipErrorToast: true }
            )
            .catch(() => ({ items: [] })),
          ...PROJECT_REPORT_KEYS.map((key) =>
            api.getProjectReport(projectId, key).catch(() => ({} as Record<string, unknown>))
          ),
        ])
      setData(dash)
      setHealthPayload(health)
      setKpisPayload(kpis)
      setAttentionPayload(attention)
      setActivity(
        (feed.items ?? []).map((row, index) =>
          mapActivityFeedItem(row as Record<string, unknown>, index)
        )
      )
      const next: Record<string, Record<string, unknown>> = {}
      PROJECT_REPORT_KEYS.forEach((key, i) => {
        next[key] = reportResults[i] as Record<string, unknown>
      })
      setReports(next)

      const createdAtById: Record<string, string> = {}
      const nameById: Record<string, string> = {}
      let currentId: string | null = null
      const options: PulseFilterOption[] = [{ value: 'current', label: 'Current baseline' }]
      baselineList.forEach((b) => {
        createdAtById[b.id] = b.createdAt
        nameById[b.id] = b.name || `Baseline #${b.baselineNumber}`
        if (b.currentFlag) currentId = b.id
        options.push({
          value: b.id,
          label: `${b.name || `Baseline #${b.baselineNumber}`}${b.currentFlag ? ' · current' : ''}`,
        })
      })
      setBaselineOptions(options)
      setBaselineMeta({ currentId, createdAtById, nameById })

      setRecommendations(
        (recs.items ?? []).map((item) => ({
          id: item.id,
          title: item.title,
          summary: item.summary,
          suggestionRef: item.suggestionRef ?? item.id,
        }))
      )

      const schedule = asRecord(next['schedule-risk'])
      const phasesRaw = schedule.phases ?? asRecord(next['baseline-vs-current']).phases
      const phaseOpts: PulseFilterOption[] = [{ value: 'all', label: 'All phases' }]
      if (Array.isArray(phasesRaw)) {
        phasesRaw.forEach((row, index) => {
          const item = asRecord(row)
          const id = firstStr(item, ['id', 'code']) ?? `phase-${index}`
          const label = firstStr(item, ['name', 'label', 'title']) ?? `Phase ${index + 1}`
          phaseOpts.push({ value: id, label })
        })
      }
      setPhaseOptions(phaseOpts)

      setLastVisit(readPulseVisitSnapshot(projectId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [projectId, workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const selectedBaselineId =
    baseline === 'current' ? baselineMeta.currentId : baseline || baselineMeta.currentId

  const pulse: ProjectPulseViewModel | null = useMemo(() => {
    if (!workspaceId || !projectId || !data) return null
    return mapProjectPulseViewModel({
      dashboard: data,
      healthPayload,
      kpisPayload,
      attentionPayload,
      reports,
      activity,
      period,
      lastVisit,
      baselineName: selectedBaselineId
        ? baselineMeta.nameById[selectedBaselineId] ?? 'Current baseline'
        : 'Current baseline',
      baselineCreatedAt: selectedBaselineId
        ? baselineMeta.createdAtById[selectedBaselineId] ?? null
        : null,
      recommendations,
      routes: {
        overview: ROUTES.workspace.projectOverview(workspaceId, projectId),
        wbs: ROUTES.workspace.projectWbs(workspaceId, projectId),
        work: ROUTES.workspace.projectWork(workspaceId, projectId),
        schedule: ROUTES.workspace.projectSchedule(workspaceId, projectId),
        timeline: ROUTES.workspace.projectTimeline(workspaceId, projectId),
        estimation: ROUTES.workspace.projectEstimation(workspaceId, projectId),
        resources: ROUTES.workspace.projectResources(workspaceId, projectId),
        baselines: ROUTES.workspace.projectBaselines(workspaceId, projectId),
        changeRequests: ROUTES.workspace.projectChangeRequests(workspaceId, projectId),
        raid: ROUTES.workspace.projectRaid(workspaceId, projectId),
        financials: ROUTES.workspace.projectFinancials(workspaceId, projectId),
        quality: ROUTES.workspace.projectQuality(workspaceId, projectId),
        traceability: ROUTES.workspace.projectTraceability(workspaceId, projectId),
        functionalCatalog: ROUTES.workspace.projectFunctionalCatalog(workspaceId, projectId),
        capacity: ROUTES.workspace.capacity(workspaceId),
        recommendations: ROUTES.workspace.projectRecommendations(workspaceId, projectId),
      },
    })
  }, [
    workspaceId,
    projectId,
    data,
    healthPayload,
    kpisPayload,
    attentionPayload,
    reports,
    activity,
    period,
    lastVisit,
    selectedBaselineId,
    baselineMeta,
    recommendations,
  ])

  // Persist visit snapshot once per successful load (after user has seen deltas vs prior visit).
  const visitSavedRef = useRef(false)
  useEffect(() => {
    if (loading) {
      visitSavedRef.current = false
      return
    }
    if (!projectId || !pulse || !data || visitSavedRef.current) return
    visitSavedRef.current = true
    const snapshot = buildPulseVisitSnapshot({
      dashboard: data,
      capacity: pulse.capacity,
      progress: pulse.progress,
    })
    const timer = window.setTimeout(() => {
      writePulseVisitSnapshot(projectId, snapshot)
    }, 1500)
    return () => window.clearTimeout(timer)
  }, [projectId, loading, pulse, data])

  const reviewSelectedSuggestions = useCallback(
    async (ids: string[]) => {
      if (!workspaceId || !projectId) return
      await Promise.all(
        ids.map(async (id) => {
          try {
            await aiRecommendationApi.markRecommendationViewed(id, { skipErrorToast: true })
          } catch {
            // optional endpoint — ignore
          }
        })
      )
      router.push(ROUTES.workspace.projectRecommendations(workspaceId, projectId))
    },
    [workspaceId, projectId, router]
  )

  return {
    data,
    pulse,
    activity,
    loading,
    error,
    refetch: load,
    filters: {
      period,
      setPeriod,
      phase,
      setPhase,
      phaseOptions,
      baseline,
      setBaseline,
      baselineOptions,
    },
    reviewSelectedSuggestions,
  }
}
