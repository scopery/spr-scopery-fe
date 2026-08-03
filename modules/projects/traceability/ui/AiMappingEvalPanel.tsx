'use client'

import { useState } from 'react'
import { Badge, Button, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  formatMs,
  formatPct,
  type MappingEvalMetrics,
} from '../model/mapping-eval.rules'
import type { MappingEvalSnapshot } from '../model/mapping-eval.storage'

interface AiMappingEvalPanelProps {
  metrics: MappingEvalMetrics
  history: MappingEvalSnapshot[]
  onCapture: () => void
  escalatedCount: number
}

function MetricCell({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-neutral-200 bg-white px-2.5 py-2">
      <Typography variant="caption" tone="muted" className="block uppercase tracking-wide">
        {label}
      </Typography>
      <Typography size="sm" weight="medium" className="mt-0.5 tabular-nums">
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" tone="muted" className="mt-0.5 block">
          {hint}
        </Typography>
      ) : null}
    </div>
  )
}

export function AiMappingEvalPanel({
  metrics,
  history,
  onCapture,
  escalatedCount,
}: AiMappingEvalPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <section className="border border-neutral-200 bg-neutral-50">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="min-w-0">
          <Typography size="sm" weight="medium">
            Evaluation & calibration
          </Typography>
          <Typography variant="caption" tone="muted">
            Acceptance, confidence precision, tokens, auto-map gate
          </Typography>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            size="sm"
            variant="soft"
            tone={metrics.gateReadyForAutoMap ? 'success' : 'warning'}
          >
            {metrics.gateReadyForAutoMap ? 'Gate OK' : 'Gate blocked'}
          </Badge>
          <Typography variant="caption" tone="muted">
            {open ? 'Hide' : 'Show'}
          </Typography>
        </div>
      </button>

      {open ? (
        <div className="space-y-3 border-t border-neutral-200 px-3 py-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCell
              label="Acceptance"
              value={formatPct(metrics.acceptanceRate)}
              hint={`${metrics.acceptedCount} accept / ${metrics.rejectedCount} reject`}
            />
            <MetricCell
              label="HIGH precision"
              value={formatPct(metrics.highPrecision)}
              hint="Target ≥ 88%"
            />
            <MetricCell
              label="MEDIUM precision"
              value={formatPct(metrics.mediumPrecision)}
              hint="Target ~ 55%"
            />
            <MetricCell
              label="Tokens / accepted"
              value={
                metrics.tokensPerAccepted != null
                  ? Math.round(metrics.tokensPerAccepted).toLocaleString()
                  : '—'
              }
              hint={
                metrics.tokens
                  ? `in ${metrics.tokens.inputTokens} · out ${metrics.tokens.outputTokens}`
                  : 'Restart BE for token fields'
              }
            />
            <MetricCell
              label="No-match share"
              value={formatPct(metrics.noMatchShare)}
              hint={`${metrics.noMatchCount} NO_MATCH`}
            />
            <MetricCell
              label="Stale share"
              value={formatPct(metrics.staleShare)}
              hint={`${metrics.staleCount} outdated`}
            />
            <MetricCell
              label="Avg review time"
              value={formatMs(metrics.avgReviewMs)}
              hint="Client-measured per decision"
            />
            <MetricCell
              label="Prompt"
              value={
                metrics.promptKey
                  ? `${metrics.promptKey}@v${metrics.promptVersion ?? '?'}`
                  : '—'
              }
              hint={
                metrics.candidateLimit != null
                  ? `Top-K ${metrics.candidateLimit}`
                  : undefined
              }
            />
          </div>

          <div>
            <Typography size="sm" weight="medium" className="mb-1.5">
              Confidence calibration
            </Typography>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500">
                    <th className="px-2 py-1.5 font-medium">Band</th>
                    <th className="px-2 py-1.5 font-medium">N</th>
                    <th className="px-2 py-1.5 font-medium">Accept rate</th>
                    <th className="px-2 py-1.5 font-medium">Target</th>
                    <th className="px-2 py-1.5 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.bands.map((b) => (
                    <tr key={b.band} className="border-b border-neutral-100">
                      <td className="px-2 py-1.5 font-medium">{b.band}</td>
                      <td className="px-2 py-1.5 tabular-nums">{b.total}</td>
                      <td className="px-2 py-1.5 tabular-nums">{formatPct(b.acceptRate)}</td>
                      <td className="px-2 py-1.5 tabular-nums">{formatPct(b.targetRate)}</td>
                      <td className="px-2 py-1.5">
                        {b.calibrated == null ? (
                          <span className="text-neutral-400">n/a</span>
                        ) : (
                          <span
                            className={cn(
                              b.calibrated ? 'text-emerald-700' : 'text-amber-700'
                            )}
                          >
                            {b.calibrated ? 'On target' : 'Drift'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-1">
            <Typography size="sm" weight="medium">
              Auto-map release gate (Phase 5)
            </Typography>
            <ul className="list-disc space-y-0.5 pl-4 text-xs text-neutral-600">
              {metrics.gateNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
              {escalatedCount > 0 ? (
                <li>{escalatedCount} item(s) marked for detailed escalation</li>
              ) : null}
              {metrics.ambiguousCount > 0 ? (
                <li>{metrics.ambiguousCount} AMBIGUOUS — candidates for two-pass escalation</li>
              ) : null}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onCapture}>
              Save snapshot
            </Button>
            <Typography variant="caption" tone="muted">
              Stored in this browser for prompt / run comparison
            </Typography>
          </div>

          {history.length > 0 ? (
            <div>
              <Typography size="sm" weight="medium" className="mb-1.5">
                Recent snapshots
              </Typography>
              <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
                {history.slice(0, 8).map((h) => (
                  <li
                    key={h.id}
                    className="flex flex-wrap items-center justify-between gap-2 border border-neutral-200 bg-white px-2 py-1.5"
                  >
                    <span className="min-w-0 truncate text-neutral-700">
                      {h.promptKey ?? 'prompt?'}@v{h.promptVersion ?? '?'} ·{' '}
                      {h.relationType.replace(/_/g, ' ')}
                    </span>
                    <span className="tabular-nums text-neutral-500">
                      accept {formatPct(h.metrics.acceptanceRate)} · HIGH{' '}
                      {formatPct(h.metrics.highPrecision)} ·{' '}
                      {new Date(h.capturedAt).toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
