'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Button,
  ConfirmDialog,
  PageSkeleton,
  Typography,
} from '@/shared/ui'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { useProjects } from '@/modules/projects/project/hooks/useProjects'
import { hasPermission, PERMISSIONS } from '@/modules/permissions/access/lib/permissions'
import { useEffectivePermissions } from '@/modules/permissions/access/hooks/useEffectivePermissions'
import * as workbenchApi from '@/modules/documents/document-hub/api/document-workbench.api'
import { ROUTES } from '@/constants/routes'
import type { AiConversation } from '../../domain/model/conversation'
import { AiStreamUiState } from '../../domain/enums/ai-assistant.enum'
import { useAiAssistant } from '../hooks/useAiAssistant'
import { useContextualGuide } from '../hooks/useContextualGuide'
import { AiConversationDrawer } from './AiConversationDrawer'
import type { AiChatSource } from './AiContextPicker'
import { sourceKey } from './AiContextPicker'
import { AiWorkspaceComposer } from './AiWorkspaceComposer'
import { AiWorkspaceContextStrip } from './AiWorkspaceContextStrip'
import {
  AiWorkspaceLanding,
  type AiLandingMode,
  type AiLandingPrompt,
} from './AiWorkspaceLanding'
import { AiWorkspaceSourcesPanel } from './AiWorkspaceSourcesPanel'
import { AiWorkspaceTopBar } from './AiWorkspaceTopBar'
import { ChatMessageItem } from './ChatMessageItem'
import { GuideDrawer } from './GuideDrawer'
import {
  MessageFeedbackDialog,
  type FeedbackRating,
} from './MessageFeedbackDialog'
import { NewConversationDialog } from './NewConversationDialog'
import { RenameConversationDialog } from './RenameConversationDialog'
import { StreamingAssistantMessage } from './StreamingAssistantMessage'

function formatRelativeWhen(iso: string | undefined | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const diffMs = Date.now() - d.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  return d.toLocaleDateString()
}

