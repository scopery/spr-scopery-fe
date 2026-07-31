'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Plus, Settings } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, PageSkeleton, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import * as qualityApi from '../../infrastructure/api/quality.api'
import {
  buildCompatOverview,
  mapQualityPlanToSettings,
} from '../../infrastructure/mappers/quality-compatibility.mapper'
import type { QualityOverviewResponse, QualitySettings } from '../../domain/model/quality'
import { QualitySingleAddModal } from './QualitySingleAddModal'
import type { QualityBulkKind, QualityCreateInput } from './quality-bulk.model'

function hrefForMetric(
  workspaceId: string,
  projectId: string,
  targetRoute: string,
  filterParams?: Record<string, string>
): string {
  if (targetRoute === 'cases') {
    return ROUTES.workspace.projectQualityCases(workspaceId, projectId, {
      type: filterParams?.type === 'nfr' ? 'nfr' : 'functional',
    })
  }
  if (targetRoute === 'runs') return ROUTES.workspace.projectQualityRuns(workspaceId, projectId)
  if (targetRoute === 'defects')
    return ROUTES.workspace.projectQualityDefects(workspaceId, projectId)
  if (targetRoute === 'releases') {
    return ROUTES.workspace.projectQualityReleases(workspaceId, projectId)
  }
  return ROUTES.workspace.projectQuality(workspaceId, projectId)
}

