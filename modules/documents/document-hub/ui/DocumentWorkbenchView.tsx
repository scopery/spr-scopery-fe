'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Button,
  GovernedObjectBadge,
  Input,
  MaskedValue,
  PageSkeleton,
  PermissionAwareAction,
  PermissionActionState,
  Skeleton,
  Stack,
  Typography,
} from '@/shared/ui'
import { WORKSPACE_ROUTES } from '@/modules/org/lib/routes'
import { DocumentVersionUploadPanel } from './DocumentVersionUploadPanel'
import {
  useDocumentFolders,
  useDocumentInspector,
  useProjectDocumentList,
} from '../hooks/useDocumentWorkbench'

/**
 * DOC-01 / DOC-02 — project-scoped Wave 4 document workbench.
 * Wave 4.1: create NATIVE docs and open native editor.
 */
export function DocumentWorkbenchView({
  projectId,
  initialDocumentId,
}: {
  projectId: string
  initialDocumentId?: string | null
}) {
  const router = useRouter()
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    folders,
    loading: foldersLoading,
    error: foldersError,
    create: createFolder,
    archive,
  } = useDocumentFolders(projectId)
  const {
    items,
    loading: docsLoading,
    error: docsError,
    query,
    setQuery,
    create: createDoc,
  } = useProjectDocumentList(projectId)
  const [selectedId, setSelectedId] = useState<string | null>(initialDocumentId ?? null)
  const [folderName, setFolderName] = useState('')
  const [docTitle, setDocTitle] = useState('')
  const [creating, setCreating] = useState(false)

  const inspector = useDocumentInspector(projectId, selectedId)

  const handleCreateNative = async () => {
    const title = docTitle.trim()
    if (!title) return
    setCreating(true)
    try {
      const created = await createDoc(title, { contentMode: 'NATIVE' })
      setDocTitle('')
      if (created?.id && workspaceId) {
        router.push(WORKSPACE_ROUTES.projectDocumentEdit(workspaceId, projectId, created.id))
      }
    } finally {
      setCreating(false)
    }
  }

  if (foldersLoading && docsLoading) return <PageSkeleton variant="split" className="p-lg" />

  return (
    <div className="grid min-h-[480px] grid-cols-1 gap-md p-lg lg:grid-cols-[220px_1fr_320px]">
      <Stack direction="vertical" spacing="sm">
        <Typography variant="h4">Folders</Typography>
        {foldersError ? <Typography tone="error">{foldersError}</Typography> : null}
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {folders.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-xs p-sm text-sm">
              <span>{f.name}</span>
              <Button size="sm" variant="ghost" onClick={() => void archive(f.id)}>
                Archive
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex gap-xs">
          <Input
            size="sm"
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            placeholder="New folder"
            aria-label="New folder name"
          />
          <Button
            size="sm"
            disabled={!folderName.trim()}
            onClick={() => {
              void createFolder(folderName.trim()).then(() => setFolderName(''))
            }}
          >
            Add
          </Button>
        </div>
      </Stack>

      <Stack direction="vertical" spacing="sm">
        <Typography variant="h4">Documents</Typography>
        {docsError ? <Typography tone="error">{docsError}</Typography> : null}
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents…"
          aria-label="Search documents"
        />
        <div className="flex flex-wrap gap-xs">
          <Input
            size="sm"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            placeholder="New native document title"
            aria-label="New document title"
          />
          <Button
            size="sm"
            disabled={!docTitle.trim() || creating}
            onClick={() => void handleCreateNative()}
          >
            Create NATIVE
          </Button>
        </div>
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                className={`flex w-full flex-col items-start p-sm text-left hover:bg-neutral-50 ${
                  selectedId === d.id ? 'bg-neutral-50' : ''
                }`}
                onClick={() => setSelectedId(d.id)}
              >
                <Typography variant="small" weight="medium">
                  {d.title}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {[d.code, d.contentMode, d.status].filter(Boolean).join(' · ')}
                </Typography>
              </button>
            </li>
          ))}
        </ul>
      </Stack>

      <Stack direction="vertical" spacing="sm" className="border border-neutral-200 p-sm">
        <Typography variant="h4">Inspector</Typography>
        {!selectedId ? (
          <Typography tone="muted">Select a document</Typography>
        ) : inspector.loading ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading document">
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="40%" height={12} />
            <Skeleton variant="rectangular" width="100%" height={80} />
          </div>
        ) : inspector.error ? (
          <Typography tone="error">{inspector.error}</Typography>
        ) : inspector.document ? (
          <>
            <Typography variant="small" weight="medium">
              {inspector.document.title}
            </Typography>
            <GovernedObjectBadge
              versionLabel={inspector.document.currentVersionId ? 'Current' : undefined}
            />
            {workspaceId ? (
              <Link
                href={WORKSPACE_ROUTES.projectDocumentEdit(workspaceId, projectId, selectedId)}
                className="text-sm text-primary underline"
              >
                Open native editor
              </Link>
            ) : null}
            <label className="flex items-center gap-sm text-sm">
              <input
                type="checkbox"
                checked={inspector.masked}
                onChange={(e) => inspector.setMasked(e.target.checked)}
              />
              Show masked
            </label>
            {inspector.masked ? <MaskedValue masked value={inspector.document.description} /> : null}
            {inspector.actionError ? (
              <Typography tone="error">{inspector.actionError}</Typography>
            ) : null}
            <PermissionAwareAction state={PermissionActionState.Allowed}>
              <Button size="sm" onClick={() => void inspector.approve()}>
                Approve
              </Button>
            </PermissionAwareAction>
            <Typography variant="caption" weight="medium">
              Shares
            </Typography>
            <ul className="text-sm">
              {inspector.shares.map((s) => (
                <li key={s.id} className="flex justify-between gap-sm py-xs">
                  <span>{s.shareType}</span>
                  <Button size="sm" variant="ghost" onClick={() => void inspector.revokeShare(s.id)}>
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
            <Button size="sm" variant="outline" onClick={() => void inspector.createShare('LINK')}>
              Create link share
            </Button>
            <DocumentVersionUploadPanel projectId={projectId} documentId={selectedId} />
          </>
        ) : null}
      </Stack>
    </div>
  )
}
