'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Value } from 'platejs'
import {
  ArrowLeft,
  Blocks,
  CheckCircle,
  ListTree,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Paperclip,
  PanelLeft,
  RefreshCw,
  Save,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, ContentLoader, Typography } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '@/modules/projects/project'
import { WORKSPACE_ROUTES } from '@/modules/org/lib/routes'
import { PlateEditorBody } from '@/modules/documents/document/ui/editor/PlateEditor'
import type { SlashCommandGroupConfig } from '@/modules/documents/document/ui/editor/slash-command-items'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as workbenchApi from '@/modules/documents/document-hub/api/document-workbench.api'
import { useNativeDocumentEditor } from '../hooks/useNativeDocumentEditor'
import { useDocumentAttachments } from '../hooks/useDocumentAttachments'
import { useMentionAccessCheck } from '../hooks/useMentionAccessCheck'
import * as attachmentApi from '../api/document-attachment.api'
import type { EditorSidePanel } from '../model/collaboration'
import { SaveConflictBanner } from './SaveConflictBanner'
import { DocumentSubpagesPanel } from './DocumentSubpagesPanel'
import { MentionAccessBanner } from './MentionAccessBanner'
import { DocumentAutosaveIndicator } from './DocumentAutosaveIndicator'
import { DocumentEditorRightPanel } from './DocumentEditorRightPanel'
import { cn } from '@/utils/cn'
import {
  createResourceMentionNode,
  createSyncedBlockNode,
} from '@/modules/documents/document/ui/editor/resource-embed-plugins'

type CanvasWidth = 'centered' | 'wide' | 'full'

const WIDTH_CLASS: Record<CanvasWidth, string> = {
  centered: 'max-w-4xl',
  wide: 'max-w-6xl',
  full: 'max-w-none',
}

function appendSyncedBlockReference(
  value: Value,
  syncedBlockId: string,
  title: string
): Value {
  return [...value, createSyncedBlockNode({ syncedBlockId, title })] as Value
}

function appendMentionReference(
  value: Value,
  resourceType: string,
  resourceId: string,
  label: string
): Value {
  return [
    ...value,
    {
      type: 'p',
      children: [createResourceMentionNode({ resourceType, resourceId, label }), { text: '' }],
    },
  ] as Value
}

const PANEL_IDS: EditorSidePanel[] = [
  'attachments',
  'comments',
  'suggestions',
  'history',
  'synced',
  'templates',
  'smart',
  'mentions',
  'visibility',
  'ai',
  'indexing',
  'subpages',
]

function parsePanel(raw: string | null): EditorSidePanel {
  if (raw && (PANEL_IDS as string[]).includes(raw)) return raw as EditorSidePanel
  return 'comments'
}

