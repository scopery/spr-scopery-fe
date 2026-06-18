'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Pencil } from 'lucide-react'
import {
  Typography,
  Button,
  ContentLoader,
  Select,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { FEATURES } from '@/config/features'
import { useAuth } from '@/contexts/AuthContext'
import * as aiAgentService from '@/services/ai-agent-control.service'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog'
import {
  AIAgentStatusBadge,
  AIAgentVersionStatusBadge,
  formatEstimatedCost,
  formatTokens,
} from '@/shared/components/ai-agent-control/ai-agent-badges'
import { AIAgentUsageSummaryCards } from '@/shared/components/ai-agent-control/ai-agent-usage-summary-cards'
import { AIAgentRoutingPanel } from '@/shared/components/ai-agent-control/ai-agent-routing-panel'
import { AIAgentPlaygroundPanel } from '@/shared/components/ai-agent-control/ai-agent-playground-panel'
import { AIAgentQualityPanel } from '@/shared/components/ai-agent-control/ai-agent-quality-panel'
import type {
  AIRunLogItem,
  AIUsageSummary,
} from '@/types/ai-agent-control'
import { cn } from '@/utils'
import { useAiAgentDetail } from '@/hooks/useAiAgents'

type TabId = 'overview' | 'versions' | 'usage' | 'run-logs' | 'routing' | 'playground' | 'quality'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'versions', label: 'Versions' },
  { id: 'playground', label: 'Playground' },
  { id: 'quality', label: 'Quality' },
  { id: 'routing', label: 'Routing' },
  { id: 'usage', label: 'Usage' },
  { id: 'run-logs', label: 'Run Logs' },
]

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'success', label: 'Success' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'skipped', label: 'Skipped' },
]

