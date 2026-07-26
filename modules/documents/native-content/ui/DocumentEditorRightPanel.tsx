'use client'

import dynamic from 'next/dynamic'
import {
  Blocks,
  Eye,
  FileStack,
  History,
  MessageSquare,
  Paperclip,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  Sparkles,
  GitPullRequest,
  Network,
  Layers,
  ListTree,
} from 'lucide-react'
import type { Value } from 'platejs'
import { Button, ContentLoader, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { EditorSidePanel } from '../model/collaboration'

const panelFallback = (
  <div className="flex justify-center py-6">
    <ContentLoader />
  </div>
)

const DocumentAttachmentsPanel = dynamic(
  () => import('./DocumentAttachmentsPanel').then((m) => m.DocumentAttachmentsPanel),
  { loading: () => panelFallback }
)
const DocumentSubpagesPanel = dynamic(
  () => import('./DocumentSubpagesPanel').then((m) => m.DocumentSubpagesPanel),
  { loading: () => panelFallback }
)
const DocumentCommentsPanel = dynamic(
  () => import('./DocumentCommentsPanel').then((m) => m.DocumentCommentsPanel),
  { loading: () => panelFallback }
)
const DocumentSuggestionsPanel = dynamic(
  () => import('./DocumentSuggestionsPanel').then((m) => m.DocumentSuggestionsPanel),
  { loading: () => panelFallback }
)
const DocumentHistoryPanel = dynamic(
  () => import('./DocumentHistoryPanel').then((m) => m.DocumentHistoryPanel),
  { loading: () => panelFallback }
)
const SyncedBlocksPanel = dynamic(
  () => import('./SyncedBlocksPanel').then((m) => m.SyncedBlocksPanel),
  { loading: () => panelFallback }
)
const NativeTemplatePublishPanel = dynamic(
  () => import('./NativeTemplatePublishPanel').then((m) => m.NativeTemplatePublishPanel),
  { loading: () => panelFallback }
)
const SmartBlocksPanel = dynamic(
  () => import('./SmartBlocksPanel').then((m) => m.SmartBlocksPanel),
  { loading: () => panelFallback }
)
const ClientVisibilityPanel = dynamic(
  () => import('./ClientVisibilityPanel').then((m) => m.ClientVisibilityPanel),
  { loading: () => panelFallback }
)
const ResourceMentionsPanel = dynamic(
  () => import('./ResourceMentionsPanel').then((m) => m.ResourceMentionsPanel),
  { loading: () => panelFallback }
)
const AiContextPanel = dynamic(
  () => import('./AiContextPanel').then((m) => m.AiContextPanel),
  { loading: () => panelFallback }
)
const DocumentIndexingPanel = dynamic(
  () => import('./DocumentIndexingPanel').then((m) => m.DocumentIndexingPanel),
  { loading: () => panelFallback }
)

const PANEL_META: {
  id: EditorSidePanel
  label: string
  icon: typeof MessageSquare
}[] = [
  { id: 'comments', label: 'Comments', icon: MessageSquare },
  { id: 'attachments', label: 'Files', icon: Paperclip },
  { id: 'suggestions', label: 'Suggestions', icon: GitPullRequest },
  { id: 'history', label: 'History', icon: History },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'synced', label: 'Synced', icon: RefreshCw },
  { id: 'smart', label: 'Smart', icon: Blocks },
  { id: 'mentions', label: 'Mentions', icon: Network },
  { id: 'templates', label: 'Templates', icon: Layers },
  { id: 'visibility', label: 'Client', icon: Eye },
  { id: 'indexing', label: 'Index', icon: FileStack },
  { id: 'subpages', label: 'Sub-pages', icon: ListTree },
]

type DocumentEditorRightPanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  activePanel: EditorSidePanel
  onPanelChange: (panel: EditorSidePanel) => void
  workspaceId: string
  projectId: string
  documentId: string
  editorValue: Value
  onInsertSynced: (syncedBlockId: string, title: string) => void
  onInsertMention: (resourceType: string, resourceId: string, label: string) => void
  onRefetchEditor: () => void
}

