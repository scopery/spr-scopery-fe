'use client'

import React from 'react'
import Link from 'next/link'
import { FileText, RotateCcw } from 'lucide-react'
import {
  Button,
  Typography,
  ContentLoader,
  Badge,
  Checkbox,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { AIGeneratedBadge, originLabel } from '@/modules/ai-document-intelligence'
import { DocumentTypeBadge, WorkflowStatusBadge } from '@/modules/documents'
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
    return (
      <div className="flex justify-center py-12">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="border border-dashed border-neutral-300 bg-white p-12 text-center">
        <FileText className="mx-auto mb-3 text-neutral-400" size={32} />
        <Typography weight="medium">No documents found</Typography>
        <Typography variant="small" tone="muted" className="mt-1">
          Try adjusting filters or create a document in a project.
        </Typography>
        {canCreateDocument && (
          <Button variant="primary" size="sm" className="mt-4" onClick={onCreate}>
            New document
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {canExportDocuments && items.length > 0 && (
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
      )}
      {items.map((doc) => {
        const isArchived = doc.status === 'archived'
        const isSelected = selectionMode === 'filtered_all' || selectedIds.has(doc.id)
        const cardContent = (
          <>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {canExportDocuments && (
                <Checkbox
                  checked={isSelected}
                  onChange={() => onToggleSelect(doc.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select ${doc.title}`}
                />
              )}
              <Typography as="span" weight="semibold">
                {doc.title}
              </Typography>
              <DocumentTypeBadge type={doc.document_type} />
              {doc.workflow_status && <WorkflowStatusBadge status={doc.workflow_status} />}
              {isArchived && (
                <Badge variant="soft" tone="warning" size="sm">
                  Archived
                </Badge>
              )}
              <AIGeneratedBadge generatedByAI={doc.generated_by_ai} originType={doc.origin_type} />
              {doc.origin_type !== 'manual' && (
                <Badge variant="soft" tone="neutral" size="sm">
                  {originLabel(doc.origin_type)}
                </Badge>
              )}
              {(doc.link_count ?? 0) > 0 && (
                <Badge variant="soft" tone="info" size="sm">
                  {doc.link_count} link{(doc.link_count ?? 0) === 1 ? '' : 's'}
                </Badge>
              )}
            </div>
            <div className="mb-2 flex flex-wrap gap-3 text-sm text-neutral-500">
              {doc.project_name && <span>{doc.project_name}</span>}
              {doc.section_name && <span>· {doc.section_name}</span>}
              {doc.creator_display_name && <span>· {doc.creator_display_name}</span>}
              <span>· {new Date(doc.updated_at).toLocaleDateString()}</span>
            </div>
            <Typography variant="small" tone="muted" className="line-clamp-2">
              {doc.snippet}
            </Typography>
            {canRestoreDocument && isArchived && doc.project_id && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<RotateCcw size={14} />}
                  loading={restoringId === doc.id}
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    void onRestoreDocument(doc)
                  }}
                >
                  Restore document
                </Button>
              </div>
            )}
          </>
        )

        if (isArchived) {
          return (
            <div key={doc.id} className="block border border-neutral-200 bg-neutral-50 p-4">
              {cardContent}
            </div>
          )
        }

        return (
          <Link
            key={doc.id}
            href={ROUTES.org.document(orgId, doc.id, doc.project_id ?? undefined)}
            className="block border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300"
          >
            {cardContent}
          </Link>
        )
      })}
    </div>
  )
}
