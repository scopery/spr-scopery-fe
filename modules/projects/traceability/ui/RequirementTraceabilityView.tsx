'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { TraceabilityCoverageTab } from './TraceabilityCoverageTab'
import { TraceabilityFullMatrixTab } from './TraceabilityFullMatrixTab'

type TraceTab = 'coverage' | 'matrix'

const TABS: { id: TraceTab; label: string }[] = [
  { id: 'coverage', label: 'Coverage' },
  { id: 'matrix', label: 'Matrix' },
]

export function RequirementTraceabilityView() {
  const { projectId } = useParams<{ projectId: string }>()
  const [tab, setTab] = useState<TraceTab>('coverage')
  const [matrixGapsOnly, setMatrixGapsOnly] = useState(false)
  const [matrixGapCode, setMatrixGapCode] = useState<string | null>(null)
  const [tabKey, setTabKey] = useState(0)

  const openMatrix = (opts?: { showGapsOnly?: boolean; gapCode?: string }) => {
    setMatrixGapsOnly(Boolean(opts?.showGapsOnly))
    setMatrixGapCode(opts?.gapCode ?? null)
    setTab('matrix')
    setTabKey((k) => k + 1)
  }

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="mb-2 border-b border-neutral-200 pb-2">
        <Typography as="h1" size="md" weight="medium">
          Requirement Traceability
        </Typography>
        <Typography variant="caption" tone="muted" className="mt-0.5">
          Track how requirements are analyzed, implemented, verified, and released.
        </Typography>
      </div>

      <nav
        aria-label="Traceability sections"
        className="mb-2 flex gap-1 border-b border-neutral-200"
      >
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => setTab(t.id)}
              className={cn(
                'border-b-2 px-3 py-2 text-sm transition-colors',
                active
                  ? 'border-neutral-800 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              )}
            >
              {t.label}
            </button>
          )
        })}
      </nav>

      {tab === 'coverage' ? (
        <TraceabilityCoverageTab projectId={projectId} onOpenMatrix={openMatrix} />
      ) : null}

      {tab === 'matrix' ? (
        <TraceabilityFullMatrixTab
          key={`matrix-${tabKey}`}
          projectId={projectId}
          initialGapCode={matrixGapCode}
          initialShowGapsOnly={matrixGapsOnly}
        />
      ) : null}
    </div>
  )
}