export function QualityOverviewView() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()
  const router = useRouter()
  const [overview, setOverview] = useState<QualityOverviewResponse | null>(null)
  const [settings, setSettings] = useState<QualitySettings | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quickAddKind, setQuickAddKind] = useState<QualityBulkKind | null>(null)

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [
        serverOverview,
        serverSettings,
        plans,
        testCases,
        verificationCases,
        runs,
        defects,
        releases,
      ] = await Promise.all([
        qualityApi.getQualityOverview(projectId),
        qualityApi.getQualitySettings(projectId),
        qualityApi.listQualityPlans(projectId),
        qualityApi.listTestCases(projectId, { page: 0, size: 1 }),
        qualityApi.listVerificationCases(projectId, { page: 0, size: 1 }),
        qualityApi.listTestRuns(projectId, { page: 0, size: 5 }),
        qualityApi.listDefects(projectId),
        qualityApi.listReleases(projectId),
      ])

      setOverview(
        serverOverview ??
          buildCompatOverview({
            projectId,
            functionalCaseCount: testCases.page?.total ?? testCases.items.length,
            nfrCaseCount: verificationCases.page?.total ?? verificationCases.items.length,
            recentRuns: runs.items,
            currentRelease: releases.items[0] ?? null,
            openCriticalDefects: defects.items.filter(
              (d) =>
                (d.severity === 'CRITICAL' || d.severity === 'BLOCKER') && d.status !== 'CLOSED'
            ).length,
          })
      )

      if (serverSettings) {
        setSettings(serverSettings)
      } else {
        const currentPlan =
          plans.items.find((p) => p.currentFlag || p.status === 'CURRENT') ?? plans.items[0]
        setSettings(currentPlan ? mapQualityPlanToSettings(currentPlan, projectId) : null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Quality overview')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  const handleQuickCreate = async (input: QualityCreateInput) => {
    if (!projectId) return
    if (input.kind === 'TEST_CASE') await qualityApi.createTestCase(projectId, input.payload)
    if (input.kind === 'TEST_RUN') await qualityApi.createTestRun(projectId, input.payload)
    if (input.kind === 'DEFECT') await qualityApi.createDefect(projectId, input.payload)
    if (input.kind === 'RELEASE') await qualityApi.createRelease(projectId, input.payload)
    setQuickAddKind(null)
    toast.success('Created')
    await load()
  }

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>
  if (!overview) return null

  return (
    <div className="space-y-4 px-3 py-3 lg:px-4 lg:py-3">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Quality Overview
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-0.5">
            Coverage, execution health, defects, and release readiness at a glance.
          </Typography>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" icon={<Settings size={14} />} onClick={() => setSettingsOpen(true)}>
            Settings
          </Button>
          <div className="relative">
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setQuickAddKind('TEST_CASE')}>
              Add
            </Button>
          </div>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {overview.metrics.map((metric) => (
          <Card
            as={Link}
            key={metric.key}
            href={hrefForMetric(workspaceId, projectId, metric.targetRoute, metric.filterParams)}
            className="p-3 hover:bg-neutral-50"
          >
            <Typography variant="caption" tone="muted">
              {metric.label}
            </Typography>
            <Typography size="md" weight="medium">
              {metric.value}
              {metric.unit ? metric.unit : ''}
            </Typography>
          </Card>
        ))}
      </div>

      <Card as="section" className="p-3">
        <Typography weight="medium" className="mb-2">
          Needs Attention
        </Typography>
        {overview.needsAttention.length === 0 ? (
          <Typography tone="muted" variant="small">
            No prioritized attention items from the server. Compat mode does not invent attention
            rows.
          </Typography>
        ) : (
          <ul className="space-y-2">
            {overview.needsAttention.slice(0, 5).map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge size="sm" tone={item.severity === 'CRITICAL' ? 'error' : 'warning'}>
                      {item.severity}
                    </Badge>
                    <Typography variant="small" weight="medium">
                      {item.title}
                    </Typography>
                  </div>
                  {item.description ? (
                    <Typography variant="caption" tone="muted">
                      {item.description}
                    </Typography>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    router.push(
                      hrefForMetric(workspaceId, projectId, item.targetRoute, item.filterParams)
                    )
                  }
                >
                  Open
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card as="section" className="p-3">
          <Typography weight="medium" className="mb-2">
            Recent runs
          </Typography>
          {overview.recentRuns.length === 0 ? (
            <Typography tone="muted" variant="small">
              No runs yet. Create a run to start execution.
            </Typography>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {overview.recentRuns.map((run) => (
                <li key={run.id} className="flex items-center justify-between py-2">
                  <div>
                    <Typography variant="small">{run.name}</Typography>
                    <Typography variant="caption" tone="muted">
                      {run.status} · {run.progressPercent}%
                    </Typography>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      router.push(
                        ROUTES.workspace.projectQualityRuns(workspaceId, projectId, {
                          runId: run.id,
                        })
                      )
                    }
                  >
                    Open
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card as="section" className="p-3">
          <Typography weight="medium" className="mb-2">
            Current release
          </Typography>
          {overview.currentRelease ? (
            <div className="space-y-2">
              <Typography variant="small" weight="medium">
                {overview.currentRelease.name}
                {overview.currentRelease.version ? ` · ${overview.currentRelease.version}` : ''}
              </Typography>
              <Badge size="sm">{overview.currentRelease.readinessStatus}</Badge>
              <div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    router.push(ROUTES.workspace.projectQualityReleases(workspaceId, projectId))
                  }
                >
                  Review readiness
                </Button>
              </div>
            </div>
          ) : (
            <Typography tone="muted" variant="small">
              No release package yet.
            </Typography>
          )}
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['TEST_CASE', 'Functional case'],
            ['TEST_RUN', 'Run'],
            ['DEFECT', 'Defect'],
            ['RELEASE', 'Release'],
          ] as const
        ).map(([kind, label]) => (
          <Button key={kind} size="sm" variant="outline" onClick={() => setQuickAddKind(kind)}>
            + {label}
          </Button>
        ))}
      </div>

      {settingsOpen ? (
        <Card className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <Typography weight="medium">Quality Settings</Typography>
            <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(false)}>
              Close
            </Button>
          </div>
          {settings ? (
            <div className="grid gap-2 text-sm">
              <Typography variant="caption" tone="muted">
                {settings.sourceQualityPlanId
                  ? `Mapped from Quality Plan ${settings.sourceQualityPlanId} until settings API ships.`
                  : 'Project quality settings'}
              </Typography>
              <div>
                Require use case for functional cases:{' '}
                {settings.coverageRules.requireUseCaseForFunctionalCases ? 'Yes' : 'No'}
              </div>
              <div>
                Require NFR for verification cases:{' '}
                {settings.nfrRules.requireThresholdForReady ? 'Yes' : 'No'}
              </div>
              <div>
                Max open blockers: {settings.defectThresholds.maxOpenBlockers} · Max open critical:{' '}
                {settings.defectThresholds.maxOpenCritical}
              </div>
              <div>
                Release gates: no blockers=
                {settings.releaseGates.requireNoOpenBlockers ? 'on' : 'off'}, no critical defects=
                {settings.releaseGates.requireNoOpenCriticalDefects ? 'on' : 'off'}
              </div>
            </div>
          ) : (
            <Typography tone="muted">No settings available yet.</Typography>
          )}
        </Card>
      ) : null}

      {quickAddKind ? (
        <QualitySingleAddModal
          open
          kind={quickAddKind}
          onClose={() => setQuickAddKind(null)}
          onCreate={handleQuickCreate}
        />
      ) : null}
    </div>
  )
}
