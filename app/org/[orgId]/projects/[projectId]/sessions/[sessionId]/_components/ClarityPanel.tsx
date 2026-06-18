'use client'

import { Typography, Button } from '@/shared/ui'
import type { ClaritySummary } from '@/types/aiClarity'
import { ClipboardCheck } from 'lucide-react'

function formatScore(score: number | undefined): string {
  if (score == null || !Number.isFinite(score)) return '—'
  return (score * 100).toFixed(0) + '%'
}

function barPercent(score: number | undefined): number {
  if (score == null || !Number.isFinite(score)) return 0
  return Math.min(100, Math.max(0, score * 100))
}

/** Map API readiness_label (e.g. not_ready, draft_ok_need_clarify) to display text. */
function formatReadinessLabel(raw: string | undefined): string {
  if (!raw) return '—'
  const map: Record<string, string> = {
    not_ready: 'Not ready',
    draft_ok_need_clarify: 'Draft OK, need clarify',
    ready: 'Ready',
  }
  return map[raw] ?? raw.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Map reason/code (e.g. low_clarity, missing_metrics) to display text. */
function formatReason(reason: string | undefined): string {
  if (!reason) return ''
  return reason.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** First question order for scroll target (blocker can have question_orders[] or question_order). */
function firstQuestionOrder(b: { question_order?: number; question_orders?: number[] }): number | undefined {
  if (b.question_orders?.length) return b.question_orders[0]
  return b.question_order
}

/** Display label for blocker/fix when prompt is missing. */
function blockerLabel(
  item: { section?: string; prompt?: string; question_order?: number; question_orders?: number[] }
): string {
  if (item.prompt?.trim()) return item.prompt
  const order = item.question_orders?.[0] ?? item.question_order
  const section = item.section ? `${item.section} — ` : ''
  return order != null ? `${section}Question ${order}` : section ? section.replace(/ — $/, '') : 'Question'
}

interface ClarityPanelProps {
  summary: ClaritySummary | null
  summaryLoading: boolean
  summaryError: boolean
  canAssess: boolean
  featureDisabled: boolean
  missingCount: number
  onScrollToQuestion: (questionOrder: number) => void
  onBulkAssess?: () => void
  bulkAssessLoading?: boolean
}

export function ClarityPanel({
  summary,
  summaryLoading,
  summaryError,
  canAssess,
  featureDisabled,
  missingCount,
  onScrollToQuestion,
  onBulkAssess,
  bulkAssessLoading = false,
}: ClarityPanelProps) {
  if (summaryLoading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-neutral-100 rounded animate-pulse" />
        <div className="h-20 bg-neutral-100 rounded animate-pulse" />
        <div className="h-24 bg-neutral-100 rounded animate-pulse" />
      </div>
    )
  }

  if (summaryError) {
    return (
      <Typography variant="small" tone="muted">
        Readiness unavailable
      </Typography>
    )
  }

  const s = summary
  const readinessLabelDisplay = formatReadinessLabel(s?.readiness_label)
  const overallReadiness = s?.overall_readiness ?? 0
  const coverageScore = s?.coverage_score
  const clarityScore = s?.clarity_score
  const topBlockers = s?.top_blockers ?? []
  const suggestedFixes = s?.suggested_fixes ?? []
  const stats = s?.stats
  const requiredTotal = stats?.required_total ?? 0
  const requiredAnswered = stats?.required_answered ?? 0
  const assessedCount = stats?.assessed_count ?? 0
  const missingAssessments = s?.missing_assessments ?? stats?.missing_assessments ?? missingCount

  const showBulkAssess = canAssess && !featureDisabled && missingAssessments > 0 && onBulkAssess

  return (
    <div className="space-y-4">
      <div>
        <Typography variant="small" weight="medium" className="text-neutral-500 mb-1">
          Readiness
        </Typography>
        <Typography size="lg" weight="semibold" className="text-neutral-900">
          {readinessLabelDisplay} {formatScore(overallReadiness)}
        </Typography>
        <div className="mt-2 space-y-1 text-xs text-neutral-600">
          <div className="font-medium text-neutral-500">Readiness guide</div>
          <div className="flex flex-col gap-0.5">
            <div className="flex">
              <span className="w-20 text-neutral-500">{'< 0.60'}</span>
              <span className="text-neutral-700">Not ready – many required answers missing or unclear.</span>
            </div>
            <div className="flex">
              <span className="w-20 text-neutral-500">0.60–0.80</span>
              <span className="text-neutral-700">
                Draft OK, needs clarification – baseline coverage but still ambiguous or incomplete areas.
              </span>
            </div>
            <div className="flex">
              <span className="w-20 text-neutral-500">{'> 0.80'}</span>
              <span className="text-neutral-700">
                Ready – requirements are mostly clear; only minor follow-ups remain.
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-xs text-neutral-600 mb-0.5">
            <span>Coverage</span>
            <span>{formatScore(coverageScore)}</span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${barPercent(coverageScore)}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-xs text-neutral-600 mb-0.5">
            <span>Clarity</span>
            <span>{formatScore(clarityScore)}</span>
          </div>
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-success transition-all duration-300"
              style={{ width: `${barPercent(clarityScore)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-neutral-200 pt-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-600">Required total</span>
          <span className="text-neutral-900">{requiredTotal}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Required answered</span>
          <span className="text-neutral-900">{requiredAnswered}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Assessed</span>
          <span className="text-neutral-900">{assessedCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-600">Missing assessments</span>
          <span className="text-error">{missingAssessments}</span>
        </div>
      </div>

      {topBlockers.length > 0 && (
        <div>
          <Typography variant="small" weight="medium" className="text-neutral-600 mb-2 block">
            Top blockers
          </Typography>
          <ul className="space-y-1.5">
            {topBlockers.map((b, i) => {
              const order = firstQuestionOrder(b)
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => order != null && onScrollToQuestion(order)}
                    className="text-left text-sm text-primary hover:underline w-full"
                  >
                    {blockerLabel(b)}
                  </button>
                  {b.reason && (
                    <Typography variant="small" tone="muted" className="mt-0.5">
                      {formatReason(b.reason)}
                    </Typography>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {suggestedFixes.length > 0 && (
        <div>
          <Typography variant="small" weight="medium" className="text-neutral-600 mb-2 block">
            Suggested fixes
          </Typography>
          <ul className="space-y-1.5">
            {suggestedFixes.map((f, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => f.question_order != null && onScrollToQuestion(f.question_order)}
                  className="text-left text-sm text-primary hover:underline w-full"
                >
                  {f.prompt?.trim() ?? (f.question_order != null ? `Question ${f.question_order}` : 'Question')}
                </button>
                {f.suggestion && (
                  <Typography variant="small" tone="muted" className="mt-0.5">
                    {f.suggestion}
                  </Typography>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {showBulkAssess && (
        <div className="pt-2 border-t border-neutral-200">
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkAssess}
            loading={bulkAssessLoading}
            className="w-full gap-2"
          >
            <ClipboardCheck size={14} />
            Assess missing required answers
          </Button>
        </div>
      )}
    </div>
  )
}
