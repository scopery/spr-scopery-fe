'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import {
  TraceabilityOverviewView,
  type FunctionalSegment,
  type TraceNavTab,
} from './TraceabilityOverviewView'
import { TraceabilityFullMatrixTab } from './TraceabilityFullMatrixTab'
import { FunctionCoverageTab } from './FunctionCoverageTab'
import { UseCaseCoverageTab } from './UseCaseCoverageTab'
import { ImplementationCoverageTab } from './ImplementationCoverageTab'
import { NfrVerificationTab } from './NfrVerificationTab'
import { TraceExplorerTab } from './TraceExplorerTab'

const TABS: { id: TraceNavTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'functional', label: 'Functional Coverage' },
  { id: 'implementation', label: 'Implementation' },
  { id: 'nfr', label: 'NFR Verification' },
  { id: 'explorer', label: 'Explorer' },
]

const SEGMENTS: { id: FunctionalSegment; label: string }[] = [
  { id: 'requirements', label: 'Requirements' },
  { id: 'functions', label: 'Functions' },
  { id: 'use-cases', label: 'Use Cases' },
]

function parseTab(v: string | null): TraceNavTab {
  if (v === 'functional' || v === 'implementation' || v === 'nfr' || v === 'explorer') return v
  return 'overview'
}

function parseSegment(v: string | null): FunctionalSegment {
  if (v === 'functions' || v === 'use-cases') return v
  return 'requirements'
}

export function RequirementTraceabilityView() {
  const { projectId } = useParams<{ projectId: string }>()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [tab, setTab] = useState<TraceNavTab>(() => parseTab(searchParams.get('tab')))
  const [segment, setSegment] = useState<FunctionalSegment>(() =>
    parseSegment(searchParams.get('segment'))
  )
  const [filter, setFilter] = useState<string | null>(() => searchParams.get('filter'))
  const [matrixKey, setMatrixKey] = useState(0)

  const syncUrl = useCallback(
    (next: { tab: TraceNavTab; segment?: FunctionalSegment; filter?: string | null }) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', next.tab)
      if (next.tab === 'functional') {
        params.set('segment', next.segment ?? segment)
      } else {
        params.delete('segment')
      }
      if (next.filter) params.set('filter', next.filter)
      else params.delete('filter')
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [pathname, router, searchParams, segment]
  )

  useEffect(() => {
    setTab(parseTab(searchParams.get('tab')))
    setSegment(parseSegment(searchParams.get('segment')))
    setFilter(searchParams.get('filter'))
  }, [searchParams])

  const navigate = (opts: {
    tab: TraceNavTab
    segment?: FunctionalSegment
    filter?: string | null
  }) => {
    setTab(opts.tab)
    if (opts.segment) setSegment(opts.segment)
    setFilter(opts.filter ?? null)
    if (opts.tab === 'functional' && (opts.segment ?? segment) === 'requirements') {
      setMatrixKey((k) => k + 1)
    }
    syncUrl(opts)
  }

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="mb-2 border-b border-neutral-200 pb-2">
        <Typography as="h1" size="md" weight="medium">
          Requirement Traceability
        </Typography>
        <Typography variant="caption" tone="muted" className="mt-0.5">
          Overview, functional coverage, implementation, NFR verification, and explorer.
        </Typography>
      </div>

      <nav
        aria-label="Traceability sections"
        className="mb-2 flex flex-wrap gap-1 border-b border-neutral-200"
      >
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => navigate({ tab: t.id, segment: t.id === 'functional' ? segment : undefined })}
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

      {tab === 'overview' ? (
        <TraceabilityOverviewView projectId={projectId} onNavigate={navigate} />
      ) : null}

      {tab === 'functional' ? (
        <div className="space-y-3">
          <div
            role="tablist"
            aria-label="Functional coverage pivots"
            className="flex flex-wrap gap-1 border-b border-neutral-100"
          >
            {SEGMENTS.map((s) => {
              const active = segment === s.id
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => navigate({ tab: 'functional', segment: s.id, filter })}
                  className={cn(
                    '-mb-px border-b-2 px-2 py-1.5 text-sm font-normal transition-colors',
                    active
                      ? 'border-neutral-800 text-neutral-800'
                      : 'border-transparent text-neutral-400 hover:border-neutral-200 hover:text-neutral-600'
                  )}
                >
                  {s.label}
                </button>
              )
            })}
          </div>

          {segment === 'requirements' ? (
            <TraceabilityFullMatrixTab
              key={`matrix-${matrixKey}-${filter ?? ''}`}
              projectId={projectId}
              initialGapCode={filter}
              initialShowGapsOnly={Boolean(filter)}
            />
          ) : null}
          {segment === 'functions' ? (
            <FunctionCoverageTab projectId={projectId} initialFilter={filter} />
          ) : null}
          {segment === 'use-cases' ? (
            <UseCaseCoverageTab projectId={projectId} initialFilter={filter} />
          ) : null}
        </div>
      ) : null}

      {tab === 'implementation' ? <ImplementationCoverageTab projectId={projectId} /> : null}
      {tab === 'nfr' ? <NfrVerificationTab projectId={projectId} /> : null}
      {tab === 'explorer' ? <TraceExplorerTab projectId={projectId} /> : null}
    </div>
  )
}
