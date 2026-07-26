'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight, ChevronLeft, ExternalLink, HelpCircle, History, Plus, Search, Send, Sparkles, Square, X } from 'lucide-react'
import { Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import { AiStreamUiState } from '../../domain/enums/ai-assistant.enum'
import { useAiSidebarChat } from '../hooks/useAiSidebarChat'
import { ActionConfirmationCard } from './ActionConfirmationCard'
import { AiMarkdownContent } from './AiMarkdownContent'
import { AiActionsGuide } from './AiActionsGuide'

// ─── Context-aware prompts ────────────────────────────────────────────────────

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
    'What are the main deliverables?',
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const mins = Math.floor((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return d.toLocaleDateString()
}

function groupConvsByDate(convs: { id: string; title: string | null; lastMessageAt?: string | null; updatedAt?: string | null; createdAt: string }[]) {
  const now = Date.now()
  const todayCutoff = new Date(); todayCutoff.setHours(0, 0, 0, 0)
  const weekCutoff = new Date(now - 7 * 24 * 60 * 60 * 1000)
  const today: typeof convs = []
  const week: typeof convs = []
  const older: typeof convs = []
  for (const c of convs) {
    const d = new Date(c.lastMessageAt ?? c.updatedAt ?? c.createdAt)
    if (d >= todayCutoff) today.push(c)
    else if (d >= weekCutoff) week.push(c)
    else older.push(c)
  }
  return { today, week, older }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MIN_WIDTH = 360
const MAX_WIDTH = 560
const DEFAULT_WIDTH = 420
const WIDTH_KEY = 'scopery.ai-sidebar.width'

// ─── Props ────────────────────────────────────────────────────────────────────

interface AiProjectSidebarPanelProps {
  workspaceId: string
  projectId: string | null
  projectName: string | null
  onClose: () => void
}

// ─── Main component ───────────────────────────────────────────────────────────

export function AiProjectSidebarPanel({
  workspaceId,
  projectId,
  projectName,
  onClose,
}: AiProjectSidebarPanelProps) {
  const pathname = usePathname()

  const [draft, setDraft] = useState('')
  const [composerFocused, setComposerFocused] = useState(false)
  const [actionsGuideOpen, setActionsGuideOpen] = useState(false)
  const [view, setView] = useState<'chat' | 'history'>('chat')
  const [historySearch, setHistorySearch] = useState('')

  const [width, setWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDTH
    try {
      const stored = localStorage.getItem(WIDTH_KEY)
      if (stored) {
        const n = parseInt(stored, 10)
        if (n >= MIN_WIDTH && n <= MAX_WIDTH) return n
      }
    } catch { /* ignore */ }
    return DEFAULT_WIDTH
  })

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, startWidth: 0 })

  const {
    conversationId,
    conversations,
    messages,
    streamingText,
    streamUiState,
    streamState,
    isStreaming,
    creating,
    error,
    send,
    reset,
    cancelStream,
    initLoad,
    openConversation,
    dismissActionPlan,
  } = useAiSidebarChat({ workspaceId, projectId })

  useEffect(() => { void initLoad() }, [initLoad])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingText, streamState.pendingActionPlans.length])

  // ── Drag resize ──

  const handleDragMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      isDraggingRef.current = true
      dragStartRef.current = { x: e.clientX, startWidth: width }
      document.body.style.userSelect = 'none'
      document.body.style.cursor = 'col-resize'

      const onMouseMove = (ev: MouseEvent) => {
        if (!isDraggingRef.current) return
        const delta = dragStartRef.current.x - ev.clientX
        const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, dragStartRef.current.startWidth + delta))
        setWidth(newWidth)
        try { localStorage.setItem(WIDTH_KEY, String(newWidth)) } catch { /* ignore */ }
      }

      const onMouseUp = () => {
        isDraggingRef.current = false
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    },
    [width]
  )

  // ── Send ──

  const handleSend = async () => {
    const text = draft.trim()
    if (!text || isStreaming) return
    setDraft('')
    setView('chat')
    await send(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  // ── Derived state ──

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

  const visibleConversations = conversations
    .filter((c) => c.status !== 'ARCHIVED' && c.status !== 'DELETED')

  const recentConvs = visibleConversations.slice(0, 3)

  const filteredConvs = historySearch.trim()
    ? visibleConversations.filter((c) =>
        (c.title ?? '').toLowerCase().includes(historySearch.toLowerCase())
      )
    : visibleConversations

  const { today, week, older } = groupConvsByDate(filteredConvs)

  const contextLabel = projectName ?? 'this project'
  const prompts = getContextPrompts(pathname, contextLabel)

  // ── Handle history open conversation ──

  const handleOpenConversation = async (id: string) => {
    await openConversation(id)
    setView('chat')
  }

  const handleReset = () => {
    reset()
    setView('chat')
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      className="relative hidden h-full min-h-0 shrink-0 flex-col border-l border-neutral-200 bg-white lg:flex"
      style={{ width }}
    >
      {/* Resize drag handle */}
      <div
        className="absolute inset-y-0 left-0 z-20 w-1 cursor-col-resize hover:bg-neutral-200"
        onMouseDown={handleDragMouseDown}
      />

      {/* ── Header ── */}
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 pl-4 pr-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-blue-400 text-white">
            <Sparkles size={13} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-calsans text-neutral-900">Scopery AI</p>
            {projectName ? (
              <p className="truncate text-xs text-neutral-400">{projectName}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            title="Conversation history"
            className={cn(
              'flex h-8 w-8 items-center justify-center transition-colors',
              view === 'history'
                ? 'bg-neutral-100 text-neutral-800'
                : 'text-neutral-400 hover:bg-neutral-50 hover:text-neutral-700'
            )}
            onClick={() => setView((v) => v === 'history' ? 'chat' : 'history')}
          >
            <History size={15} />
          </button>
          <NextLink
            href={fullChatHref}
            className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
            title="Open full chat"
          >
            <ExternalLink size={15} />
          </NextLink>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center text-neutral-400 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* ── History view ── */}
      {view === 'history' ? (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* History header */}
          <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-4 py-2.5">
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-800"
              onClick={() => setView('chat')}
            >
              <ChevronLeft size={14} />
              Back
            </button>
            <button
              type="button"
              className="flex items-center gap-1.5 text-sm text-neutral-700 transition-colors hover:text-neutral-900"
              onClick={() => { handleReset(); setView('chat') }}
            >
              <Plus size={14} />
              New conversation
            </button>
          </div>

          {/* Search */}
          <div className="shrink-0 px-4 py-3">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                className="w-full border border-neutral-200 bg-neutral-50 py-2 pl-7 pr-3 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-300 focus:bg-white focus:outline-none"
                placeholder="Search conversations…"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredConvs.length === 0 ? (
              <p className="px-4 py-3 text-sm text-neutral-400">No conversations found.</p>
            ) : (
              <>
                {[
                  { label: 'Today', items: today },
                  { label: 'Previous 7 days', items: week },
                  { label: 'Older', items: older },
                ]
                  .filter((g) => g.items.length > 0)
                  .map((group) => (
                    <div key={group.label}>
                      <div className="px-4 pb-1 pt-3">
                        <span className="text-xs font-medium text-neutral-400">
                          {group.label}
                        </span>
                      </div>
                      {group.items.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={cn(
                            'flex w-full items-baseline justify-between gap-3 px-4 py-2.5 text-left transition-colors hover:bg-neutral-50',
                            conversationId === c.id && 'bg-neutral-50'
                          )}
                          onClick={() => void handleOpenConversation(c.id)}
                        >
                          <span
                            className={cn(
                              'min-w-0 flex-1 truncate text-sm',
                              conversationId === c.id
                                ? 'font-medium text-neutral-900'
                                : 'text-neutral-700'
                            )}
                          >
                            {c.title ?? 'Untitled'}
                          </span>
                          <span className="shrink-0 text-xs text-neutral-400">
                            {formatWhen(c.lastMessageAt ?? c.updatedAt ?? c.createdAt)}
                          </span>
                        </button>
                      ))}
                    </div>
                  ))}
              </>
            )}
          </div>
        </div>
      ) : (
        /* ── Chat view (Landing or Conversation) ── */
        <>
          <div className="min-h-0 flex-1 overflow-y-auto">

            {/* ── Landing ── */}
            {!hasContent ? (
              <div className="flex flex-col">
                {/* Context strip */}
                <div className="border-b border-neutral-100 px-4 py-3">
                  <p className="text-xs text-neutral-400">Asking about</p>
                  <p className="mt-0.5 truncate text-sm text-neutral-700">{contextLabel}</p>
                </div>

                {/* Suggestions */}
                <div>
                  <div className="px-4 pb-1 pt-4">
                    <p className="text-xs text-neutral-400">Suggestions</p>
                  </div>
                  {prompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={creating}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-left transition-colors hover:bg-neutral-50 disabled:opacity-50"
                      onClick={() => void send(prompt)}
                    >
                      <span className="text-sm text-neutral-700">{prompt}</span>
                      <ArrowRight size={14} className="ml-3 shrink-0 text-neutral-300" />
                    </button>
                  ))}
                </div>

                {/* Recent conversations */}
                {recentConvs.length > 0 ? (
                  <div>
                    <div className="flex items-center justify-between px-4 pb-1 pt-5">
                      <p className="text-xs text-neutral-400">Recent</p>
                      <button
                        type="button"
                        className="text-xs text-neutral-400 transition-colors hover:text-neutral-700"
                        onClick={() => setView('history')}
                      >
                        See all
                      </button>
                    </div>
                    {recentConvs.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="flex w-full items-baseline justify-between px-4 py-2 text-left transition-colors hover:bg-neutral-50"
                        onClick={() => void handleOpenConversation(c.id)}
                      >
                        <span className="min-w-0 flex-1 truncate text-sm text-neutral-600">
                          {c.title ?? 'Untitled'}
                        </span>
                        <span className="ml-3 shrink-0 text-xs text-neutral-400">
                          {formatWhen(c.lastMessageAt ?? c.updatedAt ?? c.createdAt)}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              /* ── Conversation ── */
              <div className="flex flex-col">
                {messages.map((m) => {
                  const isUser = String(m.role) === 'USER' || String(m.role) === 'user'
                  return (
                    <div key={m.id} className={cn('px-4 pt-4', isUser && 'flex justify-end')}>
                      {isUser ? (
                        <div className="max-w-[85%] bg-neutral-900 px-3 py-2 text-sm leading-relaxed text-white">
                          {m.content}
                        </div>
                      ) : (
                        <AiMarkdownContent content={m.content ?? ''} className="text-sm [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-sm [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5" />
                      )}
                    </div>
                  )
                })}

                {showStreamingBubble ? (
                  <div className="px-4 pt-4">
                    {streamingText ? (
                      <AiMarkdownContent
                        content={streamingText}
                        className="text-sm [&_h1]:text-sm [&_h2]:text-sm [&_h3]:text-sm [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5"
                        trailing={
                          <span className="ml-0.5 inline-block h-3.5 w-0.5 animate-pulse bg-neutral-400 align-middle" />
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce bg-neutral-400 [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce bg-neutral-400 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce bg-neutral-400 [animation-delay:300ms]" />
                      </div>
                    )}
                  </div>
                ) : null}

                {streamState.pendingActionPlans.length > 0 ? (
                  <div className="px-4 pt-3">
                    <ActionConfirmationCard
                      plans={streamState.pendingActionPlans}
                      isStreaming={isStreaming}
                      onDismiss={dismissActionPlan}
                    />
                  </div>
                ) : null}

                <div ref={bottomRef} className="h-4" />
              </div>
            )}
          </div>

          {/* Error banner */}
          {error ? (
            <div className="shrink-0 border-t border-red-100 bg-red-50 px-4 py-2">
              <Typography variant="caption" className="text-red-600">{error}</Typography>
            </div>
          ) : null}

          {/* ── Composer ── */}
          <div className="shrink-0 border-t border-neutral-200 p-3">
            <div className="relative">
              {actionsGuideOpen ? <AiActionsGuide onClose={() => setActionsGuideOpen(false)} /> : null}
            </div>
            <div
              className={cn(
                'flex items-center gap-2 border bg-white px-3 py-2.5 transition-colors',
                composerFocused ? 'border-neutral-300' : 'border-neutral-200'
              )}
            >
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
                onKeyDown={handleKeyDown}
                onFocus={() => setComposerFocused(true)}
                onBlur={() => setComposerFocused(false)}
                placeholder="Ask anything…"
                disabled={creating}
                rows={1}
                className="min-h-0 flex-1 resize-none bg-transparent text-sm leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:outline-none disabled:opacity-50"
                style={{ maxHeight: 120 }}
              />
              {isStreaming ? (
                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center text-neutral-500 transition-colors hover:bg-neutral-100"
                  aria-label="Stop generating"
                  onClick={() => void cancelStream()}
                >
                  <Square size={11} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="button"
                  className="flex h-7 w-7 shrink-0 items-center justify-center bg-neutral-900 text-white transition-colors hover:bg-neutral-700 disabled:opacity-30"
                  aria-label="Send"
                  disabled={!draft.trim() || creating}
                  onClick={() => void handleSend()}
                >
                  <Send size={12} />
                </button>
              )}
            </div>
            <div className="mt-1.5 flex items-center justify-between px-0.5">
              {composerFocused ? (
                <p className="text-xs text-neutral-400">Enter to send · Shift+Enter for new line</p>
              ) : <span />}
              <button
                type="button"
                onClick={() => setActionsGuideOpen((v) => !v)}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-neutral-600"
                aria-label="Show available AI actions"
              >
                <HelpCircle size={12} />
                Actions
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
