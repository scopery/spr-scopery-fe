'use client'

import { Typography, Button, ContentLoader, Select } from '@/shared/ui'
import type { AIFeedbackStatus } from '@/modules/admin/ai-feedback'
import { FEEDBACK_STATUSES } from '@/modules/admin/ai-feedback'
import { useAIAgentQualityPanel } from '../hooks/useAIAgentQualityPanel'

interface AIAgentQualityPanelProps {
  agentId: string
  orgId?: string
}

function pct(value: number | null): string {
  if (value == null) return '—'
  return `${Math.round(value * 1000) / 10}%`
}

export function AIAgentQualityPanel({ agentId, orgId }: AIAgentQualityPanelProps) {
  const panel = useAIAgentQualityPanel({ agentId, orgId })

  if (panel.loading || !panel.summary) return <ContentLoader />

  const topCategory = panel.summary.feedbackByCategory[0]

  return (
    <div className="space-y-6">
      <Typography variant="small" tone="muted">
        Quality monitoring from user feedback on AI runs. This does not automatically change prompts
        or disable agents.
      </Typography>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total feedback', value: panel.summary.totalFeedback },
          { label: 'Negative feedback', value: panel.summary.negativeCount },
          { label: 'Negative rate', value: pct(panel.summary.negativeRate) },
          { label: 'Top issue', value: topCategory?.category ?? '—' },
        ].map((card) => (
          <div key={card.label} className="rounded-lg border border-neutral-200 bg-white p-4">
            <Typography variant="xs" tone="muted">
              {card.label}
            </Typography>
            <Typography size="lg" weight="semibold">
              {card.value}
            </Typography>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <Typography weight="medium" className="mb-3">
            Prompt version quality
          </Typography>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100 text-left">
                  <th className="py-2 pr-3">Version</th>
                  <th className="py-2 pr-3">Runs</th>
                  <th className="py-2 pr-3">Feedback</th>
                  <th className="py-2 pr-3">Negative rate</th>
                </tr>
              </thead>
              <tbody>
                {panel.versions.map((version) => (
                  <tr key={version.agentVersionId} className="border-b border-neutral-50">
                    <td className="py-2 pr-3">
                      v{version.versionNumber} ({version.versionStatus})
                    </td>
                    <td className="py-2 pr-3">{version.runCount}</td>
                    <td className="py-2 pr-3">{version.feedbackCount}</td>
                    <td className="py-2 pr-3">{pct(version.negativeRate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-4">
          <Typography weight="medium" className="mb-3">
            Run health
          </Typography>
          <Typography variant="small">Failed runs: {panel.summary.failedRuns}</Typography>
          <Typography variant="small">
            Failed runs with feedback: {panel.summary.failedRunsWithFeedback}
          </Typography>
          <Typography variant="small">Runs with feedback: {panel.summary.runsWithFeedback}</Typography>
        </div>
      </div>

      <div className="flex max-w-xs items-end gap-2">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-neutral-700">Status filter</label>
          <Select
            options={[{ value: '', label: 'All statuses' }, ...FEEDBACK_STATUSES]}
            value={panel.statusFilter}
            onValueChange={panel.setStatusFilter}
            className="w-full"
            size="sm"
          />
        </div>
      </div>

      {panel.feedback.length === 0 ? (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
          <Typography tone="muted">No feedback yet for this agent.</Typography>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Preview</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {panel.feedback.map((item) => (
                <tr key={item.feedbackId} className="border-b border-neutral-100">
                  <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{item.rating}</td>
                  <td className="px-4 py-3">{item.feedbackCategory ?? '—'}</td>
                  <td className="max-w-xs truncate px-4 py-3">{item.feedbackTextPreview ?? '—'}</td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => panel.setSelected(item)}>
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {panel.selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-6 shadow-lg">
            <Typography as="h2" size="lg" weight="semibold" className="mb-4">
              Feedback detail
            </Typography>
            <div className="space-y-2 text-sm">
              <p>Run ID: {panel.selected.runId}</p>
              <p>Rating: {panel.selected.rating}</p>
              <p>Category: {panel.selected.feedbackCategory ?? '—'}</p>
              <p>Comment: {panel.selected.feedbackTextPreview ?? '—'}</p>
              <p>Run status: {panel.selected.runStatus ?? '—'}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(['reviewed', 'action_required', 'resolved', 'dismissed'] as AIFeedbackStatus[]).map(
                (status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant="outline"
                    disabled={panel.updating}
                    onClick={() => void panel.updateStatus(status)}
                  >
                    Mark {status.replace('_', ' ')}
                  </Button>
                )
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => panel.setSelected(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