export function DocumentEditorRightPanel({
  open,
  onOpenChange,
  activePanel,
  onPanelChange,
  workspaceId,
  projectId,
  documentId,
  editorValue,
  onInsertSynced,
  onInsertMention,
  onRefetchEditor,
}: DocumentEditorRightPanelProps) {
  const activeMeta = PANEL_META.find((p) => p.id === activePanel) ?? PANEL_META[0]

  return (
    <div className="flex h-full min-h-0 shrink-0 self-stretch">
      <div
        className="hidden h-full w-11 shrink-0 flex-col items-center gap-0.5 overflow-y-auto border-l border-neutral-200 bg-white py-2 lg:flex"
        role="tablist"
        aria-label="Inspector panels"
      >
        {PANEL_META.map((tab) => {
          const Icon = tab.icon
          const selected = open && activePanel === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              title={tab.label}
              aria-label={tab.label}
              aria-selected={selected}
              onClick={() => {
                if (open && activePanel === tab.id) {
                  onOpenChange(false)
                } else {
                  onPanelChange(tab.id)
                  onOpenChange(true)
                }
              }}
              className={cn(
                'inline-flex h-9 w-9 shrink-0 items-center justify-center transition-colors',
                selected
                  ? 'bg-secondary/10 text-secondary'
                  : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800'
              )}
            >
              <Icon size={16} />
            </button>
          )
        })}
        <div className="my-1 h-px w-6 shrink-0 bg-neutral-200" />
        <button
          type="button"
          title={open ? 'Close inspector' : 'Open inspector'}
          aria-label={open ? 'Close inspector' : 'Open inspector'}
          onClick={() => onOpenChange(!open)}
          className="mt-auto inline-flex h-9 w-9 shrink-0 items-center justify-center text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800"
        >
          {open ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
        </button>
      </div>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close inspector backdrop"
            className="fixed inset-0 z-30 bg-neutral-900/20 lg:hidden"
            onClick={() => onOpenChange(false)}
          />
          <aside
            className={cn(
              'flex h-full min-h-0 w-[min(100vw,20rem)] min-w-0 flex-col overflow-hidden border-l border-neutral-200 bg-white',
              'fixed inset-y-0 right-0 z-40 shadow-lg lg:static lg:z-auto lg:w-80 lg:max-w-none lg:shadow-none'
            )}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2">
              <Typography as="h2" size="sm" weight="semibold" className="min-w-0 truncate">
                {activeMeta.label}
              </Typography>
              <div className="flex shrink-0 items-center gap-1">
                <label className="sr-only" htmlFor="editor-inspector-panel">
                  Inspector panel
                </label>
                <select
                  id="editor-inspector-panel"
                  value={activePanel}
                  onChange={(e) => onPanelChange(e.target.value as EditorSidePanel)}
                  className="h-8 max-w-[8.5rem] border border-neutral-200 bg-white px-1.5 text-xs text-neutral-700"
                >
                  {PANEL_META.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="ghost"
                  className="lg:hidden"
                  aria-label="Close inspector"
                  onClick={() => onOpenChange(false)}
                  icon={<PanelRightClose size={16} />}
                />
              </div>
            </div>

            <div
              role="tabpanel"
              id={`editor-panel-${activePanel}`}
              className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto"
            >
              {activePanel === 'attachments' ? (
                <DocumentAttachmentsPanel projectId={projectId} documentId={documentId} />
              ) : null}
              {activePanel === 'comments' ? (
                <DocumentCommentsPanel projectId={projectId} documentId={documentId} />
              ) : null}
              {activePanel === 'suggestions' ? (
                <DocumentSuggestionsPanel
                  projectId={projectId}
                  documentId={documentId}
                  onAccepted={onRefetchEditor}
                />
              ) : null}
              {activePanel === 'history' ? (
                <DocumentHistoryPanel
                  projectId={projectId}
                  documentId={documentId}
                  onRestored={onRefetchEditor}
                />
              ) : null}
              {activePanel === 'subpages' ? <DocumentSubpagesPanel /> : null}
              {activePanel === 'synced' ? (
                <SyncedBlocksPanel
                  workspaceId={workspaceId}
                  projectId={projectId}
                  currentEditorValue={editorValue}
                  onInsertReference={onInsertSynced}
                />
              ) : null}
              {activePanel === 'templates' ? (
                <NativeTemplatePublishPanel
                  workspaceId={workspaceId}
                  projectId={projectId}
                  documentId={documentId}
                  editorValue={editorValue}
                  onInstantiated={onRefetchEditor}
                />
              ) : null}
              {activePanel === 'smart' ? <SmartBlocksPanel /> : null}
              {activePanel === 'mentions' ? (
                <ResourceMentionsPanel onInsertMention={onInsertMention} />
              ) : null}
              {activePanel === 'visibility' ? (
                <ClientVisibilityPanel projectId={projectId} documentId={documentId} />
              ) : null}
              {activePanel === 'ai' ? (
                <AiContextPanel projectId={projectId} documentId={documentId} />
              ) : null}
              {activePanel === 'indexing' ? (
                <DocumentIndexingPanel workspaceId={workspaceId} projectId={projectId} documentId={documentId} />
              ) : null}
            </div>
          </aside>
        </>
      ) : null}
    </div>
  )
}
