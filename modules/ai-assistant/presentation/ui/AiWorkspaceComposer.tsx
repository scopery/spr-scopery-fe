'use client'

import { useRef, useState } from 'react'
import {
  AtSign,
  FileText,
  FolderKanban,
  HelpCircle,
  Paperclip,
  Plus,
  SendHorizontal,
  Square,
  X,
} from 'lucide-react'
import { Button, Typography } from '@/shared/ui'
import { AiStreamUiState } from '../../domain/enums/ai-assistant.enum'
import type { AiChatSource } from './AiContextPicker'
import { AiContextPicker, sourceKey } from './AiContextPicker'
import { AiActionsGuide } from './AiActionsGuide'

interface ProjectOption {
  id: string
  label: string
}

interface DocumentOption {
  id: string
  title: string
}

interface AiWorkspaceComposerProps {
  value: string
  placeholder: string
  disabled?: boolean
  isStreaming?: boolean
  streamUiState?: AiStreamUiState
  canRetryConnection?: boolean
  streamError?: string | null
  sources?: AiChatSource[]
  pickerOpen?: boolean
  projects?: ProjectOption[]
  documents?: DocumentOption[]
  loadingDocs?: boolean
  browseProjectId?: string
  onBrowseProjectChange?: (projectId: string) => void
  onToggleSource?: (source: AiChatSource) => void
  onRemoveSource?: (source: AiChatSource) => void
  onChange: (value: string) => void
  onSend: () => void
  onStop?: () => void
  onRetryConnection?: () => void
  onOpenPicker?: () => void
  onClosePicker?: () => void
}

export function AiWorkspaceComposer({
  value,
  placeholder,
  disabled = false,
  isStreaming = false,
  streamUiState,
  canRetryConnection = false,
  streamError = null,
  sources = [],
  pickerOpen = false,
  projects = [],
  documents = [],
  loadingDocs = false,
  browseProjectId = '',
  onBrowseProjectChange,
  onToggleSource,
  onRemoveSource,
  onChange,
  onSend,
  onStop,
  onRetryConnection,
  onOpenPicker,
  onClosePicker,
}: AiWorkspaceComposerProps) {
  const cancelling = streamUiState === AiStreamUiState.Cancelling
  const addBtnRef = useRef<HTMLSpanElement>(null)
  const [actionsOpen, setActionsOpen] = useState(false)

  return (
    <div className="mt-auto shrink-0 border-t border-neutral-200 bg-white px-3 py-3 md:px-4">
      <div className="relative mx-auto w-full max-w-[880px]">
        {actionsOpen ? <AiActionsGuide onClose={() => setActionsOpen(false)} /> : null}
        {streamError || canRetryConnection ? (
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border border-warning/30 bg-white px-3 py-2">
            <Typography variant="small" className="text-neutral-800">
              {streamError || 'Connection interrupted'}
            </Typography>
            {canRetryConnection && onRetryConnection ? (
              <Button size="sm" variant="outline" onClick={onRetryConnection}>
                Reconnect
              </Button>
            ) : null}
          </div>
        ) : null}

        {onToggleSource && onBrowseProjectChange && onClosePicker ? (
          <AiContextPicker
            open={pickerOpen}
            onClose={onClosePicker}
            projects={projects}
            documents={documents}
            loadingDocs={loadingDocs}
            browseProjectId={browseProjectId}
            onBrowseProjectChange={onBrowseProjectChange}
            selected={sources}
            onToggle={onToggleSource}
            anchorRef={addBtnRef}
          />
        ) : null}

        <div className="border border-neutral-200 bg-neutral-50">
          {sources.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 border-b border-neutral-100 px-3 pt-3">
              {sources.map((s) => (
                <span
                  key={sourceKey(s)}
                  className="inline-flex max-w-full items-center gap-1 border border-neutral-200 bg-neutral-50 py-0.5 pl-2 pr-1 text-xs text-neutral-700"
                >
                  {s.type === 'project' ? (
                    <FolderKanban size={12} className="shrink-0 text-neutral-500" />
                  ) : (
                    <FileText size={12} className="shrink-0 text-neutral-500" />
                  )}
                  <span className="min-w-0 truncate">{s.label}</span>
                  {onRemoveSource ? (
                    <button
                      type="button"
                      className="p-0.5 text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
                      aria-label={`Remove ${s.label}`}
                      onClick={() => onRemoveSource(s)}
                    >
                      <X size={12} />
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
          ) : null}

          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            aria-label="AI message"
            disabled={disabled || isStreaming}
            maxLength={8000}
            rows={2}
            className="w-full resize-none bg-transparent px-4 pt-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-60"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && value.trim() && !disabled && !isStreaming) {
                e.preventDefault()
                onSend()
              }
            }}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 px-3 pb-3">
            <div className="flex flex-wrap items-center gap-1">
              <span ref={addBtnRef}>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  icon={<Plus size={14} />}
                  disabled={disabled || isStreaming}
                  onClick={onOpenPicker}
                >
                  Sources
                </Button>
              </span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={<AtSign size={14} />}
                disabled={disabled || isStreaming}
                onClick={onOpenPicker}
              >
                Mention
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={<Paperclip size={14} />}
                disabled
                aria-label="Attach document (coming soon)"
              >
                Attach
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                icon={<HelpCircle size={14} />}
                onClick={() => setActionsOpen((v) => !v)}
                aria-label="Show available AI actions"
              >
                Actions
              </Button>
            </div>

            {isStreaming ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                icon={<Square size={12} />}
                disabled={cancelling}
                onClick={onStop}
              >
                {cancelling ? 'Stopping…' : 'Stop generating'}
              </Button>
            ) : (
              <Button
                type="button"
                size="sm"
                variant="primary"
                icon={<SendHorizontal size={14} />}
                disabled={disabled || !value.trim()}
                onClick={onSend}
              >
                Send
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
