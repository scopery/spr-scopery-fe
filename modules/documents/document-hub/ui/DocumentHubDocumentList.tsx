'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowUpRight, FileText, Plus, RotateCcw } from 'lucide-react'
import { Badge, Button, Checkbox, PageSkeleton, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { AIGeneratedBadge, originLabel } from '@/modules/ai-document-intelligence'
import {
  DocumentTypeBadge,
  WorkflowStatusBadge,
  getDocumentFileIcon,
} from '@/modules/documents/document'
import { cn } from '@/utils/cn'
import { knowledgeApi, type DocumentIndexStatus } from '@/modules/knowledge'
import type { DocumentHubSelectionMode } from '../model/document-hub'
import type { DocumentHubItem } from '../hooks/useDocumentHub'

type DocumentHubDocumentListProps = {
  orgId: string
  items: DocumentHubItem[]
  loading: boolean
  canCreateDocument: boolean
  canExportDocuments: boolean
  canRestoreDocument: boolean
  selectionMode: DocumentHubSelectionMode
  selectedIds: Set<string>
  totalCount: number
  allVisibleSelected: boolean
  restoringId: string | null
  onCreate: () => void
  onToggleSelectAllVisible: () => void
  onToggleSelect: (documentId: string) => void
  onRestoreDocument: (doc: DocumentHubItem) => void | Promise<void>
}

function docHref(orgId: string, doc: DocumentHubItem) {
  if (!doc.project_id) return ROUTES.workspace.document(orgId, doc.id)
  return ROUTES.workspace.projectDocumentEdit(orgId, doc.project_id, doc.id)
}

function formatDocDate(value: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}

function DocumentIndexBadge({ projectId, documentId }: { projectId: string; documentId: string }) {
  const [status, setStatus] = useState<DocumentIndexStatus | null>(null)

  useEffect(() => {
    knowledgeApi
      .getDocumentIndexStatus(projectId, documentId)
      .then(setStatus)
      .catch(() => {
        /* non-critical */
      })
  }, [projectId, documentId])

  if (!status) return null

  return status.indexed ? (
    <Badge variant="solid" tone="warning" size="sm">
      Indexed
    </Badge>
  ) : (
    <Badge variant="soft" tone="neutral" size="sm">
      {status.totalChunks > 0
        ? `Partial ${status.embeddedChunks}/${status.totalChunks}`
        : 'Not indexed'}
    </Badge>
  )
}

function FileTypeIcon({
  documentType,
  title,
}: {
  documentType: string
  title: string
}) {
  const icon = getDocumentFileIcon(documentType)
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static illustration from /public
    <img
      src={icon.src}
      alt=""
      width={28}
      height={34}
      className={cn('h-[34px] w-7 object-contain', icon.className)}
      aria-hidden
      title={`${title} · ${icon.label}`}
    />
  )
}