export function NativeDocumentEditorView({
  projectId: projectIdProp,
  documentId: documentIdProp,
}: {
  projectId?: string
  documentId?: string
} = {}) {
  const params = useParams<{
    workspaceId: string
    projectId: string
    documentId: string
  }>()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceId
  const projectId = projectIdProp ?? params.projectId
  const documentId = documentIdProp ?? params.documentId
  const activePanel = parsePanel(searchParams.get('panel'))

  const editor = useNativeDocumentEditor(projectId, documentId)
  const { project } = useProject(workspaceId, projectId)
  const attachments = useDocumentAttachments(projectId, documentId)
  const mentionAccess = useMentionAccessCheck(editor.plateValue)
  const [approving, setApproving] = useState(false)
  const [pageTreeOpen, setPageTreeOpen] = useState(false)
  const [canvasWidth, setCanvasWidth] = useState<CanvasWidth>('wide')
  const [inspectorOpen, setInspectorOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)
  const mediaInputRef = useRef<HTMLInputElement | null>(null)
  const backHref = WORKSPACE_ROUTES.projectDocumentWorkbench(workspaceId, projectId, documentId)
  const hubHref = WORKSPACE_ROUTES.documentHub(workspaceId)

  const setPanel = useCallback(
    (panel: EditorSidePanel) => {
      const next = new URLSearchParams(searchParams.toString())
      next.set('panel', panel)
      router.replace(`${pathname}?${next.toString()}`)
    },
    [pathname, router, searchParams]
  )

  const handleApprove = useCallback(async () => {
    setApproving(true)
    try {
      await workbenchApi.approveProjectDocument(projectId, documentId)
      toast.success('Document approved')
      await editor.refetch()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setApproving(false)
    }
  }, [projectId, documentId, editor])

  const handleMediaFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return
      try {
        for (const file of Array.from(files)) {
          await attachmentApi.uploadDocumentAttachment({
            projectId,
            documentId,
            file,
          })
        }
        toast.success('Media attached')
        await attachments.refetch()
        setPanel('attachments')
        setInspectorOpen(true)
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        if (mediaInputRef.current) mediaInputRef.current.value = ''
      }
    },
    [projectId, documentId, attachments, setPanel]
  )

  const insertSyncedReference = useCallback(
    (syncedBlockId: string, title: string) => {
      editor.onPlateChange(appendSyncedBlockReference(editor.plateValue, syncedBlockId, title))
      toast.success('Synced block reference inserted')
      setPanel('synced')
      setInspectorOpen(true)
    },
    [editor, setPanel]
  )

  const insertMention = useCallback(
    (resourceType: string, resourceId: string, label: string) => {
      editor.onPlateChange(
        appendMentionReference(editor.plateValue, resourceType, resourceId, label)
      )
      toast.success('Mention inserted')
      setPanel('mentions')
      setInspectorOpen(true)
    },
    [editor, setPanel]
  )

  const slashExtras: SlashCommandGroupConfig[] = useMemo(
    () => [
      {
        group: 'Media',
        items: [
          {
            id: 'upload-attachment',
            label: 'Upload file',
            description: 'Upload an attachment for this document',
            group: 'Media',
            value: 'upload-attachment',
            icon: Paperclip,
            keywords: ['upload', 'file', 'image', 'attachment', 'media'],
            onSelect: () => {
              mediaInputRef.current?.click()
            },
          },
        ],
      },
      {
        group: 'Reusable',
        items: [
          {
            id: 'open-synced',
            label: 'Synced block',
            description: 'Browse or create workspace synced blocks',
            group: 'Reusable',
            value: 'open-synced',
            icon: RefreshCw,
            keywords: ['synced', 'reuse', 'embed', 'shared'],
            onSelect: () => {
              setPanel('synced')
              setInspectorOpen(true)
            },
          },
          {
            id: 'open-smart',
            label: 'Smart block',
            description: 'Typed live embeds (gated)',
            group: 'Reusable',
            value: 'open-smart',
            icon: Blocks,
            keywords: ['smart', 'raid', 'summary', 'live'],
            onSelect: () => {
              setPanel('smart')
              setInspectorOpen(true)
            },
          },
        ],
      },
    ],
    [setPanel]
  )

  if (editor.loading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-sm p-lg">
        <ContentLoader />
        <Typography tone="muted">Loading editor…</Typography>
      </div>
    )
  }

  if (editor.loadError) {
    return (
      <div className="p-lg">
        <Typography tone="error">{editor.loadError}</Typography>
        <Button className="mt-md" variant="outline" onClick={() => void editor.refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  const cycleWidth = () => {
    setCanvasWidth((w) => (w === 'centered' ? 'wide' : w === 'wide' ? 'full' : 'centered'))
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white">
      {/* Top bar — W41-DOC-04 */}
      <header className="z-20 shrink-0 border-b border-neutral-200 bg-white px-4 py-2.5 lg:px-6">
        <div className="mb-2 flex items-center gap-2">
          <Link
            href={backHref}
            aria-label="Back to document"
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center text-neutral-500 hover:text-neutral-900"
          >
            <ArrowLeft size={16} />
          </Link>
          <WorkspaceHierarchyBreadcrumb
            workspaceId={workspaceId}
            project={{ id: projectId, name: project?.name ?? 'Project' }}
            current={editor.title || 'Document'}
            className="mb-0 min-w-0 flex-1"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <Typography as="h1" size="lg" weight="semibold" className="min-w-0 truncate">
              {editor.title || 'Untitled'}
            </Typography>
            {editor.documentStatus ? (
              <Badge variant="soft" tone="neutral" size="sm">
                {editor.documentStatus}
              </Badge>
            ) : null}
            <DocumentAutosaveIndicator
              status={editor.saveStatus}
              lastSavedAt={editor.lastSavedAt}
            />
            <Typography variant="caption" tone="muted" className="hidden sm:inline">
              Rev {editor.revisionNo}
            </Typography>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              title={pageTreeOpen ? 'Hide page tree' : 'Show page tree'}
              aria-pressed={pageTreeOpen}
              onClick={() => setPageTreeOpen((v) => !v)}
              icon={<ListTree size={16} />}
              className="hidden xl:inline-flex"
            />
            <Button
              size="sm"
              variant="ghost"
              title={`Canvas: ${canvasWidth}`}
              onClick={cycleWidth}
              icon={canvasWidth === 'full' ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            />
            <Button
              size="sm"
              variant="outline"
              icon={<Sparkles size={16} />}
              as={Link}
              href={WORKSPACE_ROUTES.aiAssistantAsk(workspaceId, {
                projectId,
                documentId,
                documentTitle: editor.title || 'Untitled',
              })}
            >
              AI
            </Button>
            <Button
              size="sm"
              variant="outline"
              icon={<CheckCircle size={16} />}
              disabled={approving || editor.saveStatus === 'saving'}
              onClick={() => void handleApprove()}
            >
              Review
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={<Save size={16} />}
              disabled={
                editor.nativeUnsupported ||
                editor.saveStatus === 'saving' ||
                editor.saveStatus === 'conflict'
              }
              onClick={editor.handleManualSave}
            >
              Save
            </Button>
            <div className="relative">
              <Button
                size="sm"
                variant="ghost"
                aria-label="More actions"
                aria-expanded={actionsOpen}
                onClick={() => setActionsOpen((v) => !v)}
                icon={<MoreHorizontal size={16} />}
              />
              {actionsOpen ? (
                <div className="absolute right-0 top-full z-30 mt-1 w-44 border border-neutral-200 bg-white py-1 shadow-md">
                  <Link
                    href={hubHref}
                    className="block px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    onClick={() => setActionsOpen(false)}
                  >
                    Document Hub
                  </Link>
                  <button
                    type="button"
                    className="block w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 lg:hidden"
                    onClick={() => {
                      setInspectorOpen(true)
                      setActionsOpen(false)
                    }}
                  >
                    Open inspector
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 xl:hidden"
                    onClick={() => {
                      setPageTreeOpen((v) => !v)
                      setActionsOpen(false)
                    }}
                  >
                    <PanelLeft size={14} />
                    Page tree
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      {/* Body: page tree | canvas | inspector */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {pageTreeOpen ? (
          <aside className="hidden w-56 shrink-0 self-stretch overflow-y-auto border-r border-neutral-200 bg-white p-3 xl:block">
            <DocumentSubpagesPanel />
          </aside>
        ) : null}

        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-white">
          <div className={cn('mx-auto w-full px-3 py-3 lg:px-6 lg:py-4', WIDTH_CLASS[canvasWidth])}>
            {editor.saveStatus === 'conflict' ? (
              <div className="mb-3">
                <SaveConflictBanner
                  onKeepLocal={editor.keepLocalAndRetry}
                  onLoadServer={editor.loadServerVersion}
                />
              </div>
            ) : null}

            <MentionAccessBanner
              revoked={mentionAccess.revoked}
              checking={mentionAccess.checking}
              mentionCount={mentionAccess.mentionCount}
            />

            {editor.nativeUnsupported ? (
              <div className="mb-3 border border-warning/40 bg-warning/10 px-3 py-2.5">
                <Typography weight="semibold" size="sm">
                  This document is FILE mode
                </Typography>
                <Typography variant="small" tone="muted" className="mt-1">
                  Native editor can only save NATIVE (or HYBRID) documents. Autosave is off.
                  Create a new document from Document Hub — new docs are NATIVE by default.
                </Typography>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" as={Link} href={hubHref}>
                    Back to Document Hub
                  </Button>
                  <Button size="sm" variant="outline" as={Link} href={backHref}>
                    Open workbench
                  </Button>
                </div>
              </div>
            ) : null}

            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,application/pdf,.doc,.docx,.txt"
              className="hidden"
              multiple
              aria-label="Upload media attachment"
              onChange={(e) => void handleMediaFiles(e.target.files)}
            />

            <div className="flex min-h-[calc(100dvh-12rem)] flex-col overflow-hidden border border-neutral-200 bg-white">
              <PlateEditorBody
                value={editor.plateValue}
                onChange={editor.nativeUnsupported ? undefined : editor.onPlateChange}
                readOnly={editor.nativeUnsupported}
                placeholder="Start writing — type / for blocks…"
                slashExtras={slashExtras}
              />
            </div>
          </div>
        </div>

        <DocumentEditorRightPanel
          open={inspectorOpen}
          onOpenChange={setInspectorOpen}
          activePanel={activePanel}
          onPanelChange={(panel) => {
            setPanel(panel)
            setInspectorOpen(true)
          }}
          workspaceId={workspaceId}
          projectId={projectId}
          documentId={documentId}
          editorValue={editor.plateValue}
          onInsertSynced={insertSyncedReference}
          onInsertMention={insertMention}
          onRefetchEditor={() => void editor.refetch()}
        />
      </div>
    </div>
  )
}
