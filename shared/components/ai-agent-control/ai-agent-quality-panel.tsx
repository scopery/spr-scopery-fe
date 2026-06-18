'use client'

import { useCallback, useEffect, useState } from 'react'
import { Typography, Button, ContentLoader, Select } from '@/shared/ui'
import * as feedbackService from '@/services/ai-run-feedback.service'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type {
  AIRunFeedbackListItem,
  AIQualitySummary,
  AIFeedbackStatus,
  AIPromptVersionQualityItem,
} from '@/types/ai-run-feedback'
import { FEEDBACK_STATUSES } from '@/types/ai-run-feedback'

interface AIAgentQualityPanelProps {
  agentId: string
  orgId?: string
}

function pct(value: number | null): string {
  if (value == null) return '—'
  return `${Math.round(value * 1000) / 10}%`
}

export function AIAgentQualityPanel({ agentId, orgId }: AIAgentQualityPanelProps) {
  const [summary, setSummary] = useState<AIQualitySummary | null>(null)
  const [feedback, setFeedback] = useState<AIRunFeedbackListItem[]>([])
  const [versions, setVersions] = useState<AIPromptVersionQualityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [selected, setSelected] = useState<AIRunFeedbackListItem | null>(null)
  const [updating, setUpdating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [summaryRes, feedbackRes, versionsRes] = await Promise.all([
        feedbackService.getAgentQualitySummary(agentId, { org_id: orgId }),
        feedbackService.listAgentFeedback(agentId, {
          org_id: orgId,
          status: statusFilter || undefined,
          limit: 25,
        }),
        feedbackService.getAgentVersionQuality(agentId, orgId),
      ])
      setSummary(summaryRes)
      setFeedback(feedbackRes.items)
      setVersions(versionsRes.items)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [agentId, orgId, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  const updateStatus = async (status: AIFeedbackStatus) => {
    if (!selected) return
    setUpdating(true)
    try {
      await feedbackService.updateFeedbackStatus(selected.feedbackId, { status })
      toast.success('Feedback status updated.')
      setSelected(null)
      await load()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setUpdating(false)
    }
  }

  if (loading || !summary) return <ContentLoader />

  const topCategory = summary.feedbackByCategory[0]

  return (
    <div className="space-y-6">
      <Typography variant="small" tone="muted">
        Quality monitoring from user feedback on AI runs. This does not automatically change prompts
        or disable agents.
      </Typography>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total feedback', value: summary.totalFeedback },
          { label: 'Negative feedback', value: summary.negativeCount },
          { label: 'Negative rate', value: pct(summary.negativeRate) },
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
                {versions.map((version) => (
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
          <Typography variant="small">Failed runs: {summary.failedRuns}</Typography>
          <Typography variant="small">
            Failed runs with feedback: {summary.failedRunsWithFeedback}
          </Typography>
          <Typography variant="small">Runs with feedback: {summary.runsWithFeedback}</Typography>
        </div>
      </div>

      <div className="flex max-w-xs items-end gap-2">
        <div className="flex-1">
          <label className="mb-2 block text-sm font-medium text-neutral-700">Status filter</label>
          <Select
            options={[{ value: '', label: 'All statuses' }, ...FEEDBACK_STATUSES]}
            value={statusFilter}
            onValueChange={setStatusFilter}
            className="w-full"
            size="sm"
          />
        </div>
      </div>

      {feedback.length === 0 ? (
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
              {feedback.map((item) => (
                <tr key={item.feedbackId} className="border-b border-neutral-100">
                  <td className="px-4 py-3">{new Date(item.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{item.rating}</td>
                  <td className="px-4 py-3">{item.feedbackCategory ?? '—'}</td>
                  <td className="max-w-xs truncate px-4 py-3">{item.feedbackTextPreview ?? '—'}</td>
                  <td className="px-4 py-3">{item.status}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" onClick={() => setSelected(item)}>
                      Review
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg border border-neutral-200 bg-white p-6 shadow-lg">
            <Typography as="h2" size="lg" weight="semibold" className="mb-4">
              Feedback detail
            </Typography>
            <div className="space-y-2 text-sm">
              <p>Run ID: {selected.runId}</p>
              <p>Rating: {selected.rating}</p>
              <p>Category: {selected.feedbackCategory ?? '—'}</p>
              <p>Comment: {selected.feedbackTextPreview ?? '—'}</p>
              <p>Run status: {selected.runStatus ?? '—'}</p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {(['reviewed', 'action_required', 'resolved', 'dismissed'] as AIFeedbackStatus[]).map(
                (status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant="outline"
                    disabled={updating}
                    onClick={() => updateStatus(status)}
                  >
                    Mark {status.replace('_', ' ')}
                  </Button>
                ),
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
