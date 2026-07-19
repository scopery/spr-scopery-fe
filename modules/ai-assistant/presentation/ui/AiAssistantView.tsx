'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileText, X } from 'lucide-react'
import {
  Button,
  ConfirmDialog,
  Input,
  PageSkeleton,
  Select,
  Stack,
  Typography,
} from '@/shared/ui'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { useProjects } from '@/modules/projects/project/hooks/useProjects'
import { hasPermission, PERMISSIONS } from '@/modules/permissions/access/lib/permissions'
import { useEffectivePermissions } from '@/modules/permissions/access/hooks/useEffectivePermissions'
import * as workbenchApi from '@/modules/documents/document-hub/api/document-workbench.api'
import type { AiConversation } from '../../domain/model/conversation'
import { AiStreamUiState } from '../../domain/enums/ai-assistant.enum'
import { useAiAssistant } from '../hooks/useAiAssistant'
import { useContextualGuide } from '../hooks/useContextualGuide'
import { ChatMessageItem } from './ChatMessageItem'
import { ConversationListPanel } from './ConversationListPanel'
import { ExplainDisabledAction } from './ExplainDisabledAction'
import { ExplainFieldButton } from './ExplainFieldButton'
import { GuideDrawer } from './GuideDrawer'
import {
  MessageFeedbackDialog,
  type FeedbackRating,
} from './MessageFeedbackDialog'
import { NewConversationDialog } from './NewConversationDialog'
import { RenameConversationDialog } from './RenameConversationDialog'
import { StreamingAssistantMessage } from './StreamingAssistantMessage'
import { SuggestedQuestionChips } from './SuggestedQuestionChips'

