'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  Bell,
  BookOpen,
  Bot,
  Building2,
  CheckSquare,
  ClipboardList,
  FileText,
  FolderOpen,
  GitBranch,
  Layers,
  Maximize2,
  MessageSquare,
  Minimize2,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  X,
  type LucideProps,
} from 'lucide-react'
import { createPortal } from 'react-dom'
import { Input, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { GUIDE_ARTICLES, DEFAULT_GUIDE_ID } from '../../domain/content/articles'
import { GUIDE_GROUPS } from '../../domain/content/groups'
import type { GuideDiagramType, GuideArticle, GuideHighlight } from '../../domain/model/guide'
import {
  articlesByGroup,
  collectSuggestedQuestions,
  findArticle,
  searchGuides,
} from '../../domain/rules/guide-search.rules'

export interface UserGuideModalProps {
  open: boolean
  onClose: () => void
  /** Optional deep-link into a guide article */
  initialGuideId?: string
}

export function UserGuideModal({ open, onClose, initialGuideId }: UserGuideModalProps) {
  const [mounted, setMounted] = useState(false)
  const [query, setQuery] = useState('')
  const [activeId, setActiveId] = useState(initialGuideId ?? DEFAULT_GUIDE_ID)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    setActiveId(initialGuideId ?? DEFAULT_GUIDE_ID)
    setQuery('')
  }, [open, initialGuideId])

  useEffect(() => {
    if (!open) setExpanded(false)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const grouped = useMemo(() => articlesByGroup(GUIDE_ARTICLES, GUIDE_GROUPS), [])
  const suggestions = useMemo(() => collectSuggestedQuestions(GUIDE_ARTICLES, 12), [])
  const hits = useMemo(() => searchGuides(GUIDE_ARTICLES, query), [query])
  const active = findArticle(GUIDE_ARTICLES, activeId) ?? GUIDE_ARTICLES[0]

  const selectArticle = (id: string) => {
    setActiveId(id)
    setQuery('')
  }

  const selectFromSearch = (article: GuideArticle) => {
    setActiveId(article.id)
    setQuery('')
  }

  if (!open || !mounted || typeof document === 'undefined') return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[100] flex bg-neutral-900/50',
        expanded ? 'items-stretch p-0' : 'items-center justify-center p-4'
      )}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-guide-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className={cn(
          'flex flex-col border border-neutral-200 bg-white shadow-xl transition-none',
          expanded ? 'h-screen w-screen' : 'h-[min(88vh,820px)] w-full max-w-5xl'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-neutral-200 px-4 py-3">
          <BookOpen size={18} className="shrink-0 text-neutral-700" aria-hidden />
          <Typography id="user-guide-title" as="h2" weight="semibold" className="shrink-0 text-base">
            Guideline
          </Typography>
          <div className="relative min-w-0 flex-1">
            <Search
              size={14}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400"
              aria-hidden
            />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides or ask a question…"
              className="h-9 pl-8 text-sm"
              aria-label="Search guidelines"
            />
          </div>
          <button
            type="button"
            aria-label={expanded ? 'Exit full screen' : 'Full screen'}
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center text-neutral-600 hover:bg-neutral-100"
          >
            {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center text-neutral-600 hover:bg-neutral-100"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1">
          {/* Left nav */}
          <aside className="flex w-60 shrink-0 flex-col overflow-y-auto border-r border-neutral-200 bg-neutral-50">
            {grouped.map(({ group, articles }) => (
              <div key={group.id} className="border-b border-neutral-200 py-2">
                <Typography
                  as="p"
                  variant="small"
                  weight="medium"
                  className="px-3 pb-1 text-[11px] uppercase tracking-wide text-neutral-500"
                >
                  {group.label}
                </Typography>
                <ul className="flex flex-col">
                  {articles.map((article) => {
                    const selected = article.id === active.id && !query.trim()
                    return (
                      <li key={article.id}>
                        <button
                          type="button"
                          onClick={() => selectArticle(article.id)}
                          className={cn(
                            'w-full px-3 py-1.5 text-left text-sm text-neutral-900 hover:bg-neutral-100',
                            selected && 'bg-neutral-200 font-medium'
                          )}
                        >
                          {article.title}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </aside>

          {/* Main */}
          <div className="min-w-0 flex-1 overflow-y-auto px-5 py-4">
            {query.trim() ? (
              <SearchResults
                query={query}
                hits={hits}
                suggestions={suggestions}
                onPickArticle={selectFromSearch}
                onPickSuggestion={(q) => setQuery(q)}
              />
            ) : (
              <ArticleView
                article={active}
                allArticles={GUIDE_ARTICLES}
                onOpenRelated={selectArticle}
                onAsk={setQuery}
              />
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function SearchResults({
  query,
  hits,
  suggestions,
  onPickArticle,
  onPickSuggestion,
}: {
  query: string
  hits: ReturnType<typeof searchGuides>
  suggestions: string[]
  onPickArticle: (article: GuideArticle) => void
  onPickSuggestion: (q: string) => void
}) {
  return (
    <div className="space-y-5">
      <div>
        <Typography as="h3" weight="semibold" className="text-base text-neutral-900">
          Search results
        </Typography>
        <Typography as="p" variant="small" className="mt-0.5 text-neutral-500">
          Matching “{query}”
        </Typography>
      </div>

      {hits.length === 0 ? (
        <div className="space-y-3">
          <Typography as="p" className="text-sm text-neutral-700">
            No guides matched. Try a suggested question:
          </Typography>
          <SuggestionChips suggestions={suggestions} onPick={onPickSuggestion} />
        </div>
      ) : (
        <ul className="space-y-2">
          {hits.map((hit) => (
            <li key={hit.article.id}>
              <button
                type="button"
                onClick={() => onPickArticle(hit.article)}
                className="w-full border border-neutral-200 px-3 py-2.5 text-left hover:bg-neutral-50"
              >
                <Typography as="p" weight="medium" className="text-sm text-neutral-900">
                  {hit.article.title}
                </Typography>
                <Typography as="p" variant="small" className="mt-0.5 text-neutral-500">
                  {hit.matchedQuestion ?? hit.article.subtitle}
                </Typography>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="border-t border-neutral-100 pt-4">
        <Typography as="p" variant="small" weight="medium" className="mb-2 text-neutral-500">
          Suggested questions
        </Typography>
        <SuggestionChips suggestions={suggestions} onPick={onPickSuggestion} />
      </div>
    </div>
  )
}

function SuggestionChips({
  suggestions,
  onPick,
}: {
  suggestions: string[]
  onPick: (q: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((q) => (
        <button
          key={q}
          type="button"
          onClick={() => onPick(q)}
          className="border border-neutral-300 bg-white px-2.5 py-1 text-left text-xs text-neutral-800 hover:bg-neutral-50"
        >
          {q}
        </button>
      ))}
    </div>
  )
}

function OrgHierarchyDiagram() {
  const levels = [
    {
      icon: Building2,
      label: 'Organization',
      description: 'Your company or team account. One org can have many workspaces.',
      examples: 'e.g. Acme Corp',
    },
    {
      icon: Layers,
      label: 'Workspace',
      description: 'A department, product line, or client. Members and settings are scoped here.',
      examples: 'e.g. Mobile Team, Client A',
    },
    {
      icon: FolderOpen,
      label: 'Project',
      description: 'A delivery initiative with Plan, Scope, Quality, and Control workbench tabs.',
      examples: 'e.g. App v2.0, Migration Sprint',
    },
  ]

  return (
    <div className="my-1 border border-neutral-200 bg-neutral-50 p-4">
      <div className="flex flex-col items-center">
        {levels.map((level, i) => {
          const Icon = level.icon
          return (
            <div key={level.label} className="flex w-full flex-col items-center">
              <div className="w-full max-w-md border border-neutral-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-start gap-3">
                  <Icon size={16} className="mt-0.5 shrink-0 text-neutral-500" />
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-neutral-900">{level.label}</span>
                      <span className="text-xs text-neutral-400">{level.examples}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
                      {level.description}
                    </p>
                  </div>
                </div>
              </div>
              {i < levels.length - 1 && (
                <div className="flex flex-col items-center py-1">
                  <div className="h-4 w-px bg-neutral-300" />
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="currentColor" className="text-neutral-400">
                    <path d="M5 6L0 0h10z" />
                  </svg>
                </div>
              )}
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-center text-[11px] text-neutral-400">
        One org → many workspaces → many projects per workspace
      </p>
    </div>
  )
}

function DeliveryLifecycleDiagram() {
  const areas = [
    {
      icon: ClipboardList,
      label: 'Plan',
      items: ['Work Items', 'Timeline', 'Schedule', 'Plan Structure'],
    },
    {
      icon: FileText,
      label: 'Scope & Req',
      items: ['Requirements', 'Functions', 'Use Cases', 'Traceability', 'Screen Specs'],
    },
    {
      icon: CheckSquare,
      label: 'Quality',
      items: ['Test Cases', 'Test Runs', 'Defects', 'Releases'],
    },
    {
      icon: Settings,
      label: 'Commercial',
      items: ['Budget', 'Contracts', 'Procurement'],
    },
    {
      icon: ShieldCheck,
      label: 'Control',
      items: ['Baselines', 'Change Requests', 'RAID', 'Decisions'],
    },
  ]

  return (
    <div className="my-1 border border-neutral-200 bg-neutral-50 p-4">
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-start gap-0">
          {areas.map((area, i) => {
            const Icon = area.icon
            return (
              <React.Fragment key={area.label}>
                <div className="w-32 border border-neutral-200 bg-white shadow-sm">
                  <div className="flex items-center gap-1.5 border-b border-neutral-200 px-2.5 py-2">
                    <Icon size={13} className="shrink-0 text-neutral-500" />
                    <span className="text-xs font-semibold text-neutral-900">{area.label}</span>
                  </div>
                  <ul className="px-2.5 py-2 space-y-1">
                    {area.items.map((item) => (
                      <li key={item} className="text-[11px] text-neutral-500 leading-snug">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                {i < areas.length - 1 && (
                  <div className="flex items-center self-stretch px-1 pt-[18px]">
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor" className="text-neutral-300">
                      <path d="M9 0l5 5-5 5V6H0V4h9V0z" />
                    </svg>
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>
      <p className="mt-3 text-[11px] text-neutral-400">
        Work flows left to right — you can work in any area at any time, but most teams follow this order.
      </p>
    </div>
  )
}

function ScopeMockup() {
  return (
    <div className="space-y-1.5">
      {[
        { code: 'REQ-001', label: 'User login via email', status: 'Open' },
        { code: 'REQ-002', label: 'Password reset flow', status: 'Draft' },
      ].map((r) => (
        <div key={r.code} className="border border-neutral-200 bg-white px-2 py-1.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-semibold text-neutral-400">{r.code}</span>
            <span className="border border-neutral-200 px-1.5 py-px text-[9px] text-neutral-500">{r.status}</span>
          </div>
          <p className="mt-0.5 text-[11px] text-neutral-700">{r.label}</p>
          <div className="mt-1 flex gap-2">
            <span className="text-[9px] text-neutral-400">Use Cases: 2</span>
            <span className="text-[9px] text-neutral-400">Test Cases: 1</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function PlanMockup() {
  const bars = [
    { label: 'Design', w: '75%', offset: '0%' },
    { label: 'Dev', w: '55%', offset: '20%' },
    { label: 'QA', w: '35%', offset: '55%' },
  ]
  return (
    <div className="space-y-1.5">
      {bars.map((b) => (
        <div key={b.label} className="flex items-center gap-2">
          <span className="w-10 shrink-0 text-[10px] text-neutral-400">{b.label}</span>
          <div className="relative flex-1 h-4 bg-neutral-100 border border-neutral-200">
            <div
              className="absolute top-0 h-full bg-neutral-800"
              style={{ left: b.offset, width: b.w }}
            />
          </div>
        </div>
      ))}
      <div className="flex justify-between pt-0.5">
        {['W1', 'W2', 'W3', 'W4'].map((w) => (
          <span key={w} className="text-[9px] text-neutral-300">{w}</span>
        ))}
      </div>
    </div>
  )
}

function DocsMockup() {
  return (
    <div className="border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-2 py-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-neutral-700">Kickoff Meeting</span>
        <span className="text-[9px] text-neutral-400">27 Aug</span>
      </div>
      <div className="px-2 py-1.5 space-y-1">
        {['Decision: Use REST API', 'Action: Update screen spec', 'Risk: Timeline tight'].map((line, i) => (
          <div key={i} className="flex items-start gap-1.5">
            <span className="mt-0.5 text-[9px] text-neutral-300">•</span>
            <span className="text-[10px] text-neutral-600">{line}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RiskMockup() {
  const rows = [
    { type: 'Risk', label: 'API instability', status: 'Open' },
    { type: 'Issue', label: 'Delayed design', status: 'Active' },
    { type: 'CR', label: 'Add SSO scope', status: 'Pending' },
  ]
  return (
    <div className="border border-neutral-200 bg-white shadow-sm">
      {rows.map((r, i) => (
        <div
          key={i}
          className={cn('flex items-center gap-2 px-2 py-1.5', i < rows.length - 1 && 'border-b border-neutral-100')}
        >
          <span className="w-10 shrink-0 border border-neutral-200 px-1 py-px text-center text-[9px] text-neutral-500">{r.type}</span>
          <span className="flex-1 text-[10px] text-neutral-700">{r.label}</span>
          <span className="text-[9px] text-neutral-400">{r.status}</span>
        </div>
      ))}
    </div>
  )
}

function QualityMockup() {
  const cases = [
    { id: 'TC-001', label: 'Login success', result: 'PASS' },
    { id: 'TC-002', label: 'Wrong password', result: 'PASS' },
    { id: 'TC-003', label: 'Reset flow', result: 'FAIL' },
  ]
  return (
    <div className="border border-neutral-200 bg-white shadow-sm">
      {cases.map((c, i) => (
        <div
          key={c.id}
          className={cn('flex items-center gap-2 px-2 py-1.5', i < cases.length - 1 && 'border-b border-neutral-100')}
        >
          <span className="text-[10px] font-medium text-neutral-400">{c.id}</span>
          <span className="flex-1 text-[10px] text-neutral-700">{c.label}</span>
          <span className={cn('border px-1.5 py-px text-[9px] font-semibold', c.result === 'PASS' ? 'border-neutral-300 text-neutral-600' : 'border-neutral-400 text-neutral-800')}>
            {c.result}
          </span>
        </div>
      ))}
    </div>
  )
}

function ReleaseMockup() {
  return (
    <div className="border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-2 py-1.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-neutral-700">v1.0.0</span>
        <span className="border border-neutral-300 px-2 py-px text-[9px] font-semibold text-neutral-700">APPROVED</span>
      </div>
      <div className="px-2 py-1.5 space-y-1">
        <div className="flex items-center gap-1.5">
          <CheckSquare size={10} className="text-neutral-400" />
          <span className="text-[10px] text-neutral-600">3 / 3 test cases passed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckSquare size={10} className="text-neutral-400" />
          <span className="text-[10px] text-neutral-600">Baseline locked</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckSquare size={10} className="text-neutral-400" />
          <span className="text-[10px] text-neutral-600">Signed off by PM</span>
        </div>
      </div>
    </div>
  )
}

const PHASE_MOCKUPS = [ScopeMockup, PlanMockup, DocsMockup, RiskMockup, QualityMockup, ReleaseMockup]
const PHASE_LABELS = ['① Define Scope', '② Plan Work', '③ Docs & Meetings', '④ Risk & Control', '⑤ Verify Quality', '⑥ Release']

function WorkflowE2EDiagram() {
  return (
    <div className="my-1 border border-neutral-200 bg-neutral-50 p-3">
      <div className="grid grid-cols-3 gap-px bg-neutral-200">
        {PHASE_LABELS.map((label, i) => {
          const Mockup = PHASE_MOCKUPS[i]
          return (
            <div key={label} className="bg-neutral-50 p-3">
              <p className="mb-2 text-[11px] font-semibold text-neutral-700">{label}</p>
              <Mockup />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <ArrowDown size={10} className="text-neutral-300 rotate-[-90deg]" />
        <p className="text-[10px] text-neutral-400">Flow: Scope → Plan → Docs → Risk → Quality → Release</p>
      </div>
    </div>
  )
}

type IconComponent = React.ComponentType<LucideProps>

const HIGHLIGHT_ICONS: Record<string, IconComponent> = {
  target: Target,
  clipboard: ClipboardList,
  file: FileText,
  shield: ShieldCheck,
  check: CheckSquare,
  rocket: Rocket,
  alert: AlertTriangle,
  layers: Layers,
  folder: FolderOpen,
  building: Building2,
  settings: Settings,
  book: BookOpen,
}

function HighlightsGrid({ highlights }: { highlights: GuideHighlight[] }) {
  return (
    <div className="grid grid-cols-3 gap-px border border-neutral-200 bg-neutral-200">
      {highlights.map((h) => {
        const Icon = HIGHLIGHT_ICONS[h.iconKey] ?? FileText
        return (
          <div key={h.label} className="bg-white px-3 py-3">
            <div className="flex items-center gap-2 mb-1">
              <Icon size={13} className="shrink-0 text-neutral-500" />
              <span className="text-xs font-semibold text-neutral-900">{h.label}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-neutral-500">{h.description}</p>
          </div>
        )
      })}
    </div>
  )
}

function PlanOverviewDiagram() {
  const columns = [
    { label: 'To Do', items: ['Design login UI', 'Write API spec', 'Setup CI/CD'] },
    { label: 'In Progress', items: ['Implement auth', 'Review mockups'] },
    { label: 'Done', items: ['Project kickoff', 'Tech stack decision'] },
  ]
  const bars = [
    { label: 'Design', w: 70, offset: 0 },
    { label: 'Dev', w: 55, offset: 20 },
    { label: 'QA', w: 30, offset: 55 },
    { label: 'Deploy', w: 15, offset: 82 },
  ]
  return (
    <div className="my-1 border border-neutral-200 bg-neutral-50 p-3 space-y-3">
      {/* Kanban */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Work Items</p>
        <div className="grid grid-cols-3 gap-px bg-neutral-200">
          {columns.map((col) => (
            <div key={col.label} className="bg-white">
              <div className="border-b border-neutral-200 px-2 py-1">
                <span className="text-[10px] font-semibold text-neutral-600">{col.label}</span>
              </div>
              <div className="p-1.5 space-y-1">
                {col.items.map((item) => (
                  <div key={item} className="border border-neutral-200 bg-neutral-50 px-1.5 py-1">
                    <span className="text-[10px] text-neutral-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Timeline */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Timeline</p>
        <div className="space-y-1.5">
          {bars.map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-[10px] text-neutral-500">{b.label}</span>
              <div className="relative flex-1 h-3.5 bg-neutral-100 border border-neutral-200">
                <div className="absolute top-0 h-full bg-neutral-700" style={{ left: `${b.offset}%`, width: `${b.w}%` }} />
              </div>
            </div>
          ))}
          <div className="ml-14 flex justify-between">
            {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((w) => (
              <span key={w} className="text-[9px] text-neutral-300">{w}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ScopeOverviewDiagram() {
  const matrix = [
    { req: 'REQ-001', uc: 'UC-001', tc: 'TC-001', covered: true },
    { req: 'REQ-001', uc: 'UC-002', tc: 'TC-002', covered: true },
    { req: 'REQ-002', uc: 'UC-003', tc: null, covered: false },
    { req: 'REQ-003', uc: 'UC-004', tc: 'TC-003', covered: true },
  ]
  return (
    <div className="my-1 border border-neutral-200 bg-neutral-50 p-3 space-y-3">
      {/* Requirement cards */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Requirements</p>
        <div className="space-y-1">
          {[
            { code: 'REQ-001', title: 'User authentication', status: 'Approved', ucs: 2 },
            { code: 'REQ-002', title: 'Password reset', status: 'Draft', ucs: 1 },
            { code: 'REQ-003', title: 'Session management', status: 'Open', ucs: 1 },
          ].map((r) => (
            <div key={r.code} className="flex items-center gap-2 border border-neutral-200 bg-white px-2 py-1.5">
              <span className="text-[10px] font-semibold text-neutral-400 w-16 shrink-0">{r.code}</span>
              <span className="flex-1 text-[10px] text-neutral-700">{r.title}</span>
              <span className="border border-neutral-200 px-1.5 py-px text-[9px] text-neutral-500">{r.status}</span>
              <span className="text-[9px] text-neutral-400">{r.ucs} UC</span>
            </div>
          ))}
        </div>
      </div>
      {/* Traceability */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Traceability</p>
        <div className="border border-neutral-200 bg-white">
          <div className="grid grid-cols-4 gap-0 border-b border-neutral-200 bg-neutral-50">
            {['Requirement', 'Use Case', 'Test Case', 'Status'].map((h) => (
              <div key={h} className="px-2 py-1 text-[9px] font-semibold uppercase text-neutral-400 border-r border-neutral-200 last:border-0">{h}</div>
            ))}
          </div>
          {matrix.map((row, i) => (
            <div key={i} className={cn('grid grid-cols-4 border-b border-neutral-100 last:border-0')}>
              <div className="px-2 py-1 text-[10px] text-neutral-600 border-r border-neutral-100">{row.req}</div>
              <div className="px-2 py-1 text-[10px] text-neutral-600 border-r border-neutral-100">{row.uc}</div>
              <div className="px-2 py-1 text-[10px] text-neutral-600 border-r border-neutral-100">{row.tc ?? <span className="text-neutral-300">—</span>}</div>
              <div className="px-2 py-1">
                <span className={cn('text-[9px] font-semibold', row.covered ? 'text-neutral-600' : 'text-neutral-400')}>
                  {row.covered ? 'Covered' : 'Gap'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function QualityOverviewDiagram() {
  const cases = [
    { id: 'TC-001', title: 'Login with valid credentials', result: 'PASS' },
    { id: 'TC-002', title: 'Login with wrong password', result: 'PASS' },
    { id: 'TC-003', title: 'Session timeout redirect', result: 'FAIL' },
    { id: 'TC-004', title: 'Password reset email', result: 'PASS' },
  ]
  const defects = [
    { id: 'DEF-001', title: 'Session not cleared on logout', severity: 'High' },
    { id: 'DEF-002', title: 'Reset email delay > 30s', severity: 'Medium' },
  ]
  const pass = cases.filter((c) => c.result === 'PASS').length
  const total = cases.length
  const pct = Math.round((pass / total) * 100)

  return (
    <div className="my-1 border border-neutral-200 bg-neutral-50 p-3 space-y-3">
      {/* Summary bar */}
      <div className="border border-neutral-200 bg-white px-3 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-semibold text-neutral-700">Sprint 1 — Quality Gate</span>
          <span className="text-[11px] font-bold text-neutral-900">{pct}%</span>
        </div>
        <div className="h-2 w-full bg-neutral-100 border border-neutral-200">
          <div className="h-full bg-neutral-700" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex gap-4">
          <span className="text-[9px] text-neutral-500">Pass: {pass}</span>
          <span className="text-[9px] text-neutral-500">Fail: {total - pass}</span>
          <span className="text-[9px] text-neutral-500">Total: {total}</span>
        </div>
      </div>
      {/* Test cases */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Test Cases</p>
        <div className="border border-neutral-200 bg-white">
          {cases.map((c, i) => (
            <div key={c.id} className={cn('flex items-center gap-2 px-2 py-1.5', i < cases.length - 1 && 'border-b border-neutral-100')}>
              <span className="w-14 shrink-0 text-[10px] font-medium text-neutral-400">{c.id}</span>
              <span className="flex-1 text-[10px] text-neutral-700">{c.title}</span>
              <span className={cn('border px-1.5 py-px text-[9px] font-semibold', c.result === 'PASS' ? 'border-neutral-300 text-neutral-600' : 'border-neutral-500 text-neutral-800')}>
                {c.result}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Defects */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Defects</p>
        <div className="border border-neutral-200 bg-white">
          {defects.map((d, i) => (
            <div key={d.id} className={cn('flex items-center gap-2 px-2 py-1.5', i < defects.length - 1 && 'border-b border-neutral-100')}>
              <AlertTriangle size={10} className="shrink-0 text-neutral-400" />
              <span className="flex-1 text-[10px] text-neutral-700">{d.title}</span>
              <span className="text-[9px] text-neutral-500">{d.severity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ControlOverviewDiagram() {
  return (
    <div className="my-1 border border-neutral-200 bg-neutral-50 p-3 space-y-3">
      {/* Baseline flow */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Baselines & Change Flow</p>
        <div className="flex items-center gap-1">
          {[
            { label: 'Baseline v1.0', note: 'Locked' },
            null,
            { label: 'CR-001: Add SSO', note: 'Approved' },
            null,
            { label: 'Baseline v2.0', note: 'Pending' },
          ].map((item, i) =>
            item === null ? (
              <ArrowRight key={i} size={12} className="shrink-0 text-neutral-300" />
            ) : (
              <div key={i} className="flex-1 border border-neutral-200 bg-white px-2 py-1.5 text-center">
                <p className="text-[10px] font-semibold text-neutral-700">{item.label}</p>
                <p className="text-[9px] text-neutral-400">{item.note}</p>
              </div>
            )
          )}
        </div>
      </div>
      {/* RAID */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">RAID Log</p>
        <div className="border border-neutral-200 bg-white">
          {[
            { type: 'Risk', title: 'Third-party API downtime', owner: 'Dev Lead', status: 'Mitigated' },
            { type: 'Issue', title: 'Delayed design handoff', owner: 'PM', status: 'Active' },
            { type: 'Dep', title: 'Auth service ready', owner: 'Arch', status: 'Open' },
          ].map((r, i) => (
            <div key={i} className={cn('flex items-center gap-2 px-2 py-1.5', i < 2 && 'border-b border-neutral-100')}>
              <span className="w-10 shrink-0 border border-neutral-200 px-1 py-px text-center text-[9px] text-neutral-500">{r.type}</span>
              <span className="flex-1 text-[10px] text-neutral-700">{r.title}</span>
              <span className="text-[9px] text-neutral-400">{r.owner}</span>
              <span className="text-[9px] text-neutral-400">{r.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CollabOverviewDiagram() {
  return (
    <div className="my-1 border border-neutral-200 bg-neutral-50 p-3 space-y-3">
      {/* Comments thread */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Comments on REQ-001</p>
        <div className="border border-neutral-200 bg-white">
          {[
            { avatar: 'JD', name: 'John D.', time: '2h ago', msg: 'Can we clarify the session timeout behaviour?' },
            { avatar: 'AN', name: 'Anna N.', time: '1h ago', msg: '@John timeout is 30 min per security policy.' },
            { avatar: 'PM', name: 'Peter M.', time: '30m ago', msg: 'Updated the requirement. Please review.' },
          ].map((c, i) => (
            <div key={i} className={cn('flex gap-2 px-2 py-2', i < 2 && 'border-b border-neutral-100')}>
              <div className="flex h-5 w-5 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-100 text-[9px] font-bold text-neutral-600">{c.avatar}</div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-[10px] font-semibold text-neutral-800">{c.name}</span>
                  <span className="text-[9px] text-neutral-400">{c.time}</span>
                </div>
                <p className="mt-0.5 text-[10px] leading-relaxed text-neutral-600">{c.msg}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Notifications */}
      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Notifications</p>
        <div className="border border-neutral-200 bg-white">
          {[
            { icon: MessageSquare, msg: 'Anna replied to your comment on REQ-001', time: '1h ago', unread: true },
            { icon: Bell, msg: 'Test Run "Sprint 1" completed — 3 failures', time: '3h ago', unread: true },
            { icon: CheckSquare, msg: 'CR-001 was approved by PM', time: '1d ago', unread: false },
          ].map((n, i) => {
            const Icon = n.icon
            return (
              <div key={i} className={cn('flex items-start gap-2 px-2 py-1.5', i < 2 && 'border-b border-neutral-100', n.unread && 'bg-neutral-50')}>
                <Icon size={10} className="mt-0.5 shrink-0 text-neutral-400" />
                <span className="flex-1 text-[10px] text-neutral-700">{n.msg}</span>
                <span className="shrink-0 text-[9px] text-neutral-400">{n.time}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function AiOverviewDiagram() {
  const messages = [
    { role: 'user', text: 'Summarize open risks in this project' },
    { role: 'ai', text: 'Found 3 open risks:\n• API downtime — High (no mitigation yet)\n• Design delay — Medium (owner: PM)\n• Resource gap in QA — Low' },
    { role: 'user', text: 'Draft a test case for the login requirement' },
    { role: 'ai', text: 'TC-005: Login with valid credentials\nSteps: 1. Enter email 2. Enter password 3. Click Login\nExpected: Redirect to dashboard' },
  ]
  return (
    <div className="my-1 border border-neutral-200 bg-neutral-50 p-3 space-y-3">
      {/* AI Chat */}
      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <Sparkles size={11} className="text-neutral-500" />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">AI Assistant</p>
        </div>
        <div className="border border-neutral-200 bg-white">
          {messages.map((m, i) => (
            <div key={i} className={cn('px-2 py-2', i < messages.length - 1 && 'border-b border-neutral-100', m.role === 'user' ? 'bg-neutral-50' : 'bg-white')}>
              <div className="mb-0.5 flex items-center gap-1.5">
                {m.role === 'ai' ? <Bot size={10} className="text-neutral-500" /> : <span className="text-[9px] font-semibold text-neutral-400">You</span>}
                {m.role === 'ai' && <span className="text-[9px] font-semibold text-neutral-500">Scopery AI</span>}
              </div>
              <p className="text-[10px] leading-relaxed text-neutral-700 whitespace-pre-line">{m.text}</p>
            </div>
          ))}
        </div>
      </div>
      {/* AI Agent */}
      <div>
        <div className="mb-1.5 flex items-center gap-1.5">
          <GitBranch size={11} className="text-neutral-500" />
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">AI Agents (automated)</p>
        </div>
        <div className="border border-neutral-200 bg-white">
          {[
            { name: 'Test Case Generator', trigger: 'On requirement approved', status: 'Active' },
            { name: 'Risk Summarizer', trigger: 'Daily at 08:00', status: 'Active' },
            { name: 'Meeting Note Extractor', trigger: 'On doc upload', status: 'Paused' },
          ].map((a, i) => (
            <div key={i} className={cn('flex items-center gap-2 px-2 py-1.5', i < 2 && 'border-b border-neutral-100')}>
              <span className="flex-1 text-[10px] font-medium text-neutral-700">{a.name}</span>
              <span className="text-[9px] text-neutral-400">{a.trigger}</span>
              <span className={cn('border px-1.5 py-px text-[9px]', a.status === 'Active' ? 'border-neutral-300 text-neutral-600' : 'border-neutral-200 text-neutral-400')}>{a.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const DIAGRAM_COMPONENTS: Record<GuideDiagramType, () => React.ReactElement> = {
  'org-hierarchy': OrgHierarchyDiagram,
  'delivery-lifecycle': DeliveryLifecycleDiagram,
  'workflow-e2e': WorkflowE2EDiagram,
  'plan-overview': PlanOverviewDiagram,
  'scope-overview': ScopeOverviewDiagram,
  'quality-overview': QualityOverviewDiagram,
  'control-overview': ControlOverviewDiagram,
  'collab-overview': CollabOverviewDiagram,
  'ai-overview': AiOverviewDiagram,
}

function ArticleView({
  article,
  allArticles,
  onOpenRelated,
  onAsk,
}: {
  article: GuideArticle
  allArticles: GuideArticle[]
  onOpenRelated: (id: string) => void
  onAsk: (q: string) => void
}) {
  const related = (article.relatedIds ?? [])
    .map((id) => findArticle(allArticles, id))
    .filter((a): a is GuideArticle => a != null)

  const DiagramComponent = article.diagramType ? DIAGRAM_COMPONENTS[article.diagramType] : null

  return (
    <article className="space-y-5">
      <header className="space-y-1">
        <Typography as="h3" weight="semibold" className="text-lg text-neutral-900">
          {article.title}
        </Typography>
        <Typography as="p" className="text-sm text-neutral-600">
          {article.subtitle}
        </Typography>
      </header>

      {DiagramComponent ? <DiagramComponent /> : null}

      {article.highlights && article.highlights.length > 0 ? (
        <HighlightsGrid highlights={article.highlights} />
      ) : null}

      {article.prerequisites && article.prerequisites.length > 0 ? (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center border border-neutral-200 bg-white px-2 py-0.5 text-[11px] font-medium text-neutral-900 shadow-sm">
              Prerequisites
            </span>
          </div>
          <ul className="list-disc space-y-1 pl-5">
            {article.prerequisites.map((p) => (
              <li key={p} className="text-sm text-neutral-800">
                {p}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-4">
        {article.steps.map((step, index) => (
          <div key={`${step.title}-${index}`} className="border-b border-neutral-100 pb-4 last:border-0">
            <div className="mb-1.5 flex items-baseline gap-2">
              <span className="inline-flex h-5 min-w-5 items-center justify-center border border-neutral-200 bg-white px-1.5 text-[11px] font-medium text-neutral-900 shadow-sm">
                {index + 1}
              </span>
              <Typography as="h4" weight="semibold" className="text-sm text-neutral-900">
                {step.title}
              </Typography>
            </div>
            <Typography as="p" className="text-sm leading-relaxed text-neutral-800">
              {step.body}
            </Typography>
            {step.uiHints && step.uiHints.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {step.uiHints.map((hint) => (
                  <span
                    key={hint}
                    className="inline-flex items-center border border-neutral-200 bg-white px-2 py-0.5 text-[11px] text-neutral-900 shadow-sm"
                  >
                    {hint}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </section>

      {related.length > 0 ? (
        <section className="space-y-2 border-t border-neutral-200 pt-4">
          <Typography as="p" variant="small" weight="medium" className="text-neutral-500">
            Related guides
          </Typography>
          <ul className="flex flex-col gap-1">
            {related.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onOpenRelated(r.id)}
                  className="text-sm text-neutral-900 underline-offset-2 hover:underline"
                >
                  {r.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {article.suggestedQuestions.length > 0 ? (
        <section className="space-y-2 border-t border-neutral-100 pt-4">
          <Typography as="p" variant="small" weight="medium" className="text-neutral-500">
            People also ask
          </Typography>
          <SuggestionChips
            suggestions={article.suggestedQuestions.slice(0, 4)}
            onPick={onAsk}
          />
        </section>
      ) : null}
    </article>
  )
}
