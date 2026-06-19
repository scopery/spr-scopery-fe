'use client'

import { Box, Button, Input, Select, Typography, Badge } from '@/shared/ui'
import { useRuntimeUsagePanel } from '../hooks/useRuntimeUsagePanel'

type Props = {
  orgId: string
  canViewRuntime: boolean
  canViewUsage: boolean
  canViewPrompts: boolean
}

export function RuntimeUsagePanel({ orgId, canViewRuntime, canViewUsage, canViewPrompts }: Props) {
  const panel = useRuntimeUsagePanel({ orgId, canViewRuntime, canViewUsage })

  if (panel.loading) {
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

      {panel.metadata ? (
        <div className="border-border rounded border p-3 text-sm">
          <Typography variant="small" className="font-medium">
            Runtime status
          </Typography>
          <Typography variant="small" tone="muted">
            Org runtime: {panel.metadata.org_runtime_enabled ? 'enabled' : 'disabled'} · Strict mode:{' '}
            {panel.metadata.org_runtime_strict ? 'on' : 'off'} · Budget: {panel.metadata.budget_enforcement}
          </Typography>
        </div>
      ) : null}

      {canViewRuntime ? (
        <div className="border-border space-y-3 rounded-md border p-4">
          <Typography variant="small" className="font-medium">
            Resolution preview
          </Typography>
          <Select
            label="Feature key"
            value={panel.featureKey}
            onValueChange={(v: string) => panel.setFeatureKey(v)}
            options={(panel.metadata?.feature_keys ?? ['answer_improve']).map((key) => ({
              value: key,
              label: key,
            }))}
          />
          <Input
            label="Org agent key (optional)"
            value={panel.orgAgentKey}
            onChange={(e) => panel.setOrgAgentKey(e.target.value)}
          />
          <Input
            label="Binding key"
            value={panel.bindingKey}
            onChange={(e) => panel.setBindingKey(e.target.value)}
          />
          <Button
            variant="outline"
            size="sm"
            loading={panel.previewLoading}
            onClick={() => void panel.handlePreview()}
          >
            Preview resolution
          </Button>
          {panel.preview ? (
            <div className="border-border space-y-1 rounded border p-3 text-sm">
              <div>
                Source:{' '}
                <Badge variant="soft" size="sm">
                  {panel.preview.resolution_source}
                </Badge>
              </div>
              <Typography variant="small" tone="muted">
                Provider/model: {panel.preview.provider}/{panel.preview.model_name} · mode{' '}
                {panel.preview.mode ?? '—'}
              </Typography>
              <Typography variant="small" tone="muted">
                Org agent: {panel.preview.org_agent_key ?? 'none'} · Prompt template:{' '}
                {panel.preview.prompt_template_id ?? 'none'}
              </Typography>
              {panel.preview.fallback_reason ? (
                <Typography variant="small" tone="muted">
                  Fallback: {panel.preview.fallback_reason}
                </Typography>
              ) : null}
              {panel.preview.warnings.length > 0 ? (
                <Typography variant="small" tone="muted">
                  Warnings: {panel.preview.warnings.join('; ')}
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
          {panel.summary ? (
            <div className="grid gap-3 md:grid-cols-3">
              <div className="border-border rounded border p-3">
                <Typography variant="small" tone="muted">
                  Total runs
                </Typography>
                <Typography variant="small" className="font-medium">
                  {panel.summary.total_runs}
                </Typography>
              </div>
              <div className="border-border rounded border p-3">
                <Typography variant="small" tone="muted">
                  Total tokens
                </Typography>
                <Typography variant="small" className="font-medium">
                  {panel.summary.total_tokens}
                </Typography>
              </div>
              <div className="border-border rounded border p-3">
                <Typography variant="small" tone="muted">
                  Est. cost ({panel.summary.currency})
                </Typography>
                <Typography variant="small" className="font-medium">
                  {panel.summary.estimated_cost_total ?? '—'}
                </Typography>
              </div>
            </div>
          ) : null}

          <Select
            label="Run status filter"
            value={panel.statusFilter}
            onValueChange={(v: string) => panel.setStatusFilter(v)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'succeeded', label: 'Succeeded' },
              { value: 'failed', label: 'Failed' },
              { value: 'fallback', label: 'Fallback' },
            ]}
          />

          <Typography variant="small" className="font-medium">
            Run history ({panel.runs.length})
          </Typography>
          {panel.runs.length === 0 ? (
            <Typography variant="small" tone="muted">
              No org runtime runs recorded yet.
            </Typography>
          ) : (
            <ul className="space-y-2">
              {panel.runs.map((run) => (
                <li key={run.id} className="border-border rounded border p-3 text-sm">
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
