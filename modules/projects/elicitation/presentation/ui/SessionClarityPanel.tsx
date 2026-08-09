'use client'

import { MoreHorizontal } from 'lucide-react'
import { Button, Card, Typography } from '@/shared/ui'
import type { ElicitationQuestion, ElicitationRound } from '../../domain/model/elicitation'
import { ClarityLevel, QuestionStatus, RoundStatus } from '../../domain/enums/elicitation.enum'

const CLARITY_LABEL: Record<string, string> = {
  BLOCKED: 'Blocked',
  CRITICAL: 'Critical',
  IMPORTANT: 'Important',
  MINOR: 'Minor',
  CLEARED: 'Cleared',
}

interface SessionClarityPanelProps {
  rounds: ElicitationRound[]
  questions: ElicitationQuestion[]
  shouldContinue: boolean | null
  canGenerateNextRound?: boolean
  generateLabel?: string
  isGenerating?: boolean
  isSubmitting?: boolean
  onGenerateNextRound?: () => void
}

function ProgressRing({ percent }: { percent: number }) {
  const clamped = Math.max(0, Math.min(100, percent))
  const size = 200
  const stroke = 28
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (clamped / 100) * c
  const mid = size / 2

  return (
    <div className="relative mx-auto w-[70%] max-w-[220px] aspect-square">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-full w-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-neutral-200"
        />
        <circle
          cx={mid}
          cy={mid}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="butt"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className="text-neutral-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-calsans text-[1.75rem] font-semibold tabular-nums leading-none text-neutral-900">
          {Math.round(clamped)}%
        </span>
        <span className="mt-2 text-sm font-normal text-neutral-500">Complete</span>
      </div>
    </div>
  )
}

function StatRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: number
  strong?: boolean
}) {
  return (
    <div
      className={
        strong
          ? 'flex items-center justify-between text-[13px] font-semibold text-neutral-900'
          : 'flex items-center justify-between text-[13px] text-neutral-800'
      }
    >
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

function buildIssuesLine(breakdown: Record<string, number>): string | null {
  const parts: string[] = []
  for (const level of [
    ClarityLevel.Critical,
    ClarityLevel.Important,
    ClarityLevel.Minor,
  ] as string[]) {
    const n = breakdown[level] ?? 0
    if (n > 0) {
      parts.push(`${n} ${CLARITY_LABEL[level]?.toLowerCase() ?? level.toLowerCase()}`)
    }
  }
  return parts.length > 0 ? parts.join(' · ') : null
}

export function SessionClarityPanel({
  rounds,
  questions,
  shouldContinue,
  canGenerateNextRound = false,
  generateLabel = 'Generate next round',
  isGenerating = false,
  isSubmitting = false,
  onGenerateNextRound,
}: SessionClarityPanelProps) {
  const answered = questions.filter((q) => q.status === QuestionStatus.Answered).length
  const skipped = questions.filter((q) => q.status === QuestionStatus.Skipped).length
  const missing = questions.filter((q) => q.status === QuestionStatus.Pending).length
  const total = questions.length
  const completePct = total > 0 ? ((answered + skipped) / total) * 100 : 0

  const clarityBreakdown: Record<string, number> = {}
  for (const q of questions) {
    if (q.clarityLevel) {
      clarityBreakdown[q.clarityLevel] = (clarityBreakdown[q.clarityLevel] ?? 0) + 1
    }
  }

  const blockedCount = clarityBreakdown[ClarityLevel.Blocked] ?? 0
  const criticalCount = clarityBreakdown[ClarityLevel.Critical] ?? 0
  const isBlocking = blockedCount > 0 || criticalCount > 0

  const worstClarity = [
    ClarityLevel.Blocked,
    ClarityLevel.Critical,
    ClarityLevel.Important,
    ClarityLevel.Minor,
    ClarityLevel.Cleared,
  ].find((level) => (clarityBreakdown[level] ?? 0) > 0)

  const statusLabel = worstClarity
    ? (CLARITY_LABEL[worstClarity] ?? worstClarity)
    : rounds.some((r) => r.status === RoundStatus.Active)
      ? 'In progress'
      : rounds.length > 0
        ? 'Cleared'
        : '—'

  const issuesLine = buildIssuesLine(clarityBreakdown)
  const blockingOpen =
    questions.filter(
      (q) =>
        q.clarityLevel === ClarityLevel.Blocked || q.clarityLevel === ClarityLevel.Critical
    ).length + missing

  const recommendation =
    shouldContinue === true
      ? blockingOpen > 0
        ? `${blockingOpen} issue${blockingOpen === 1 ? '' : 's'} still need${blockingOpen === 1 ? 's' : ''} clarification. Another round is recommended.`
        : 'Another clarification round is recommended.'
      : shouldContinue === false
        ? 'Scope looks sufficiently clarified. You can close the session.'
        : null

  const showGenerate = Boolean(canGenerateNextRound && onGenerateNextRound)

  return (
    <Card hasShadow={false} className="relative flex min-h-[640px] flex-col">
      <div className="relative z-[1] flex flex-1 flex-col gap-8 px-5 pb-28 pt-5">
        <div className="flex items-center justify-between gap-2">
          <Typography variant="body" className="text-[15px] font-semibold text-neutral-900">
            Session Progress
          </Typography>
          <MoreHorizontal size={18} className="shrink-0 text-neutral-400" aria-hidden />
        </div>

        <ProgressRing percent={completePct} />

        <div className="flex flex-col gap-2.5">
          <StatRow label="Answered" value={answered} />
          <StatRow label="Skipped" value={skipped} />
          <StatRow label="Missing" value={missing} />
          <div className="border-t border-neutral-200 pt-2.5">
            <StatRow label="Total" value={total} strong />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <Typography variant="caption" className="text-neutral-500">
            Status
          </Typography>
          <p
            className={
              isBlocking
                ? 'text-base font-semibold leading-snug text-error'
                : 'text-base font-semibold leading-snug text-neutral-900'
            }
          >
            {statusLabel}
          </p>
          {issuesLine ? (
            <p className="text-xs leading-relaxed text-neutral-500">Issues · {issuesLine}</p>
          ) : null}
        </div>

        {recommendation || showGenerate ? (
          <div className="mt-auto flex flex-col gap-4">
            {recommendation ? (
              <div className="flex flex-col gap-1.5">
                <p className="text-xs font-medium text-neutral-500">AI recommendation</p>
                <div className="border border-neutral-200 bg-white px-3 py-2.5">
                  <p className="text-[15px] font-medium leading-relaxed text-neutral-900">
                    {recommendation}
                  </p>
                </div>
              </div>
            ) : null}
            {showGenerate ? (
              <Button
                size="md"
                fullWidth
                loading={isGenerating}
                disabled={isSubmitting || isGenerating}
                onClick={onGenerateNextRound}
                className="!rounded-none !border-transparent !bg-neutral-800 !text-white hover:!bg-neutral-900 active:!bg-neutral-900"
              >
                {generateLabel}
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Flipped corner mosaic — flush bottom-right, no inset */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/illustrations/corner_pattern.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 z-0 h-[148px] w-[148px] -scale-x-100 select-none"
      />
    </Card>
  )
}
