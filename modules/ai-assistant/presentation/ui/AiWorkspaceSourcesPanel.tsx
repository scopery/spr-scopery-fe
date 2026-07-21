'use client'

import { Check, FileText, FolderKanban, X } from 'lucide-react'
import { Button, Typography } from '@/shared/ui'
import type { AiChatSource } from './AiContextPicker'
import { sourceKey } from './AiContextPicker'

interface AiWorkspaceSourcesPanelProps {
  open: boolean
  sources: AiChatSource[]
  excludedCount?: number
  knowledgeSectionCount?: number
  onClose: () => void
  onRemove?: (source: AiChatSource) => void
  onAdd?: () => void
}

export function AiWorkspaceSourcesPanel({
  open,
  sources,
  excludedCount = 0,
  knowledgeSectionCount = 0,
  onClose,
  onRemove,
  onAdd,
}: AiWorkspaceSourcesPanelProps) {
  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-neutral-900/20 lg:hidden"
        aria-label="Close sources"
        onClick={onClose}
      />
      <aside className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,320px)] flex-col border-l border-neutral-200 bg-white shadow-lg lg:static lg:z-auto lg:w-[280px] lg:shadow-none">
        <div className="flex h-11 items-center justify-between border-b border-neutral-200 px-3">
          <Typography weight="medium" className="text-sm">
            Sources
          </Typography>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Close sources"
            icon={<X size={14} />}
            onClick={onClose}
          />
        </div>

        <div className="flex-1 space-y-4 overflow-auto p-3">
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <Typography variant="caption" tone="muted" className="uppercase tracking-wide">
                Included ({sources.length})
              </Typography>
              {onAdd ? (
                <Button type="button" size="sm" variant="ghost" onClick={onAdd}>
                  Add
                </Button>
              ) : null}
            </div>
            {sources.length === 0 ? (
              <Typography variant="small" tone="muted">
                No sources yet. Use Sources under the composer to add projects or documents.
              </Typography>
            ) : (
              <ul className="space-y-1.5">
                {sources.map((s) => (
                  <li
                    key={sourceKey(s)}
                    className="flex items-start gap-2 border border-neutral-100 bg-neutral-50 px-2 py-1.5 text-sm text-neutral-800"
                  >
                    <Check size={14} className="mt-0.5 shrink-0 text-success" />
                    {s.type === 'project' ? (
                      <FolderKanban size={14} className="mt-0.5 shrink-0 text-neutral-500" />
                    ) : (
                      <FileText size={14} className="mt-0.5 shrink-0 text-neutral-500" />
                    )}
                    <span className="min-w-0 flex-1 break-words">{s.label}</span>
                    {onRemove ? (
                      <button
                        type="button"
                        className="shrink-0 p-0.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                        aria-label={`Remove ${s.label}`}
                        onClick={() => onRemove(s)}
                      >
                        <X size={12} />
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {excludedCount > 0 ? (
            <div>
              <Typography
                variant="caption"
                tone="muted"
                className="mb-2 block uppercase tracking-wide"
              >
                Excluded
              </Typography>
              <Typography variant="small" tone="muted">
                {excludedCount} resource{excludedCount === 1 ? ' was' : 's were'} excluded due to
                access restrictions
              </Typography>
            </div>
          ) : null}

          {knowledgeSectionCount > 0 ? (
            <div>
              <Typography
                variant="caption"
                tone="muted"
                className="mb-2 block uppercase tracking-wide"
              >
                Retrieval
              </Typography>
              <Typography variant="small" tone="muted">
                {knowledgeSectionCount} knowledge section
                {knowledgeSectionCount === 1 ? '' : 's'} used
              </Typography>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  )
}
