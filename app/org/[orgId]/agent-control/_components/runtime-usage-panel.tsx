'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Box, Button, Input, Select, Typography, Badge } from '@/shared/ui'
import * as agentControlService from '@/services/agent-control.service'
import type {
  OrgAgentRuntimeMetadata,
  OrgAgentRun,
  OrgRuntimeResolution,
  OrgRuntimeUsageSummary,
} from '@/types/agent-control'
import { ApiError } from '@/types/api'

type Props = {
  orgId: string
  canViewRuntime: boolean
  canViewUsage: boolean
  canViewPrompts: boolean
}

export function RuntimeUsagePanel({
  orgId,
  canViewRuntime,
  canViewUsage,
  canViewPrompts,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [metadata, setMetadata] = useState<OrgAgentRuntimeMetadata | null>(null)
  const [runs, setRuns] = useState<OrgAgentRun[]>([])
  const [summary, setSummary] = useState<OrgRuntimeUsageSummary | null>(null)
  const [featureKey, setFeatureKey] = useState('answer_improve')
  const [orgAgentKey, setOrgAgentKey] = useState('')
  const [bindingKey, setBindingKey] = useState('default')
  const [preview, setPreview] = useState<OrgRuntimeResolution | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [meta, runsRes, summaryRes] = await Promise.all([
        canViewRuntime ? agentControlService.getRuntimeMetadata(orgId) : Promise.resolve(null),
        canViewUsage
          ? agentControlService.listOrgAgentRuns(orgId, {
              status: statusFilter || undefined,
              limit: 50,
            })
          : Promise.resolve({ items: [], total: 0 }),
        canViewUsage
          ? agentControlService.getRuntimeUsageSummary(orgId)
          : Promise.resolve(null),
      ])
      setMetadata(meta)
      setRuns(runsRes.items)
      setSummary(summaryRes)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load runtime data')
    } finally {
      setLoading(false)
    }
  }, [orgId, canViewRuntime, canViewUsage, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const handlePreview = async () => {
    if (!canViewRuntime) return
    setPreviewLoading(true)
    try {
      const result = await agentControlService.previewRuntimeResolution(orgId, {
        feature_key: featureKey,
        org_agent_key: orgAgentKey.trim() || undefined,
        binding_key: bindingKey.trim() || undefined,
      })
      setPreview(result)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to preview resolution')
    } finally {
      setPreviewLoading(false)
    }
  }

  if (loading) {
    return (
      <Typography variant="small" tone="muted">
        Loading runtime & usage…
      </Typography>
    )
  }

  return (
    <Box className="space-y-4">
      <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100">
        Runtime resolution is opt-in via server flag. Preview does not execute AI. Cost figures are
        estimates only — not billing. Budget enforcement is deferred to a later phase.
      </div>

      {metadata ? (
        <div className="rounded border border-border p-3 text-sm">
          <Typography variant="small" className="font-medium">
            Runtime status
          </Typography>
          <Typography variant="small" tone="muted">
            Org runtime: {metadata.org_runtime_enabled ? 'enabled' : 'disabled'} · Strict mode:{' '}
            {metadata.org_runtime_strict ? 'on' : 'off'} · Budget: {metadata.budget_enforcement}
          </Typography>
        </div>
      ) : null}

      {canViewRuntime ? (
        <div className="space-y-3 rounded-md border border-border p-4">
          <Typography variant="small" className="font-medium">
            Resolution preview
          </Typography>
          <Select
            label="Feature key"
            value={featureKey}
            onValueChange={(v: string) => setFeatureKey(v)}
            options={(metadata?.feature_keys ?? ['answer_improve']).map((key) => ({
              value: key,
              label: key,
            }))}
          />
          <Input
            label="Org agent key (optional)"
            value={orgAgentKey}
            onChange={(e) => setOrgAgentKey(e.target.value)}
          />
          <Input
            label="Binding key"
            value={bindingKey}
            onChange={(e) => setBindingKey(e.target.value)}
          />
          <Button variant="outline" size="sm" loading={previewLoading} onClick={() => void handlePreview()}>
            Preview resolution
          </Button>
          {preview ? (
            <div className="space-y-1 rounded border border-border p-3 text-sm">
              <div>
                Source: <Badge variant="soft" size="sm">{preview.resolution_source}</Badge>
              </div>
              <Typography variant="small" tone="muted">
                Provider/model: {preview.provider}/{preview.model_name} · mode {preview.mode ?? '—'}
              </Typography>
              <Typography variant="small" tone="muted">
                Org agent: {preview.org_agent_key ?? 'none'} · Prompt template:{' '}
                {preview.prompt_template_id ?? 'none'}
              </Typography>
              {preview.fallback_reason ? (
                <Typography variant="small" tone="muted">
                  Fallback: {preview.fallback_reason}
                </Typography>
              ) : null}
              {preview.warnings.length > 0 ? (
                <Typography variant="small" tone="muted">
                  Warnings: {preview.warnings.join('; ')}
                </Typography>
              ) : null}
              {!canViewPrompts ? (
                <Typography variant="small" tone="muted">
                  Prompt content redacted — requires prompt_registry.view
                </Typography>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {canViewUsage ? (
        <>
          {summary ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded border border-border p-3">
                <Typography variant="small" tone="muted">
                  Total runs
                </Typography>
                <Typography variant="small" className="font-medium">
                  {summary.total_runs}
                </Typography>
              </div>
              <div className="rounded border border-border p-3">
                <Typography variant="small" tone="muted">
                  Total tokens
                </Typography>
                <Typography variant="small" className="font-medium">
                  {summary.total_tokens}
                </Typography>
              </div>
              <div className="rounded border border-border p-3">
                <Typography variant="small" tone="muted">
                  Est. cost ({summary.currency})
                </Typography>
                <Typography variant="small" className="font-medium">
                  {summary.estimated_cost_total ?? '—'}
                </Typography>
              </div>
            </div>
          ) : null}

          <Select
            label="Run status filter"
            value={statusFilter}
            onValueChange={(v: string) => setStatusFilter(v)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'succeeded', label: 'Succeeded' },
              { value: 'failed', label: 'Failed' },
              { value: 'fallback', label: 'Fallback' },
            ]}
          />

          <Typography variant="small" className="font-medium">
            Run history ({runs.length})
          </Typography>
          {runs.length === 0 ? (
            <Typography variant="small" tone="muted">
              No org runtime runs recorded yet.
            </Typography>
          ) : (
            <ul className="space-y-2">
              {runs.map((run) => (
                <li key={run.id} className="rounded border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>{run.feature_key}</span>
                    <Badge variant="soft" size="sm">
                      {run.status}
                    </Badge>
                  </div>
                  <Typography variant="small" tone="muted">
                    {new Date(run.created_at).toLocaleString()} · {run.provider}/{run.model_name} ·
                    tokens {run.total_tokens ?? '—'} · cost {run.estimated_cost ?? '—'}{' '}
                    {run.currency} · {run.latency_ms ?? '—'}ms
                  </Typography>
                  {run.fallback_reason ? (
                    <Typography variant="small" tone="muted">
                      Fallback: {run.fallback_reason}
                    </Typography>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </Box>
  )
}
