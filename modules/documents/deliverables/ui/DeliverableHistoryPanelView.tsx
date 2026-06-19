'use client'

import Link from 'next/link'
import { Download, ExternalLink } from 'lucide-react'
import { Typography, Button, ContentLoader, Select } from '@/shared/ui'
import { DeliverableReadinessBadge } from './DeliverableReadinessBadge'
import { DocumentTypeBadge } from '@/modules/documents/document/ui/DocumentTypeBadge'
import { WorkflowStatusBadge } from '@/modules/documents/document/ui/WorkflowStatusBadge'
import { DELIVERABLE_TYPE_LABELS } from '@/modules/documents/deliverables'
import { ROUTES } from '@/constants/routes'
import type { DeliverableHistoryPanelViewProps } from '../model/deliverable-document-set-picker'

export function DeliverableHistoryPanelView({
  items,
  total,
  loading,
  loadingMore,
  exportingId,
  documentType,
  documentTypeOptions,
  workflowStatus,
  workflowStatusOptions,
  readinessStatus,
  readinessOptions,
  includeArchived,
  canExport,
  orgId,
  projectId,
  onDocumentTypeChange,
  onWorkflowStatusChange,
  onReadinessStatusChange,
  onIncludeArchivedChange,
  onLoadMore,
  onExport,
}: DeliverableHistoryPanelViewProps) {
  if (loading && items.length === 0) {
    return <ContentLoader />
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <Select
          label="Document type"
          value={documentType}
          onValueChange={(v: string) => onDocumentTypeChange(v)}
          options={documentTypeOptions}
        />
        <Select
          label="Workflow status"
          value={workflowStatus}
          onValueChange={(v: string) => onWorkflowStatusChange(v)}
          options={workflowStatusOptions}
        />
        <Select
          label="Readiness"
          value={readinessStatus}
          onValueChange={(v: string) => onReadinessStatusChange(v)}
          options={readinessOptions}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeArchived}
          onChange={(e) => onIncludeArchivedChange(e.target.checked)}
        />
        Include archived
      </label>

      <Typography variant="small" tone="muted">
        Showing {items.length} of {total} generated deliverables
      </Typography>

      {items.length === 0 ? (
        <Typography variant="small" tone="muted">
          No generated deliverables match your filters.
        </Typography>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.document_id}
              className="flex flex-wrap items-start justify-between gap-3 border border-neutral-200 bg-white p-4"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Typography variant="small" className="font-medium">
                    {item.title}
                  </Typography>
                  <DeliverableReadinessBadge
                    status={item.readiness_status}
                    warningCount={item.warning_count}
                  />
                  {item.readiness_stale ? (
                    <Typography variant="small" tone="muted">
                      (may be outdated)
                    </Typography>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <DocumentTypeBadge type={item.document_type} />
                  <WorkflowStatusBadge status={item.workflow_status} />
                  {item.deliverable_type ? (
                    <Typography variant="small" tone="muted">
                      {DELIVERABLE_TYPE_LABELS[item.deliverable_type]}
                    </Typography>
                  ) : null}
                </div>
                <Typography variant="small" tone="muted">
                  {item.template_name ?? item.template_key ?? 'Template generated'}
                  {item.created_by_display_name ? ` · ${item.created_by_display_name}` : ''}
                  {' · '}
                  {new Date(item.created_at).toLocaleDateString()}
                  {item.readiness_source === 'recomputed' ? ' · readiness refreshed on load' : ''}
                </Typography>
              </div>
              <div className="flex gap-2">
                <Link href={ROUTES.org.document(orgId, item.document_id, projectId)}>
                  <Button variant="outline" size="sm" icon={<ExternalLink size={14} />}>
                    Open
                  </Button>
                </Link>
                {canExport ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Download size={14} />}
                    loading={exportingId === item.document_id}
                    onClick={() => onExport(item.document_id)}
                  >
                    Export
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length < total ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          loading={loadingMore}
          onClick={onLoadMore}
        >
          Load more
        </Button>
      ) : null}
    </div>
  )
}
