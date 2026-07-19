'use client'

import React from 'react'
import Link from 'next/link'
import { ArrowUpRight, FileText, Plus, RotateCcw } from 'lucide-react'
import { Badge, Button, Checkbox, PageSkeleton, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { AIGeneratedBadge, originLabel } from '@/modules/ai-document-intelligence'
import { DocumentTypeBadge, WorkflowStatusBadge } from '@/modules/documents/document'
import { cn } from '@/utils/cn'
import type { DocumentHubSelectionMode } from '../model/document-hub'
import type { DocumentHubItem } from '../hooks/useDocumentHub'
import type { DocumentHubViewMode } from './DocumentHubHeader'

type DocumentHubDocumentListProps = {
  orgId: string
  items: DocumentHubItem[]
  loading: boolean
  viewMode: DocumentHubViewMode
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
  const mode = (doc.content_mode ?? '').toUpperCase()
  // Native editor only for NATIVE / HYBRID — FILE uses workbench / upload flow
  if (mode === 'FILE') {
    return ROUTES.workspace.projectDocumentWorkbench(orgId, doc.project_id, doc.id)
  }
  return ROUTES.workspace.projectDocumentEdit(orgId, doc.project_id, doc.id)
}

function formatDocDate(value: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString()
}

function DocMetaLine({ doc }: { doc: DocumentHubItem }) {
  return (
    <Typography as="div" variant="small" tone="muted" className="flex flex-wrap gap-x-2 gap-y-0.5">
      {doc.project_name ? <span>{doc.project_name}</span> : null}
      {doc.section_name ? <span>· {doc.section_name}</span> : null}
      {doc.creator_display_name ? <span>· {doc.creator_display_name}</span> : null}
      <span>· {formatDocDate(doc.updated_at)}</span>
    </Typography>
  )
}

function DocBadges({ doc }: { doc: DocumentHubItem }) {
  const isArchived = doc.status === 'archived'
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <DocumentTypeBadge type={doc.document_type} />
      {doc.workflow_status ? <WorkflowStatusBadge status={doc.workflow_status} /> : null}
      {isArchived ? (
        <Badge variant="soft" tone="warning">
          Archived
        </Badge>
      ) : null}
      <AIGeneratedBadge generatedByAI={doc.generated_by_ai} originType={doc.origin_type} />
      {doc.origin_type && doc.origin_type !== 'manual' ? (
        <Badge variant="soft" tone="neutral">
          {originLabel(doc.origin_type)}
        </Badge>
      ) : null}
      {(doc.link_count ?? 0) > 0 ? (
        <Badge variant="soft" tone="info">
          {doc.link_count} link{(doc.link_count ?? 0) === 1 ? '' : 's'}
        </Badge>
      ) : null}
    </div>
  )
}