export default function AdminAIAgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const agentId = params.agentId as string
  const orgId = profile?.default_org_id ?? ''

  const { agent, loading, refetch: refetchAgent } = useAiAgentDetail(agentId)
  const [tab, setTab] = useState<TabId>('overview')
  const [usage, setUsage] = useState<AIUsageSummary | null>(null)
  const [runLogs, setRunLogs] = useState<AIRunLogItem[]>([])
  const [runLogsTotal, setRunLogsTotal] = useState(0)
  const [runLogOffset, setRunLogOffset] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const [creatingDraft, setCreatingDraft] = useState(false)
  const [publishVersionId, setPublishVersionId] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)

  const loadUsage = useCallback(async () => {
    if (!agentId || !orgId) return
    try {
      const data = await aiAgentService.getAgentUsageSummary(agentId, { org_id: orgId })
      setUsage(data)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }, [agentId, orgId])

  const loadRunLogs = useCallback(async () => {
    if (!agentId || !orgId) return
    try {
      const data = await aiAgentService.listAgentRunLogs(agentId, {
        org_id: orgId,
        status: statusFilter || undefined,
        limit: 20,
        offset: runLogOffset,
      })
      setRunLogs(data.items)
      setRunLogsTotal(data.page.total)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }, [agentId, orgId, statusFilter, runLogOffset])

  useEffect(() => {
    if (!FEATURES.aiAdminAgents) {
      router.replace(ROUTES.admin.templates)
    }
  }, [router])

  useEffect(() => {
    if (tab === 'usage') loadUsage()
  }, [tab, loadUsage])

  useEffect(() => {
    if (tab === 'run-logs') loadRunLogs()
  }, [tab, loadRunLogs])

  const handleCreateDraft = async () => {
    setCreatingDraft(true)
    try {
      const version = await aiAgentService.createDraftFromPublished(agentId)
      toast.success('Draft version created')
      router.push(ROUTES.admin.aiAgentVersion(agentId, version.id))
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setCreatingDraft(false)
    }
  }

  const handlePublish = async () => {
    if (!publishVersionId) return
    setPublishing(true)
    try {
      await aiAgentService.publishAgentVersion(agentId, publishVersionId)
      toast.success('Version published')
      setPublishVersionId(null)
      await refetchAgent()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setPublishing(false)
    }
  }

  if (!FEATURES.aiAdminAgents) return null

  if (loading || !agent) {
    return (
      <div className="mx-auto max-w-6xl">
        <ContentLoader />
      </div>
    )
  }

  const publishedModel = agent.publishedVersion

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <Link
          href={ROUTES.admin.aiAgents}
          className="mb-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft size={16} />
          Back to AI Agents
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Typography as="h1" size="xl" weight="bold">
                {agent.name}
              </Typography>
              <AIAgentStatusBadge status={agent.status} />
            </div>
            <Typography variant="small" tone="muted">
              {agent.key} · {agent.feature}
            </Typography>
            {agent.description ? (
              <Typography variant="small" className="mt-2 max-w-2xl text-neutral-700">
                {agent.description}
              </Typography>
            ) : null}
          </div>
          <Button
            variant="primary"
            size="md"
            className="gap-2 bg-neutral-900"
            onClick={handleCreateDraft}
            disabled={creatingDraft || !agent.publishedVersion}
          >
            <Plus size={16} />
            Create draft from published
          </Button>
        </div>
        {!agent.publishedVersion ? (
          <Typography variant="small" tone="muted" className="mt-2 text-amber-700">
            No published version. Future AI runs will not use this agent until a version is published.
          </Typography>
        ) : null}
      </div>

      <div className="mb-6 flex gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              tab === t.id
                ? 'border-b-2 border-neutral-900 text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-800',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-neutral-200 p-4">
              <Typography variant="xs" className="mb-2 text-neutral-500 uppercase">
                Published version
              </Typography>
              <Typography>
                {publishedModel
                  ? `v${publishedModel.versionNumber} (${publishedModel.status})`
                  : 'None'}
              </Typography>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4">
              <Typography variant="xs" className="mb-2 text-neutral-500 uppercase">
                Current model
              </Typography>
              <Typography>
                {publishedModel?.modelName ?? '—'}
                {publishedModel?.modelTier ? ` · ${publishedModel.modelTier}` : ''}
              </Typography>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4">
              <Typography variant="xs" className="mb-2 text-neutral-500 uppercase">
                Runs this month
              </Typography>
              <Typography>
                {agent.usageThisMonth?.totalRuns?.toLocaleString() ?? '—'}
              </Typography>
            </div>
            <div className="rounded-lg border border-neutral-200 p-4">
              <Typography variant="xs" className="mb-2 text-neutral-500 uppercase">
                Est. cost this month
              </Typography>
              <Typography>
                {agent.usageThisMonth
                  ? formatEstimatedCost(
                      agent.usageThisMonth.totalEstimatedCost,
                      agent.usageThisMonth.currency,
                    )
                  : orgId
                    ? 'No data'
                    : 'Set default org in profile for org-scoped usage'}
              </Typography>
            </div>
          </div>
        </div>
      )}

      {tab === 'versions' && (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Version</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 font-medium">Updated</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {agent.versions.map((version) => {
                const editable = version.status === 'draft' || version.status === 'testing'
                return (
                  <tr key={version.id} className="border-b border-neutral-100">
                    <td className="px-4 py-3">v{version.versionNumber}</td>
                    <td className="px-4 py-3">
                      <AIAgentVersionStatusBadge status={version.status} />
                    </td>
                    <td className="px-4 py-3">{version.modelName ?? '—'}</td>
                    <td className="px-4 py-3">
                      {version.publishedAt
                        ? new Date(version.publishedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {new Date(version.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {editable ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(ROUTES.admin.aiAgentVersion(agentId, version.id))
                            }
                          >
                            <Pencil size={14} className="mr-1" />
                            Edit
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(ROUTES.admin.aiAgentVersion(agentId, version.id))
                            }
                          >
                            View
                          </Button>
                        )}
                        {editable ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setPublishVersionId(version.id)}
                          >
                            Publish
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'playground' && agent && (
        <AIAgentPlaygroundPanel agentId={agentId} orgId={orgId || undefined} />
      )}

      {tab === 'quality' && agent && (
        <AIAgentQualityPanel agentId={agentId} orgId={orgId || undefined} />
      )}

      {tab === 'routing' && agent && (
        <AIAgentRoutingPanel agentId={agentId} agentKey={agent.key} orgId={orgId || undefined} />
      )}

      {tab === 'usage' && (
        <div className="space-y-4">
          {!orgId ? (
            <Typography tone="muted">
              Usage metrics require a default organization on your profile.
            </Typography>
          ) : usage ? (
            <>
              <Typography variant="small" tone="muted">
                Org-scoped usage for your default workspace. Costs are estimates, not invoice-grade
                billing.
              </Typography>
              <AIAgentUsageSummaryCards summary={usage} />
            </>
          ) : (
            <ContentLoader />
          )}
        </div>
      )}

      {tab === 'run-logs' && (
        <div className="space-y-4">
          {!orgId ? (
            <Typography tone="muted">
              Run logs require a default organization on your profile.
            </Typography>
          ) : (
            <>
              <div className="max-w-xs">
                <Select
                  options={STATUS_FILTER_OPTIONS}
                  value={statusFilter}
                  onValueChange={(v: string) => {
                    setStatusFilter(v)
                    setRunLogOffset(0)
                  }}
                  size="sm"
                />
              </div>
              <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Created</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Mode</th>
                      <th className="px-4 py-3 font-medium">Model</th>
                      <th className="px-4 py-3 font-medium">Tokens</th>
                      <th className="px-4 py-3 font-medium">Cost</th>
                      <th className="px-4 py-3 font-medium">Latency</th>
                      <th className="px-4 py-3 font-medium">Feedback</th>
                      <th className="px-4 py-3 font-medium">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runLogs.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-4 py-8 text-center text-neutral-500">
                          No runs found
                        </td>
                      </tr>
                    ) : (
                      runLogs.map((run) => (
                        <tr key={run.runId} className="border-b border-neutral-100">
                          <td className="px-4 py-3">
                            {new Date(run.createdAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3">{run.status}</td>
                          <td className="px-4 py-3">{run.mode ?? '—'}</td>
                          <td className="px-4 py-3">{run.modelName ?? '—'}</td>
                          <td className="px-4 py-3">{formatTokens(run.totalTokens)}</td>
                          <td className="px-4 py-3">
                            {formatEstimatedCost(run.estimatedCost, run.currency)}
                          </td>
                          <td className="px-4 py-3">
                            {run.latencyMs != null ? `${run.latencyMs} ms` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {run.feedbackCount
                              ? `${run.latestFeedbackRating ?? '—'} (${run.feedbackCount})`
                              : '—'}
                          </td>
                          <td className="px-4 py-3 max-w-[200px] truncate">
                            {run.errorCode ?? run.safeErrorMessage ?? '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between">
                <Typography variant="small" tone="muted">
                  Showing {runLogOffset + 1}–{Math.min(runLogOffset + 20, runLogsTotal)} of{' '}
                  {runLogsTotal}
                </Typography>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={runLogOffset === 0}
                    onClick={() => setRunLogOffset(Math.max(0, runLogOffset - 20))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={runLogOffset + 20 >= runLogsTotal}
                    onClick={() => setRunLogOffset(runLogOffset + 20)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={publishVersionId != null}
        onClose={() => setPublishVersionId(null)}
        title="Publish agent version"
        message="Publishing this version will make it active for future AI runs using this agent."
        confirmLabel="Publish"
        onConfirm={handlePublish}
        loading={publishing}
      />
    </div>
  )
}
