'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Search, X } from 'lucide-react'
import { createPortal } from 'react-dom'
import { Input, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { GUIDE_ARTICLES, DEFAULT_GUIDE_ID } from '../../domain/content/articles'
import { GUIDE_GROUPS } from '../../domain/content/groups'
import type { GuideArticle } from '../../domain/model/guide'
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

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    setActiveId(initialGuideId ?? DEFAULT_GUIDE_ID)
    setQuery('')
  }, [open, initialGuideId])

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-900/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-guide-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        className="flex h-[min(88vh,820px)] w-full max-w-5xl flex-col border border-neutral-200 bg-white shadow-xl"
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
