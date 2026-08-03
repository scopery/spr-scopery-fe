'use client'

import { useState } from 'react'
import { Badge, Button, Typography } from '@/shared/ui'
import type { AutoMapGateCheck } from '../model/mapping-automap.rules'
import type { AutoMapAuditEntry } from '../model/mapping-automap.storage'

interface AiMappingAutoMapPanelProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  gate: AutoMapGateCheck
  eligibleCount: number
  gateReady: boolean
  autoMapping: boolean
  disabled?: boolean
  onRun: () => void
  audit: AutoMapAuditEntry[]
}

export function AiMappingAutoMapPanel({
  enabled,
  onEnabledChange,
  gate,
  eligibleCount,
  gateReady,
  autoMapping,
  disabled,
  onRun,
  audit,
}: AiMappingAutoMapPanelProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <section className="border border-neutral-200 bg-white px-3 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Typography size="sm" weight="medium">
            Controlled auto-map
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-0.5 block">
            Disabled by default. When enabled, only HIGH / no-warning / non-remap suggestions are
            applied after the evaluation gate passes.
          </Typography>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            className="h-4 w-4 border-neutral-300"
            checked={enabled}
            disabled={disabled || autoMapping}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
          Opt-in for this project
        </label>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Badge size="sm" variant="soft" tone={enabled ? 'success' : 'neutral'}>
          {enabled ? 'Enabled' : 'Disabled'}
        </Badge>
        <Badge size="sm" variant="soft" tone={gateReady ? 'success' : 'warning'}>
          Gate {gateReady ? 'ready' : 'blocked'}
        </Badge>
        <Badge size="sm" variant="soft" tone="neutral">
          {eligibleCount} eligible
        </Badge>
        <Button
          size="sm"
          variant="secondary"
          disabled={disabled || autoMapping || !gate.ok}
          loading={autoMapping}
          onClick={() => setConfirmOpen(true)}
        >
          Auto-map HIGH ({eligibleCount})
        </Button>
      </div>

      {!gate.ok ? (
        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-amber-800">
          {gate.reasons.slice(0, 4).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : (
        <Typography variant="caption" tone="muted" className="mt-2 block">
          Will accept + apply {eligibleCount} suggestion(s) with relation source AI_AUTO_MAPPED.
          Undo remains available.
        </Typography>
      )}

      {audit.length > 0 ? (
        <div className="mt-3 border-t border-neutral-100 pt-2">
          <Typography variant="caption" tone="muted" className="mb-1 block uppercase">
            Auto-map audit
          </Typography>
          <ul className="max-h-32 space-y-1 overflow-y-auto text-xs">
            {audit.slice(0, 12).map((e) => (
              <li
                key={e.id}
                className="flex flex-wrap justify-between gap-2 border border-neutral-100 px-2 py-1"
              >
                <span className="truncate text-neutral-700">
                  {e.relationSource}
                  {e.undone ? ' · UNDONE' : ''} · {e.sourceId.slice(0, 8)}→
                  {e.targetId.slice(0, 8)}
                </span>
                <span className="tabular-nums text-neutral-400">
                  {new Date(e.at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {confirmOpen ? (
        <div className="mt-3 border border-neutral-200 bg-neutral-50 px-3 py-2">
          <Typography size="sm" weight="medium">
            Confirm auto-map
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1">
            Apply {eligibleCount} HIGH-confidence mapping(s) now? Existing parents will not be
            replaced.
          </Typography>
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="secondary"
              loading={autoMapping}
              onClick={() => {
                setConfirmOpen(false)
                onRun()
              }}
            >
              Confirm auto-map
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
