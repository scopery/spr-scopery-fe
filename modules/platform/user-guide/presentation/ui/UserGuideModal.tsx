'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDown,
  BookOpen,
  Building2,
  CheckSquare,
  ClipboardList,
  FileText,
  FolderOpen,
  Layers,
  Maximize2,
  Minimize2,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
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

function WorkflowE2EDiagram() {
  const phases = [
    {
      step: 1,
      label: 'Define Scope',
      tags: ['Requirements', 'Functions', 'Use Cases', 'Screen Specs', 'Traceability'],
    },
    {
      step: 2,
      label: 'Plan Work',
      tags: ['Work Items', 'Plan Structure', 'Timeline', 'Schedule'],
    },
    {
      step: 3,
      label: 'Docs & Meetings',
      tags: ['Meeting Notes', 'Documents', 'Action Items', 'Decisions'],
    },
    {
      step: 4,
      label: 'Risk & Change Control',
      tags: ['RAID Log', 'Change Requests', 'Baselines', 'Impact Assessment'],
    },
    {
      step: 5,
      label: 'Verify Quality',
      tags: ['Test Cases', 'Test Runs', 'Defects', 'Release Gate'],
    },
    {
      step: 6,
      label: 'Release & Lock',
      tags: ['Releases', 'Sign-off', 'Baseline Lock'],
    },
  ]

  return (
    <div className="my-1 border border-neutral-200 bg-neutral-50 p-4">
      <div className="relative pl-10">
        <div className="absolute left-[19px] top-3 bottom-3 w-px bg-neutral-200" />
        <div className="space-y-0">
          {phases.map((phase, i) => (
            <div key={phase.step} className="relative pb-5 last:pb-0">
              <div className="absolute -left-10 flex h-6 w-6 items-center justify-center border border-neutral-200 bg-white shadow-sm">
                <span className="text-[11px] font-semibold text-neutral-700">{phase.step}</span>
              </div>
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-sm font-semibold text-neutral-900 shrink-0">{phase.label}</span>
                <div className="flex flex-wrap gap-1">
                  {phase.tags.map((tag) => (
                    <span
                      key={tag}
                      className="border border-neutral-200 bg-white px-2 py-0.5 text-[11px] text-neutral-600 shadow-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {i < phases.length - 1 && (
                <div className="absolute -left-[26px] top-7">
                  <ArrowDown size={12} className="text-neutral-300" />
                </div>
              )}
            </div>
          ))}
        </div>
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

const DIAGRAM_COMPONENTS: Record<GuideDiagramType, () => React.ReactElement> = {
  'org-hierarchy': OrgHierarchyDiagram,
  'delivery-lifecycle': DeliveryLifecycleDiagram,
  'workflow-e2e': WorkflowE2EDiagram,
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