function DocumentGridCard({
  orgId,
  doc,
  canExportDocuments,
  canRestoreDocument,
  isSelected,
  restoringId,
  onToggleSelect,
  onRestoreDocument,
}: {
  orgId: string
  doc: DocumentHubItem
  canExportDocuments: boolean
  canRestoreDocument: boolean
  isSelected: boolean
  restoringId: string | null
  onToggleSelect: (documentId: string) => void
  onRestoreDocument: (doc: DocumentHubItem) => void | Promise<void>
}) {
  const isArchived = doc.status === 'archived'
  const href = docHref(orgId, doc)

  const body = (
    <>
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2 p-4 pb-12">
        <div className="flex items-start gap-2">
          {canExportDocuments ? (
            <Checkbox
              checked={isSelected}
              onChange={() => onToggleSelect(doc.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Select ${doc.title}`}
              className="mt-0.5"
            />
          ) : null}
          <div className="min-w-0 flex-1 space-y-2">
            <Typography
              as="h3"
              weight="semibold"
              className="line-clamp-2 text-base transition-colors group-hover:text-white"
            >
              {doc.title}
            </Typography>
            <div className="transition-opacity group-hover:opacity-90">
              <DocBadges doc={doc} />
            </div>
            <div className="transition-colors group-hover:[&_span]:text-white/80">
              <DocMetaLine doc={doc} />
            </div>
            {doc.snippet ? (
              <Typography
                variant="small"
                tone="muted"
                className="line-clamp-2 transition-colors group-hover:text-white/75"
              >
                {doc.snippet}
              </Typography>
            ) : null}
          </div>
        </div>

        {canRestoreDocument && isArchived && doc.project_id ? (
          <Button
            size="sm"
            variant="outline"
            icon={<RotateCcw size={14} />}
            loading={restoringId === doc.id}
            className="relative z-[2] w-fit"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault()
              e.stopPropagation()
              void onRestoreDocument(doc)
            }}
          >
            Restore
          </Button>
        ) : null}
      </div>

      <span
        aria-hidden
        className={cn(
          'absolute bottom-3 right-3 z-[2] inline-flex h-9 w-9 items-center justify-center',
          'border border-neutral-200 bg-transparent text-neutral-800',
          'transition-all duration-300 ease-out',
          'group-hover:border-white group-hover:bg-white group-hover:text-neutral-900',
          'group-hover:translate-x-0.5 group-hover:-translate-y-0.5'
        )}
      >
        <ArrowUpRight
          size={16}
          className="transition-transform duration-300 ease-out group-hover:translate-x-px group-hover:-translate-y-px group-hover:scale-110"
        />
      </span>
    </>
  )

  const shellClass = cn(
    'group relative flex min-h-[180px] flex-col overflow-hidden border border-neutral-200 bg-white',
    'transition-[border-color,box-shadow] duration-300',
    'hover:border-transparent hover:shadow-md',
    isArchived && 'bg-neutral-50'
  )

  const hoverBg = (
    <div
      className="pointer-events-none absolute inset-0 bg-[url('/illustrations/card_bg.svg')] bg-cover bg-right-bottom opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      aria-hidden
    />
  )

  if (isArchived) {
    return (
      <div className={shellClass}>
        {hoverBg}
        {body}
      </div>
    )
  }

  return (
    <Link href={href} className={shellClass}>
      {hoverBg}
      {body}
    </Link>
  )
}

export function DocumentHubDocumentList({
  orgId,
  items,
  loading,
  viewMode,
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

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((doc) => (
            <DocumentGridCard
              key={doc.id}
              orgId={orgId}
              doc={doc}
              canExportDocuments={canExportDocuments}
              canRestoreDocument={canRestoreDocument}
              isSelected={selectionMode === 'filtered_all' || selectedIds.has(doc.id)}
              restoringId={restoringId}
              onToggleSelect={onToggleSelect}
              onRestoreDocument={onRestoreDocument}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500">
              <tr>
                {canExportDocuments ? <th className="w-10 px-3 py-2.5" /> : null}
                <th className="px-3 py-2.5 font-medium">Title</th>
                <th className="px-3 py-2.5 font-medium">Type</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Project</th>
                <th className="px-3 py-2.5 font-medium">Updated</th>
                <th className="w-12 px-3 py-2.5" />
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
                    <td className="px-3 py-2.5">
                      {isArchived ? (
                        <Typography weight="medium">{doc.title}</Typography>
                      ) : (
                        <Link href={href} className="font-medium text-neutral-900 hover:underline">
                          {doc.title}
                        </Link>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <DocumentTypeBadge type={doc.document_type} />
                    </td>
                    <td className="px-3 py-2.5">
                      {doc.workflow_status ? (
                        <WorkflowStatusBadge status={doc.workflow_status} />
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-neutral-600">{doc.project_name ?? '—'}</td>
                    <td className="px-3 py-2.5 text-neutral-600">
                      {formatDocDate(doc.updated_at)}
                    </td>
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
      )}
    </div>
  )
}