export function AiAssistantView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    workspaceId,
    conversations,
    allConversations,
    activeId,
    activeConversation,
    messages,
    streamingText,
    streamTools,
    streamUiState,
    streamState,
    isStreaming,
    documentContext,
    setDocumentContext,
    clearDocumentContext,
    loading,
    mutating,
    error,
    listTab,
    setListTab,
    listSearch,
    setListSearch,
    openConversation,
    startConversation,
    startWork,
    goToLanding,
    renameConversation,
    archiveConversation,
    deleteConversation,
    sendMessage,
    cancelStream,
    retryStreamConnection,
    rateMessage,
    feedbackByMessageId,
  } = useAiAssistant()

  const { workspaces, currentWorkspaceId } = useAuth()
  const orgId =
    workspaces.find((w) => w.id === currentWorkspaceId)?.organizationId ??
    workspaces[0]?.organizationId ??
    null
  const { permissions } = useEffectivePermissions(orgId)
  const canSubmitFeedback = useMemo(() => {
    if (!permissions) return true
    if (hasPermission(permissions, PERMISSIONS.AI_ASSISTANT_FEEDBACK_CREATE)) return true
    const hasWave5Keys = permissions.permissions.some((p) => p.startsWith('AI_ASSISTANT'))
    return !hasWave5Keys
  }, [permissions])

  const pageCode = documentContext?.documentId ? 'DOCUMENT_DETAIL' : 'AI_ASSISTANT'
  const guide = useContextualGuide({
    workspaceId,
    projectId: documentContext?.projectId ?? null,
    pageCode,
    entityType: documentContext ? 'DOCUMENT' : null,
  })

  const { projects } = useProjects(workspaceId)
  const [draft, setDraft] = useState('')
  const [pickerProjectId, setPickerProjectId] = useState('')
  const [documents, setDocuments] = useState<Array<{ id: string; title: string }>>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [conversationsOpen, setConversationsOpen] = useState(false)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [contextPickerOpen, setContextPickerOpen] = useState(false)
  const [selectedSources, setSelectedSources] = useState<AiChatSource[]>([])
  const sourcesSeededRef = useRef(false)

  const [newOpen, setNewOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<AiConversation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AiConversation | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<AiConversation | null>(null)
  const [feedbackTarget, setFeedbackTarget] = useState<{
    messageId: string
    rating: FeedbackRating
  } | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const isAtBottomRef = useRef(true)

  useEffect(() => {
    if (!isAtBottomRef.current) return
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [messages, streamingText])

  const qProjectId = searchParams.get('projectId')
  const qDocumentId = searchParams.get('documentId')
  const qDocumentTitle = searchParams.get('documentTitle')

  // Seed sources once from URL / document context (deep-link).
  useEffect(() => {
    if (sourcesSeededRef.current) return
    if (documentContext) {
      sourcesSeededRef.current = true
      setSelectedSources([
        {
          type: 'document',
          id: documentContext.documentId,
          projectId: documentContext.projectId,
          label: documentContext.title,
        },
      ])
      setPickerProjectId(documentContext.projectId)
      return
    }
    if (qProjectId && qDocumentId) {
      sourcesSeededRef.current = true
      setSelectedSources([
        {
          type: 'document',
          id: qDocumentId,
          projectId: qProjectId,
          label: qDocumentTitle?.trim() || 'Document',
        },
      ])
      setPickerProjectId(qProjectId)
      return
    }
    if (qProjectId && projects.length > 0) {
      sourcesSeededRef.current = true
      const p = projects.find((x) => x.id === qProjectId)
      setSelectedSources([
        {
          type: 'project',
          id: qProjectId,
          label: p?.name || p?.code || 'Project',
        },
      ])
      setPickerProjectId(qProjectId)
    }
  }, [documentContext, qProjectId, qDocumentId, qDocumentTitle, projects])

  // Keep hook grounding in sync with selected sources (primary = first document).
  useEffect(() => {
    if (!sourcesSeededRef.current && selectedSources.length === 0) return
    const primaryDoc = selectedSources.find((s) => s.type === 'document')
    if (primaryDoc && primaryDoc.type === 'document') {
      setDocumentContext({
        projectId: primaryDoc.projectId,
        documentId: primaryDoc.id,
        title: primaryDoc.label,
      })
      setPickerProjectId(primaryDoc.projectId)
      return
    }
    const primaryProject = selectedSources.find((s) => s.type === 'project')
    if (primaryProject) {
      clearDocumentContext()
      setPickerProjectId(primaryProject.id)
      return
    }
    clearDocumentContext()
  }, [selectedSources, setDocumentContext, clearDocumentContext])

  useEffect(() => {
    if (!pickerProjectId) {
      setDocuments([])
      return
    }
    let cancelled = false
    setLoadingDocs(true)
    void workbenchApi
      .listProjectDocuments(pickerProjectId)
      .then((res) => {
        if (cancelled) return
        setDocuments(
          res.items.map((d) => ({
            id: d.id,
            title: d.title || d.code || d.id,
          }))
        )
      })
      .catch(() => {
        if (!cancelled) setDocuments([])
      })
      .finally(() => {
        if (!cancelled) setLoadingDocs(false)
      })
    return () => {
      cancelled = true
    }
  }, [pickerProjectId])

  const toggleSource = (source: AiChatSource) => {
    sourcesSeededRef.current = true
    setSelectedSources((prev) => {
      const key = sourceKey(source)
      if (prev.some((s) => sourceKey(s) === key)) {
        return prev.filter((s) => sourceKey(s) !== key)
      }
      return [...prev, source]
    })
  }

  const removeSource = (source: AiChatSource) => {
    sourcesSeededRef.current = true
    const key = sourceKey(source)
    setSelectedSources((prev) => prev.filter((s) => sourceKey(s) !== key))
  }

  const selectedProject = useMemo(() => {
    const docProjectId = selectedSources.find(
      (s): s is Extract<AiChatSource, { type: 'document' }> => s.type === 'document'
    )?.projectId
    const projectSourceId = selectedSources.find(
      (s): s is Extract<AiChatSource, { type: 'project' }> => s.type === 'project'
    )?.id
    const projectId = docProjectId ?? projectSourceId ?? pickerProjectId ?? qProjectId
    if (!projectId) return null
    return projects.find((p) => p.id === projectId) ?? null
  }, [projects, selectedSources, pickerProjectId, qProjectId])

  const landingMode: AiLandingMode = selectedSources.some((s) => s.type === 'document')
    ? 'document'
    : selectedSources.some((s) => s.type === 'project') || selectedProject || qProjectId
      ? 'project'
      : 'general'

  const primaryDocLabel = selectedSources.find((s) => s.type === 'document')?.label
  const contextLabel =
    landingMode === 'document'
      ? primaryDocLabel || 'this document'
      : landingMode === 'project'
        ? selectedProject?.name || selectedProject?.code || 'this project'
        : 'Scopery'

  const isLanding = !activeId

  const recent = useMemo(
    () =>
      (allConversations ?? conversations)
        .filter((c) => c.status !== 'ARCHIVED' && c.status !== 'DELETED')
        .slice(0, 5)
        .map((c) => ({
          id: c.id,
          title: c.title ?? 'Untitled',
          when: formatRelativeWhen(c.lastMessageAt ?? c.updatedAt ?? c.createdAt),
        })),
    [allConversations, conversations]
  )

  const projectOptions = useMemo(
    () =>
      projects.map((p) => ({
        id: p.id,
        label: p.name || p.code || p.id,
      })),
    [projects]
  )

  const primaryProjectIdForStart =
    selectedSources.find(
      (s): s is Extract<AiChatSource, { type: 'project' }> => s.type === 'project'
    )?.id ??
    selectedSources.find(
      (s): s is Extract<AiChatSource, { type: 'document' }> => s.type === 'document'
    )?.projectId ??
    (pickerProjectId || null)

  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const role = String(messages[i].role)
      if (role === 'ASSISTANT' || role === 'assistant') return messages[i].id
    }
    return null
  }, [messages])

  const showLiveAssistant = useMemo(() => {
    if (isStreaming || streamState.canRetryConnection) return true
    if (
      streamUiState === AiStreamUiState.Failed ||
      streamUiState === AiStreamUiState.Cancelled
    ) {
      return true
    }
    if (streamUiState === AiStreamUiState.Completed) {
      const streamMsgId = streamState.assistantMessageId
      if (streamMsgId && messages.some((m) => m.id === streamMsgId)) return false
      const last = messages[messages.length - 1]
      const lastRole = last ? String(last.role) : ''
      const lastIsAssistant = lastRole === 'ASSISTANT' || lastRole === 'assistant'
      if (lastIsAssistant && streamingText && (last?.content ?? '') === streamingText) {
        return false
      }
      return Boolean(streamingText || streamTools.length > 0)
    }
    return false
  }, [
    isStreaming,
    streamState.canRetryConnection,
    streamState.assistantMessageId,
    streamUiState,
    messages,
    streamingText,
    streamTools.length,
  ])

  const handleStartPrompt = async (item: AiLandingPrompt) => {
    isAtBottomRef.current = true
    await startWork(item.prompt, {
      projectId: primaryProjectIdForStart,
      title: item.title,
    })
  }

  const handleSend = async () => {
    const text = draft.trim()
    if (!text) return
    isAtBottomRef.current = true
    if (activeId) {
      await sendMessage(text)
      setDraft('')
      return
    }
    setDraft('')
    await startWork(text, {
      projectId: primaryProjectIdForStart,
    })
  }

  const handleMinimize = () => {
    if (!workspaceId) return
    router.push(ROUTES.workspace.overview(workspaceId))
  }

  if (loading && conversations.length === 0 && !activeId) {
    return <PageSkeleton variant="split" className="p-lg" />
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-neutral-50">
      <AiWorkspaceTopBar
        title={
          isLanding
            ? contextLabel !== 'Scopery'
              ? contextLabel
              : ''
            : activeConversation?.title ?? 'Conversation'
        }
        subtitle={
          isLanding
            ? null
            : [selectedProject?.name, documentContext?.title].filter(Boolean).join(' / ') || null
        }
        sourcesOpen={sourcesOpen}
        onToggleConversations={() => setConversationsOpen(true)}
        onToggleSources={() => setSourcesOpen((v) => !v)}
        onNewChat={() => {
          goToLanding()
          setConversationsOpen(false)
        }}
        onMinimize={handleMinimize}
        onMore={() => setMoreOpen((v) => !v)}
      />

      <AiWorkspaceContextStrip
        sources={selectedSources}
        onAdd={() => setContextPickerOpen(true)}
        onOpenSources={() => setSourcesOpen(true)}
      />

      {moreOpen && activeConversation ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white px-3 py-2">
          <Button size="sm" variant="ghost" onClick={() => setRenameTarget(activeConversation)}>
            Rename
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setArchiveTarget(activeConversation)}>
            Archive
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void guide.explainPage()}>
            Explain this page
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setContextPickerOpen(true)}>
            Edit sources
          </Button>
        </div>
      ) : null}

      {error ? (
        <div className="border-b border-red-200 bg-red-50 px-4 py-2">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          {isLanding ? (
            <AiWorkspaceLanding
              mode={landingMode}
              contextLabel={contextLabel}
              recent={recent}
              disabled={mutating || isStreaming}
              onSelectPrompt={(p) => void handleStartPrompt(p)}
              onOpenRecent={(id) => void openConversation(id)}
            />
          ) : (
            <div
              className="min-h-0 flex-1 overflow-auto bg-white"
              onScroll={(e) => {
                const el = e.currentTarget
                isAtBottomRef.current =
                  el.scrollHeight - el.scrollTop - el.clientHeight < 80
              }}
            >
              <div className="mx-auto w-full max-w-[880px] px-3 md:px-6">
                {messages.length === 0 && !isStreaming && !streamingText ? (
                  <div className="py-12">
                    <Typography variant="small" tone="muted">
                      Ask a follow-up to continue this conversation.
                    </Typography>
                  </div>
                ) : null}
                {messages.map((m) => (
                  <ChatMessageItem
                    key={m.id}
                    message={m}
                    actionMode={landingMode}
                    showActions={m.id === lastAssistantId && !showLiveAssistant}
                    feedbackSubmitted={Boolean(feedbackByMessageId[m.id])}
                    canSubmitFeedback={canSubmitFeedback}
                    onRequestFeedback={(messageId, rating) =>
                      setFeedbackTarget({ messageId, rating })
                    }
                    onCopy={(content) => {
                      void navigator.clipboard?.writeText(content)
                    }}
                  />
                ))}
                {showLiveAssistant ? (
                  <StreamingAssistantMessage
                    text={streamingText}
                    tools={streamTools}
                    uiState={streamUiState}
                    messageStatus={streamState.messageStatus}
                    error={streamState.error}
                    canRetryConnection={streamState.canRetryConnection}
                    onRetryConnection={retryStreamConnection}
                    onStop={() => void cancelStream()}
                  />
                ) : null}
                <div ref={bottomRef} />
              </div>
            </div>
          )}

          <AiWorkspaceComposer
            value={draft}
            placeholder={
              selectedSources.length > 0
                ? `Ask about ${selectedSources.map((s) => s.label).slice(0, 2).join(', ')}${selectedSources.length > 2 ? '…' : ''}…`
                : 'Ask anything…'
            }
            disabled={mutating}
            isStreaming={isStreaming}
            streamUiState={streamUiState}
            canRetryConnection={streamState.canRetryConnection}
            streamError={streamState.error}
            sources={selectedSources}
            pickerOpen={contextPickerOpen}
            projects={projectOptions}
            documents={documents}
            loadingDocs={loadingDocs}
            browseProjectId={pickerProjectId}
            onBrowseProjectChange={setPickerProjectId}
            onToggleSource={toggleSource}
            onRemoveSource={removeSource}
            onChange={setDraft}
            onSend={() => void handleSend()}
            onStop={() => void cancelStream()}
            onRetryConnection={retryStreamConnection}
            onOpenPicker={() => setContextPickerOpen(true)}
            onClosePicker={() => setContextPickerOpen(false)}
          />
        </div>

        <AiWorkspaceSourcesPanel
          open={sourcesOpen}
          sources={selectedSources}
          excludedCount={0}
          knowledgeSectionCount={0}
          onClose={() => setSourcesOpen(false)}
          onRemove={removeSource}
          onAdd={() => {
            setSourcesOpen(false)
            setContextPickerOpen(true)
          }}
        />
      </div>

      <AiConversationDrawer
        open={conversationsOpen}
        conversations={conversations}
        activeId={activeId}
        listTab={listTab}
        listSearch={listSearch}
        mutating={mutating}
        onClose={() => setConversationsOpen(false)}
        onTabChange={setListTab}
        onSearchChange={setListSearch}
        onNew={() => {
          setConversationsOpen(false)
          setNewOpen(true)
        }}
        onOpen={(id) => void openConversation(id)}
        onRename={setRenameTarget}
        onArchive={setArchiveTarget}
        onDelete={setDeleteTarget}
      />

      <GuideDrawer
        open={guide.drawerOpen}
        title={guide.contextTitle}
        streamingText={guide.streamingText}
        streaming={guide.streaming}
        error={guide.error}
        suggestedQuestions={guide.suggestedQuestions}
        onClose={guide.closeDrawer}
        onAskFollowUp={(q) => {
          if (activeId) void sendMessage(q)
          else void startWork(q, { projectId: primaryProjectIdForStart })
        }}
      />

      <NewConversationDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        loading={mutating}
        projects={projects}
        defaultProjectId={primaryProjectIdForStart}
        onSubmit={async (values) => {
          const created = await startConversation({
            projectId: values.projectId,
            title: values.title || null,
            conversationType: values.conversationType,
            capabilityLevel: values.capabilityLevel,
          })
          return Boolean(created)
        }}
      />

      <RenameConversationDialog
        open={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        initialTitle={renameTarget?.title ?? ''}
        loading={mutating}
        onSubmit={async (title) => {
          if (!renameTarget) return false
          return renameConversation(renameTarget.id, title)
        }}
      />

      <MessageFeedbackDialog
        open={Boolean(feedbackTarget)}
        onClose={() => setFeedbackTarget(null)}
        initialRating={feedbackTarget?.rating ?? 'THUMBS_UP'}
        loading={mutating}
        onSubmit={async (values) => {
          if (!feedbackTarget) return false
          return rateMessage(feedbackTarget.messageId, values.rating, {
            reasonCode: values.reasonCode,
            comment: values.comment,
          })
        }}
      />

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        title="Archive conversation"
        message={`Archive “${archiveTarget?.title ?? 'Untitled'}”? You can still find it under Archived.`}
        confirmLabel="Archive"
        loading={mutating}
        onConfirm={async () => {
          if (!archiveTarget) return
          const ok = await archiveConversation(archiveTarget.id)
          if (!ok) throw new Error('Archive failed')
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete conversation"
        message={`Soft-delete “${deleteTarget?.title ?? 'Untitled'}”? This removes it from your list.`}
        confirmLabel="Delete"
        variant="danger"
        loading={mutating}
        onConfirm={async () => {
          if (!deleteTarget) return
          const ok = await deleteConversation(deleteTarget.id)
          if (!ok) throw new Error('Delete failed')
        }}
      />
    </div>
  )
}