export function AiAssistantView() {
  const {
    workspaceId,
    conversations,
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
    // Provisional catalog (W5-GAP-14): if BE has not rolled out Wave 5 keys yet, allow.
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

  const [newOpen, setNewOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<AiConversation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AiConversation | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<AiConversation | null>(null)
  const [feedbackTarget, setFeedbackTarget] = useState<{
    messageId: string
    rating: FeedbackRating
  } | null>(null)

  useEffect(() => {
    if (documentContext?.projectId) {
      setPickerProjectId(documentContext.projectId)
    }
  }, [documentContext?.projectId])

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

  if (loading && conversations.length === 0 && !activeId) {
    return <PageSkeleton variant="split" className="p-lg" />
  }

  return (
    <div className="grid h-full min-h-[480px] grid-cols-1 gap-md p-lg md:grid-cols-[280px_1fr]">
      <ConversationListPanel
        conversations={conversations}
        activeId={activeId}
        listTab={listTab}
        listSearch={listSearch}
        mutating={mutating}
        onTabChange={setListTab}
        onSearchChange={setListSearch}
        onNew={() => setNewOpen(true)}
        onOpen={(id) => void openConversation(id)}
        onRename={setRenameTarget}
        onArchive={setArchiveTarget}
        onDelete={setDeleteTarget}
      />

      <Stack direction="vertical" spacing="md">
        <div className="flex items-start justify-between gap-md">
          <div>
            <Typography variant="h2">
              {activeConversation?.title ?? 'AI Assistant'}
            </Typography>
            <Typography variant="caption" tone="muted">
              {activeConversation
                ? [activeConversation.conversationType, activeConversation.capabilityLevel]
                    .filter(Boolean)
                    .join(' · ') || 'Conversation'
                : 'Attach a document, then ask questions about it.'}
            </Typography>
          </div>
          <div className="flex shrink-0 flex-wrap gap-xs">
            <Button
              size="sm"
              variant="outline"
              disabled={!workspaceId || guide.streaming}
              onClick={() => void guide.explainPage()}
            >
              Explain this page
            </Button>
            {activeConversation ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={mutating}
                  onClick={() => setRenameTarget(activeConversation)}
                >
                  Rename
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={mutating}
                  onClick={() => setArchiveTarget(activeConversation)}
                >
                  Archive
                </Button>
              </>
            ) : null}
          </div>
        </div>

        <div className="space-y-sm border border-neutral-200 p-sm">
          <div className="flex items-center justify-between gap-sm">
            <Typography variant="small" weight="medium">
              Document context
            </Typography>
            <ExplainFieldButton
              fieldCode="DOCUMENT_CONTEXT"
              label="Document context"
              onExplain={(code, label) => void guide.explainField(code, label)}
              disabled={!workspaceId || guide.streaming}
            />
          </div>
          <div className="grid gap-sm sm:grid-cols-2">
            <div>
              <Typography variant="caption" tone="muted" className="mb-1.5 block">
                Project
              </Typography>
              <Select
                value={pickerProjectId}
                onValueChange={(v: string) => {
                  setPickerProjectId(v)
                  if (documentContext && documentContext.projectId !== v) {
                    clearDocumentContext()
                  }
                }}
                options={projects.map((p) => ({
                  value: p.id,
                  label: p.name || p.code || p.id,
                }))}
                placeholder="Select project"
              />
            </div>
            <div>
              <Typography variant="caption" tone="muted" className="mb-1.5 block">
                Document
              </Typography>
              <Select
                value={documentContext?.documentId ?? ''}
                onValueChange={(docId: string) => {
                  const doc = documents.find((d) => d.id === docId)
                  if (!doc || !pickerProjectId) return
                  setDocumentContext({
                    projectId: pickerProjectId,
                    documentId: doc.id,
                    title: doc.title,
                  })
                }}
                options={documents.map((d) => ({ value: d.id, label: d.title }))}
                placeholder={
                  loadingDocs
                    ? 'Loading…'
                    : pickerProjectId
                      ? 'Select document'
                      : 'Pick a project first'
                }
                disabled={!pickerProjectId || loadingDocs}
              />
            </div>
          </div>
          {documentContext ? (
            <div className="flex items-center gap-sm border border-primary-200 bg-primary-50 px-sm py-xs">
              <FileText size={14} className="shrink-0 text-primary-600" />
              <Typography variant="small" className="min-w-0 flex-1 truncate">
                Asking about: {documentContext.title}
              </Typography>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Clear document"
                onClick={clearDocumentContext}
                icon={<X size={14} />}
              />
            </div>
          ) : null}
        </div>

        {error ? <Typography tone="error">{error}</Typography> : null}

        <SuggestedQuestionChips
          questions={guide.suggestedQuestions}
          loading={guide.loadingSuggestions}
          disabled={isStreaming}
          onExplainPage={() => void guide.explainPage()}
          onSelect={(q) => {
            if (activeId) void sendMessage(q)
            else void guide.explainPage()
          }}
        />

        {!activeId ? (
          <div className="border border-neutral-200 p-md">
            <Typography variant="small" tone="muted" className="mb-sm block">
              Start a general guide or project assistant conversation.
            </Typography>
            <div className="flex flex-wrap gap-sm">
              <Button size="sm" onClick={() => setNewOpen(true)} disabled={mutating}>
                New chat
              </Button>
              <ExplainDisabledAction
                actionCode="SEND_WITHOUT_CONVERSATION"
                label="Send message"
                onExplain={(code, label) => void guide.explainDisabledAction(code, label)}
              >
                <Button size="sm" disabled>
                  Send
                </Button>
              </ExplainDisabledAction>
            </div>
          </div>
        ) : null}

        <div className="flex-1 space-y-sm overflow-auto border border-neutral-200 p-md">
          {activeId && messages.length === 0 && !isStreaming && !streamingText ? (
            <Typography variant="small" tone="muted">
              Send a message to begin.
            </Typography>
          ) : null}
          {messages.map((m) => (
            <ChatMessageItem
              key={m.id}
              message={m}
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
          {isStreaming ||
          streamingText ||
          streamTools.length > 0 ||
          streamUiState === AiStreamUiState.Failed ||
          streamState.canRetryConnection ? (
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
        </div>

        <div className="flex gap-sm">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={
              documentContext
                ? `Ask about “${documentContext.title}”…`
                : 'Ask about the current context…'
            }
            aria-label="AI message"
            disabled={!activeId || isStreaming}
            maxLength={8000}
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                !e.shiftKey &&
                draft.trim() &&
                activeId &&
                !isStreaming
              ) {
                e.preventDefault()
                void sendMessage(draft)
                setDraft('')
              }
            }}
          />
          {isStreaming ? (
            <Button
              variant="outline"
              onClick={() => void cancelStream()}
              disabled={streamUiState === AiStreamUiState.Cancelling}
            >
              {streamUiState === AiStreamUiState.Cancelling ? 'Stopping…' : 'Stop'}
            </Button>
          ) : (
            <Button
              onClick={() => {
                void sendMessage(draft)
                setDraft('')
              }}
              disabled={!activeId || !draft.trim()}
            >
              Send
            </Button>
          )}
        </div>
      </Stack>

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
        }}
      />

      <NewConversationDialog
        open={newOpen}
        onClose={() => setNewOpen(false)}
        loading={mutating}
        projects={projects}
        defaultProjectId={(documentContext?.projectId ?? pickerProjectId) || null}
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
