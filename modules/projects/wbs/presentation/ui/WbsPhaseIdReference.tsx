'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button, Typography } from '@/shared/ui'
import { toast } from 'sonner'

export interface WbsPhaseIdOption {
  value: string
  label: string
}

interface Props {
  phases: WbsPhaseIdOption[]
  /** Compact hint under bulk / JSON import forms. */
  className?: string
}

/**
 * Exposes project phase UUIDs for bulk paste / JSON import (phaseId is required by BE).
 */
export function WbsPhaseIdReference({ phases, className }: Props) {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  if (phases.length === 0) {
    return (
      <div className={className}>
        <Typography variant="small" tone="muted">
          No phases yet — create a project phase first, then come back to add planning elements.
        </Typography>
      </div>
    )
  }

  const copyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id)
      setCopiedId(id)
      toast.success('Phase id copied')
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev))
      }, 1500)
    } catch {
      toast.error('Could not copy phase id')
    }
  }

  return (
    <div className={className}>
      <Typography variant="small" className="mb-1.5 text-neutral-800">
        Phase ids (required for bulk / JSON)
      </Typography>
      <Typography variant="caption" tone="muted" className="mb-2 block">
        Bulk add can pick a phase from the dropdown. For paste/JSON, copy a phase id below into{' '}
        <span className="font-mono">phaseId</span>.
      </Typography>
      <ul className="max-h-36 space-y-1.5 overflow-y-auto border border-neutral-200 bg-neutral-50 px-2 py-2">
        {phases.map((phase) => {
          const copied = copiedId === phase.value
          return (
            <li
              key={phase.value}
              className="flex min-w-0 items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <Typography as="p" variant="small" className="truncate text-neutral-900">
                  {phase.label}
                </Typography>
                <Typography
                  as="p"
                  variant="caption"
                  className="truncate font-mono text-[11px] text-neutral-600"
                  title={phase.value}
                >
                  {phase.value}
                </Typography>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="shrink-0"
                icon={copied ? <Check size={14} /> : <Copy size={14} />}
                onClick={() => void copyId(phase.value)}
                aria-label={`Copy phase id for ${phase.label}`}
              >
                {copied ? 'Copied' : 'Copy id'}
              </Button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
