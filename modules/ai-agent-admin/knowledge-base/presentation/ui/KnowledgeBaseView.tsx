'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button, ConfirmDialog, Input, PageSkeleton, Select, Textarea, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { useCanManageAiConfig } from '../../../presentation/hooks/useCanManageAiConfig'
import type { AiGuideDefinition, CreateAiGuideDefinitionPayload } from '../../domain/model/guide-definition'
import { useKnowledgeGuides } from '../hooks/useKnowledgeGuides'
import { useKnowledgeMutations } from '../hooks/useKnowledgeMutations'

const LOCALE_OPTIONS = ['en-US', 'vi-VN']

const PAGE_CODE_OPTIONS = [
  'AI_ASSISTANT',
  'DOCUMENT_DETAIL',
  'WORK_ITEMS',
  'REQUIREMENTS',
  'SCOPE',
  'MEETINGS',
  'TIMELINE',
  'RAID',
  'REPORTS',
  'CHANGE_REQUESTS',
]

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 shrink-0 rounded-full',
        status === 'ACTIVE' ? 'bg-green-500' : status === 'RETIRED' ? 'bg-red-400' : 'bg-neutral-300'
      )}
    />
  )
}

function NewGuideModal({
  open,
  saving,
  onClose,
  onSave,
}: {
  open: boolean
  saving: boolean
  onClose: () => void
  onSave: (payload: CreateAiGuideDefinitionPayload) => void
}) {
  const [pageCode, setPageCode] = useState(PAGE_CODE_OPTIONS[0])
  const [locale, setLocale] = useState(LOCALE_OPTIONS[0])
  const [title, setTitle] = useState('')
  const [bodyMarkdown, setBodyMarkdown] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setPageCode(PAGE_CODE_OPTIONS[0])
      setLocale(LOCALE_OPTIONS[0])
      setTitle('')
      setBodyMarkdown('')
      setError(null)
    }
  }, [open])

  if (!open) return null

  const handleSubmit = () => {
    if (!title.trim()) { setError('Title is required'); return }
    if (!bodyMarkdown.trim()) { setError('Content is required'); return }
    setError(null)
    onSave({ pageCode, locale, title: title.trim(), bodyMarkdown: bodyMarkdown.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-2xl border border-neutral-200 bg-white shadow-xl">
        <div className="border-b border-neutral-200 px-5 py-4">
          <Typography variant="h3">New guide</Typography>
        </div>
        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-neutral-700">Page code</label>
              <Select
                value={pageCode}
                onValueChange={setPageCode}
                options={PAGE_CODE_OPTIONS.map((p) => ({ value: p, label: p }))}
              />
            </div>
            <div className="w-36">
              <label className="mb-1 block text-xs font-medium text-neutral-700">Locale</label>
              <Select
                value={locale}
                onValueChange={setLocale}
                options={LOCALE_OPTIONS.map((l) => ({ value: l, label: l }))}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. What can Scopery AI do?"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-700">Content (Markdown)</label>
            <Textarea
              rows={10}
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              placeholder={"## Heading\n\nGuide content in Markdown..."}
              className="font-mono"
            />
          </div>
          {error ? (
            <Typography variant="caption" tone="error">{error}</Typography>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-neutral-200 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Creating…' : 'Create guide'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function EditorPanel({
  guide,
  saving,
  canManage,
  onSave,
  onRetire,
}: {
  guide: AiGuideDefinition
  saving: boolean
  canManage: boolean
  onSave: (id: string, title: string, bodyMarkdown: string) => void
  onRetire: (id: string) => void
}) {
  const [title, setTitle] = useState(guide.title)
  const [bodyMarkdown, setBodyMarkdown] = useState(guide.bodyMarkdown)
  const [retireOpen, setRetireOpen] = useState(false)

  useEffect(() => {
    setTitle(guide.title)
    setBodyMarkdown(guide.bodyMarkdown)
  }, [guide.id, guide.title, guide.bodyMarkdown])

  const isDirty = title !== guide.title || bodyMarkdown !== guide.bodyMarkdown
  const isRetired = guide.status === 'RETIRED'

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Editor header */}
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-neutral-200 px-6 py-4">
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <span className="bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-500">
              {guide.pageCode}
            </span>
            <span className="bg-neutral-100 px-2 py-0.5 font-mono text-[10px] text-neutral-500">
              {guide.locale}
            </span>
            <span
              className={cn(
                'px-2 py-0.5 text-[10px] font-medium',
                guide.status === 'ACTIVE'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-600'
              )}
            >
              {guide.status}
            </span>
          </div>
          <p className="mt-1 font-mono text-[11px] text-neutral-400">{guide.code}</p>
        </div>
        {canManage && !isRetired ? (
          <div className="flex shrink-0 gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRetireOpen(true)}
              disabled={saving}
            >
              Retire
            </Button>
            <Button
              size="sm"
              disabled={saving || !isDirty}
              onClick={() => onSave(guide.id, title, bodyMarkdown)}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        ) : null}
      </div>

      {/* Title */}
      <div className="shrink-0 border-b border-neutral-100 px-6 py-3">
        <input
          className="w-full text-lg font-semibold text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:opacity-60"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Guide title"
          disabled={!canManage || isRetired}
        />
      </div>

      {/* Markdown editor */}
      <div className="min-h-0 flex-1 px-6 py-4">
        <textarea
          className="h-full min-h-[400px] w-full resize-none rounded border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm leading-relaxed text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-200 disabled:opacity-60"
          value={bodyMarkdown}
          onChange={(e) => setBodyMarkdown(e.target.value)}
          placeholder="Write guide content in Markdown…"
          disabled={!canManage || isRetired}
          spellCheck={false}
        />
      </div>

      <ConfirmDialog
        open={retireOpen}
        onClose={() => setRetireOpen(false)}
        title="Retire guide"
        message={`Retire "${guide.title}"? This guide will no longer appear in the AI assistant.`}
        confirmLabel="Retire"
        variant="danger"
        onConfirm={() => {
          onRetire(guide.id)
          setRetireOpen(false)
        }}
      />
    </div>
  )
}

export function KnowledgeBaseView() {
  const canManage = useCanManageAiConfig()
  const { items, loading, error, refetch } = useKnowledgeGuides()
  const { saving, create, update, retire } = useKnowledgeMutations(refetch)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [newOpen, setNewOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return items.filter(
      (g) =>
        !q ||
        g.title.toLowerCase().includes(q) ||
        g.pageCode.toLowerCase().includes(q) ||
        g.code.toLowerCase().includes(q)
    )
  }, [items, search])

  const grouped = useMemo(() => {
    const map = new Map<string, AiGuideDefinition[]>()
    for (const g of filtered) {
      const list = map.get(g.pageCode) ?? []
      list.push(g)
      map.set(g.pageCode, list)
    }
    return map
  }, [filtered])

  const selected = useMemo(
    () => items.find((g) => g.id === selectedId) ?? null,
    [items, selectedId]
  )

  // Auto-select first item when list loads
  useEffect(() => {
    if (!selectedId && items.length > 0) {
      setSelectedId(items[0].id)
    }
  }, [items, selectedId])

  const handleCreate = async (payload: CreateAiGuideDefinitionPayload) => {
    const created = await create(payload)
    setNewOpen(false)
    setSelectedId(created.id)
  }

  const handleSave = async (id: string, title: string, bodyMarkdown: string) => {
    await update(id, { title, bodyMarkdown })
  }

  const handleRetire = async (id: string) => {
    await retire(id)
    if (selectedId === id) setSelectedId(null)
  }

  if (loading && items.length === 0) {
    return <PageSkeleton variant="list" className="p-lg" />
  }

  return (
    <div className="flex h-full min-h-0 flex-1">
      {/* Left panel — guide list */}
      <div className="flex w-72 shrink-0 flex-col border-r border-neutral-200 bg-white">
        <div className="shrink-0 border-b border-neutral-200 p-3">
          <div className="mb-2 flex items-center justify-between">
            <Typography variant="h3" className="text-sm font-semibold">
              Knowledge base
            </Typography>
            {canManage ? (
              <button
                type="button"
                className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                title="New guide"
                onClick={() => setNewOpen(true)}
              >
                <Plus size={14} />
              </button>
            ) : null}
          </div>
          <div className="relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              className="w-full rounded border border-neutral-200 bg-neutral-50 py-1.5 pl-7 pr-3 text-xs text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:outline-none"
              placeholder="Search guides…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {error ? (
            <p className="p-3 text-xs text-red-500">{error}</p>
          ) : grouped.size === 0 ? (
            <p className="p-4 text-xs text-neutral-400">No guides found.</p>
          ) : (
            Array.from(grouped.entries()).map(([pageCode, guides]) => (
              <div key={pageCode}>
                <div className="sticky top-0 bg-neutral-50 px-3 py-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                    {pageCode}
                  </span>
                </div>
                {guides.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={cn(
                      'flex w-full items-start gap-2 px-3 py-2 text-left transition-colors',
                      selectedId === g.id
                        ? 'bg-neutral-100'
                        : 'hover:bg-neutral-50'
                    )}
                    onClick={() => setSelectedId(g.id)}
                  >
                    <StatusDot status={g.status} />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-xs font-medium',
                          selectedId === g.id ? 'text-neutral-900' : 'text-neutral-700'
                        )}
                      >
                        {g.title}
                      </span>
                      <span className="block text-[10px] text-neutral-400">{g.locale}</span>
                    </span>
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right panel — editor */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
        {selected ? (
          <EditorPanel
            key={selected.id}
            guide={selected}
            saving={saving}
            canManage={canManage}
            onSave={handleSave}
            onRetire={handleRetire}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <Typography tone="muted" className="text-sm">
                Select a guide to edit
              </Typography>
              {canManage ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={() => setNewOpen(true)}
                >
                  <Plus size={14} className="mr-1" />
                  New guide
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <NewGuideModal
        open={newOpen}
        saving={saving}
        onClose={() => setNewOpen(false)}
        onSave={(payload) => void handleCreate(payload)}
      />
    </div>
  )
}
