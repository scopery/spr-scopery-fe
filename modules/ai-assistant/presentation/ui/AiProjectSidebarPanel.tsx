'use client'

import { useEffect, useRef, useState } from 'react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { ExternalLink, Plus, Send, Sparkles, Square, X } from 'lucide-react'
import { Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { AiStreamUiState } from '../../domain/enums/ai-assistant.enum'
import { useAiSidebarChat } from '../hooks/useAiSidebarChat'
import { AiMarkdownContent } from './AiMarkdownContent'

function getContextPrompts(pathname: string | null, label: string): string[] {
  if (!pathname) return defaultPrompts(label)
  if (pathname.includes('/work')) return [
    'What tasks are overdue?',
    'Who has the most work items assigned?',
    'Show me the critical blockers',
  ]
  if (pathname.includes('/requirements')) return [
    'Summarize all requirements',
    'Are there conflicting requirements?',
    'What are the high-priority requirements?',
  ]
  if (pathname.includes('/functional-catalog') || pathname.includes('/application-structure')) return [
    'List all functional items',
    'What functional items have no linked requirements?',
    'Summarize the application structure',
  ]
  if (pathname.includes('/scope') || pathname.includes('/deliverables')) return [
    `What are the main deliverables?`,
    'Is scope clearly defined?',
    'What deliverables are at risk?',
  ]
  if (pathname.includes('/meetings')) return [
    'What were key decisions in recent meetings?',
    'List open action items from meetings',
    'Summarize the last meeting',
  ]
  if (pathname.includes('/timeline') || pathname.includes('/schedule')) return [
    'Is the project on schedule?',
    'What milestones are coming up?',
    'Are there any schedule conflicts?',
  ]
  if (pathname.includes('/raid')) return [
    'What are the top risks?',
    'List all open issues',
    'What dependencies need attention?',
  ]
  if (pathname.includes('/reports') || pathname.includes('/dashboard')) return [
    `Give me an executive summary of ${label}`,
    'What KPIs need attention?',
    'How does this compare to baseline?',
  ]
  return defaultPrompts(label)
}

function defaultPrompts(label: string): string[] {
  return [
    `What is the current status of ${label}?`,
    'What needs attention this week?',
    'What are the main risks?',
    'Summarize recent activity',
  ]
}

interface AiProjectSidebarPanelProps {
  workspaceId: string
  projectId: string | null
  projectName: string | null
  onClose: () => void
}

export function AiProjectSidebarPanel({
  workspaceId,
  projectId,
  projectName,
  onClose,
}: AiProjectSidebarPanelProps) {
  const pathname = usePathname()
  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    messages,
    streamingText,
    streamUiState,
    isStreaming,
    creating,
    error,
    send,
    reset,
    cancelStream,
    initLoad,
  } = useAiSidebarChat({ workspaceId, projectId })

  useEffect(() => {
    void initLoad()
  }, [initLoad])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingText])

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || isStreaming) return
    setDraft('')
    await send(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const contextLabel = projectName ?? 'this project'
  const prompts = getContextPrompts(pathname, contextLabel)

  const lastMessage = messages[messages.length - 1]
  const lastIsAssistant =
    lastMessage &&
    (String(lastMessage.role) === 'ASSISTANT' || String(lastMessage.role) === 'assistant')
  const showStreamingBubble =
    isStreaming || (!!streamingText && !lastIsAssistant && streamUiState !== AiStreamUiState.Idle)
  const hasContent = messages.length > 0 || showStreamingBubble

  const fullChatHref = projectId
    ? `${ROUTES.workspace.aiAssistant(workspaceId)}?projectId=${encodeURIComponent(projectId)}`
    : ROUTES.workspace.aiAssistant(workspaceId)

  return (
    <div className="hidden w-80 shrink-0 flex-col border-l border-neutral-200 bg-white lg:flex">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center justify-between gap-2 border-b border-neutral-200 px-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary-gradient text-white">
            <Sparkles size={12} />
          </span>
          <div className="min-w-0">
            <Typography
              as="p"
              className="font-calsans truncate text-xs font-bold text-neutral-900"
            >
              Scopery AI
            </Typography>
            {projectName ? (
              <Typography
                variant="caption"
                tone="muted"
                className="block truncate leading-none"
              >
                {projectName}
              </Typography>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center">
          {messages.length > 0 ? (
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center text-neutral-400 hover:text-neutral-700"
              aria-label="New chat"
              title="New chat"
              onClick={reset}
            >
              <Plus size={14} />
            </button>
          ) : null}
          <NextLink
            href={fullChatHref}
            className="flex h-7 w-7 items-center justify-center text-neutral-400 hover:text-neutral-700"
            aria-label="Open in full chat"
            title="Open in full chat"
          >
            <ExternalLink size={14} />
          </NextLink>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center text-neutral-400 hover:text-neutral-700"
            aria-label="Close AI sidebar"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages / prompts area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!hasContent ? (
          /* Suggested prompts */
          <div className="p-3">
            <Typography variant="caption" tone="muted" className="mb-2 block">
              Ask about this page
            </Typography>
            <div className="flex flex-col gap-1.5">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  disabled={creating}
                  className="w-full rounded border border-neutral-200 px-3 py-2 text-left text-xs text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
                  onClick={() => void send(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Conversation */
          <div className="flex flex-col">
            {messages.map((m) => {
              const isUser =
                String(m.role) === 'USER' || String(m.role) === 'user'
              return (
                <div key={m.id} className="px-3 pt-3">
                  {isUser ? (
                    <div className="flex justify-end">
                      <div className="max-w-[85%] rounded bg-neutral-100 px-2.5 py-2 text-xs text-neutral-900">
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    <AiMarkdownContent
                      content={m.content ?? ''}
                      className="text-[13px]"
                    />
                  )}
                </div>
              )
            })}

            {/* Streaming assistant bubble */}
            {showStreamingBubble ? (
              <div className="px-3 pt-3">
                {streamingText ? (
                  <AiMarkdownContent
                    content={streamingText}
                    className="text-[13px]"
                    trailing={
                      <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-neutral-400 align-middle" />
                    }
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-neutral-400 [animation-delay:300ms]" />
                  </div>
                )}
              </div>
            ) : null}

            <div ref={bottomRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Error banner */}
      {error ? (
        <div className="shrink-0 border-t border-red-200 bg-red-50 px-3 py-2">
          <Typography variant="caption" className="text-red-600">
            {error}
          </Typography>
        </div>
      ) : null}

      {/* Composer */}
      <div className="shrink-0 border-t border-neutral-200 p-2">
        <div className="flex items-end gap-1.5 rounded border border-neutral-200 bg-neutral-50 px-2.5 py-2 focus-within:border-neutral-300">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything…"
            disabled={creating}
            rows={1}
            className="min-h-0 flex-1 resize-none bg-transparent text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:opacity-50"
            style={{ maxHeight: 96 }}
          />
          {isStreaming ? (
            <button
              type="button"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-200 text-neutral-600 transition-colors hover:bg-neutral-300"
              aria-label="Stop generating"
              onClick={() => void cancelStream()}
            >
              <Square size={10} fill="currentColor" />
            </button>
          ) : (
            <button
              type="button"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-neutral-900 text-white transition-colors hover:bg-neutral-700 disabled:opacity-40"
              aria-label="Send"
              disabled={!draft.trim() || creating}
              onClick={() => void handleSend()}
            >
              <Send size={10} />
            </button>
          )}
        </div>
        <div className="mt-1 flex items-center justify-between px-0.5">
          <span className="text-[10px] text-neutral-400">Enter to send</span>
          {messages.length > 0 ? (
            <button
              type="button"
              className="text-[10px] text-neutral-400 hover:text-neutral-700"
              onClick={reset}
            >
              New chat
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}
