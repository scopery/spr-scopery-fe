'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, FileText, FolderKanban, Search, X } from 'lucide-react'
import { Button, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

export type AiChatSource =
  | { type: 'project'; id: string; label: string }
  | { type: 'document'; id: string; projectId: string; label: string }

export function sourceKey(s: AiChatSource): string {
  return s.type === 'project' ? `project:${s.id}` : `document:${s.id}`
}

interface ProjectOption {
  id: string
  label: string
}

interface DocumentOption {
  id: string
  title: string
}

interface AiContextPickerProps {
  open: boolean
  onClose: () => void
  projects: ProjectOption[]
  documents: DocumentOption[]
  loadingDocs?: boolean
  browseProjectId: string
  onBrowseProjectChange: (projectId: string) => void
  selected: AiChatSource[]
  onToggle: (source: AiChatSource) => void
  anchorRef?: React.RefObject<HTMLElement | null>
}

export function AiContextPicker({
  open,
  onClose,
  projects,
  documents,
  loadingDocs = false,
  browseProjectId,
  onBrowseProjectChange,
  selected,
  onToggle,
  anchorRef,
}: AiContextPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState('')

  const selectedKeys = useMemo(() => new Set(selected.map(sourceKey)), [selected])

  const filteredProjects = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return projects
    return projects.filter((p) => p.label.toLowerCase().includes(q))
  }, [projects, query])

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return documents
    return documents.filter((d) => d.title.toLowerCase().includes(q))
  }, [documents, query])

  useEffect(() => {
    if (!open) {
      setQuery('')
      return
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node
      if (panelRef.current?.contains(target)) return
      if (anchorRef?.current?.contains(target)) return
      onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open, onClose, anchorRef])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Add sources"
      className="absolute bottom-full left-0 z-30 mb-2 w-[min(100%,360px)] overflow-hidden border border-neutral-200 bg-white shadow-lg"
    >
      <div className="flex items-center gap-2 border-b border-neutral-100 px-3 py-2">
        <Search size={14} className="shrink-0 text-neutral-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search projects or documents…"
          aria-label="Search sources"
          className="min-w-0 flex-1 bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
          autoFocus
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Close"
          icon={<X size={14} />}
          onClick={onClose}
        />
      </div>

      <div className="max-h-72 overflow-auto p-2">
        <Typography
          variant="caption"
          tone="muted"
          className="mb-1.5 block px-1.5 uppercase tracking-wide"
        >
          Projects
        </Typography>
        {filteredProjects.length === 0 ? (
          <Typography variant="small" tone="muted" className="px-1.5 py-2">
            No projects found
          </Typography>
        ) : (
          <ul className="mb-3 space-y-0.5">
            {filteredProjects.map((p) => {
              const key = `project:${p.id}`
              const checked = selectedKeys.has(key)
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-neutral-50',
                      checked && 'bg-primary/5'
                    )}
                    onClick={() => {
                      onToggle({ type: 'project', id: p.id, label: p.label })
                      onBrowseProjectChange(p.id)
                    }}
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center border',
                        checked
                          ? 'border-primary bg-primary text-white'
                          : 'border-neutral-300 bg-white'
                      )}
                    >
                      {checked ? <Check size={10} /> : null}
                    </span>
                    <FolderKanban size={14} className="shrink-0 text-neutral-500" />
                    <span className="min-w-0 flex-1 truncate text-neutral-800">{p.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="mb-1.5 flex items-center justify-between gap-2 px-1.5">
          <Typography variant="caption" tone="muted" className="uppercase tracking-wide">
            Documents
          </Typography>
          {browseProjectId ? (
            <Typography variant="caption" tone="muted" className="truncate">
              {projects.find((p) => p.id === browseProjectId)?.label ?? 'Selected project'}
            </Typography>
          ) : null}
        </div>

        {!browseProjectId ? (
          <Typography variant="small" tone="muted" className="px-1.5 py-2">
            Select a project to browse documents
          </Typography>
        ) : loadingDocs ? (
          <Typography variant="small" tone="muted" className="px-1.5 py-2">
            Loading documents…
          </Typography>
        ) : filteredDocs.length === 0 ? (
          <Typography variant="small" tone="muted" className="px-1.5 py-2">
            No documents found
          </Typography>
        ) : (
          <ul className="space-y-0.5">
            {filteredDocs.map((d) => {
              const key = `document:${d.id}`
              const checked = selectedKeys.has(key)
              return (
                <li key={d.id}>
                  <button
                    type="button"
                    className={cn(
                      'flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm hover:bg-neutral-50',
                      checked && 'bg-primary/5'
                    )}
                    onClick={() =>
                      onToggle({
                        type: 'document',
                        id: d.id,
                        projectId: browseProjectId,
                        label: d.title,
                      })
                    }
                  >
                    <span
                      className={cn(
                        'flex h-4 w-4 shrink-0 items-center justify-center border',
                        checked
                          ? 'border-primary bg-primary text-white'
                          : 'border-neutral-300 bg-white'
                      )}
                    >
                      {checked ? <Check size={10} /> : null}
                    </span>
                    <FileText size={14} className="shrink-0 text-neutral-500" />
                    <span className="min-w-0 flex-1 truncate text-neutral-800">{d.title}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {selected.length > 0 ? (
        <div className="border-t border-neutral-100 px-3 py-2">
          <Typography variant="caption" tone="muted">
            {selected.length} source{selected.length === 1 ? '' : 's'} selected
          </Typography>
        </div>
      ) : null}
    </div>
  )
}