export function DocumentHubDocumentList({
  orgId,
  items,
  loading,
  canCreateDocument,
  canExportDocuments,
  canRestoreDocument,
  selectionMode,
  selectedIds,
  totalCount,
  allVisibleSelected,
  restoringId,
  onCreate,
  onToggleSelectAllVisible,
  onToggleSelect,
  onRestoreDocument,
}: DocumentHubDocumentListProps) {
  if (loading) {
    return <PageSkeleton variant="list" />
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-neutral-300 bg-white p-12 text-center">
        <FileText className="mx-auto mb-3 text-neutral-400" size={32} />
        <Typography weight="medium">No documents found</Typography>
        <Typography variant="small" tone="muted" className="mt-1">
          Try another project filter, switch lifecycle to Archived, or create a new document.
        </Typography>
        {canCreateDocument ? (
          <Button variant="primary" className="mt-4" onClick={onCreate} icon={<Plus size={16} />}>
            New document
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {canExportDocuments && items.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 px-1">
          <Checkbox
            checked={selectionMode === 'filtered_all' || allVisibleSelected}
            onChange={onToggleSelectAllVisible}
            aria-label="Select all visible documents"
          />
          <Typography variant="small" tone="muted">
            {selectionMode === 'filtered_all'
              ? `All ${totalCount} matching documents selected`
              : `Select all on this page (${items.length})`}
          </Typography>
        </div>
      ) : null}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
            <tr>
              {canExportDocuments ? <th className="w-10 px-3 py-2.5" scope="col" /> : null}
              <th className="w-12 px-2 py-2.5" scope="col">
                <span className="sr-only">File</span>
              </th>
              <th className="px-3 py-2.5 font-medium">Title</th>
              <th className="px-3 py-2.5 font-medium">Type</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Project</th>
              <th className="px-3 py-2.5 font-medium">Updated</th>
              <th className="w-12 px-3 py-2.5" scope="col" />
            </tr>
          </thead>
          <tbody>
            {items.map((doc) => {
              const isArchived = doc.status === 'archived'
              const isSelected = selectionMode === 'filtered_all' || selectedIds.has(doc.id)
              const href = docHref(orgId, doc)
              return (
                <tr
                  key={doc.id}
                  className={cn(
                    'border-b border-neutral-100 last:border-0',
                    isArchived ? 'bg-neutral-50' : 'hover:bg-neutral-50'
                  )}
                >
                  {canExportDocuments ? (
                    <td className="px-3 py-2.5">
                      <Checkbox
                        checked={isSelected}
                        onChange={() => onToggleSelect(doc.id)}
                        aria-label={`Select ${doc.title}`}
                      />
                    </td>
                  ) : null}
                  <td className="px-2 py-2">
                    <FileTypeIcon documentType={doc.document_type} title={doc.title} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="space-y-1.5">
                      {isArchived ? (
                        <Typography weight="medium">{doc.title}</Typography>
                      ) : (
                        <Link href={href} className="font-medium text-neutral-900 hover:underline">
                          {doc.title}
                        </Link>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <AIGeneratedBadge
                          generatedByAI={doc.generated_by_ai}
                          originType={doc.origin_type}
                        />
                        {doc.origin_type && doc.origin_type !== 'manual' ? (
                          <Badge variant="soft" tone="neutral" size="sm">
                            {originLabel(doc.origin_type)}
                          </Badge>
                        ) : null}
                        {(doc.link_count ?? 0) > 0 ? (
                          <Badge variant="soft" tone="info" size="sm">
                            {doc.link_count} link{(doc.link_count ?? 0) === 1 ? '' : 's'}
                          </Badge>
                        ) : null}
                        {doc.project_id ? (
                          <DocumentIndexBadge projectId={doc.project_id} documentId={doc.id} />
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <DocumentTypeBadge type={doc.document_type} />
                  </td>
                  <td className="px-3 py-2.5">
                    {doc.workflow_status ? (
                      <WorkflowStatusBadge status={doc.workflow_status} />
                    ) : isArchived ? (
                      <Badge variant="soft" tone="warning" size="sm">
                        Archived
                      </Badge>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-neutral-600">{doc.project_name ?? '—'}</td>
                  <td className="px-3 py-2.5 text-neutral-600">{formatDocDate(doc.updated_at)}</td>
                  <td className="px-3 py-2.5">
                    {isArchived && canRestoreDocument && doc.project_id ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<RotateCcw size={14} />}
                        loading={restoringId === doc.id}
                        onClick={() => void onRestoreDocument(doc)}
                      />
                    ) : !isArchived ? (
                      <Link
                        href={href}
                        className="inline-flex h-8 w-8 items-center justify-center border border-neutral-200 text-neutral-700 transition-all hover:-translate-y-0.5 hover:translate-x-0.5 hover:bg-neutral-900 hover:text-white"
                        aria-label={`Open ${doc.title}`}
                      >
                        <ArrowUpRight size={14} />
                      </Link>
                    ) : null}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
