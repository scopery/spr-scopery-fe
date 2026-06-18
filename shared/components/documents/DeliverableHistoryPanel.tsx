'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Download, ExternalLink } from 'lucide-react'
import { Typography, Button, ContentLoader, Select } from '@/shared/ui'
import { DeliverableReadinessBadge } from './DeliverableReadinessBadge'
import { DocumentTypeBadge } from './DocumentTypeBadge'
import { WorkflowStatusBadge } from './WorkflowStatusBadge'
import * as deliverablesService from '@/services/document-deliverables.service'
import { downloadSingleDocumentExport } from '@/utils/exportDownload'
import {
  DELIVERABLE_TYPE_LABELS,
  type DeliverableHistoryItem,
} from '@/types/document-deliverable'
import { DOCUMENT_TYPE_OPTIONS, DOCUMENT_WORKFLOW_STATUS_OPTIONS } from '@/types/document'
import { ROUTES } from '@/constants/routes'
import { toast } from 'sonner'

const PAGE_SIZE = 20

interface DeliverableHistoryPanelProps {
  orgId: string
  projectId: string
  canExport?: boolean
}

export function DeliverableHistoryPanel({
  orgId,
  projectId,
  canExport = false,
}: DeliverableHistoryPanelProps) {
  const [items, setItems] = useState<DeliverableHistoryItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [documentType, setDocumentType] = useState('')
  const [workflowStatus, setWorkflowStatus] = useState('')
  const [readinessStatus, setReadinessStatus] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)

  const loadPage = useCallback(
    async (offset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      try {
        const res = await deliverablesService.listDeliverableHistory(orgId, projectId, {
          status: includeArchived ? 'archived' : 'active',
          document_type: documentType || undefined,
          workflow_status: workflowStatus || undefined,
          readiness_status: readinessStatus || undefined,
          limit: PAGE_SIZE,
          offset,
        })
        setTotal(res.total)
        setItems((prev) => (append ? [...prev, ...res.items] : res.items))
      } catch {
        toast.error('Failed to load deliverable history')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [orgId, projectId, documentType, workflowStatus, readinessStatus, includeArchived]
  )

  useEffect(() => {
    void loadPage(0, false)
  }, [loadPage])

  const handleExport = async (item: DeliverableHistoryItem) => {
    setExportingId(item.document_id)
    try {
      await downloadSingleDocumentExport(orgId, item.document_id, {
        format: 'markdown',
        project_id: projectId,
      })
      toast.success('Document exported')
    } catch {
      toast.error('Export failed')
    } finally {
      setExportingId(null)
    }
  }

  const readinessOptions: Array<{ value: string; label: string }> = [
    { value: '', label: 'All readiness' },
    { value: 'ready', label: 'Ready' },
    { value: 'needs_review', label: 'Needs review' },
    { value: 'blocked', label: 'Blocked' },
  ]

  if (loading && items.length === 0) {
    return <ContentLoader />
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-3">
        <Select
          label="Document type"
          value={documentType}
          onValueChange={(v: string) => setDocumentType(v)}
          options={[{ value: '', label: 'All types' }, ...DOCUMENT_TYPE_OPTIONS]}
        />
        <Select
          label="Workflow status"
          value={workflowStatus}
          onValueChange={(v: string) => setWorkflowStatus(v)}
          options={[{ value: '', label: 'All statuses' }, ...DOCUMENT_WORKFLOW_STATUS_OPTIONS]}
        />
        <Select
          label="Readiness"
          value={readinessStatus}
          onValueChange={(v: string) => setReadinessStatus(v)}
          options={readinessOptions}
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={includeArchived}
          onChange={(e) => setIncludeArchived(e.target.checked)}
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
              <div className="space-y-2 min-w-0 flex-1">
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
                    onClick={() => void handleExport(item)}
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
          onClick={() => void loadPage(items.length, true)}
        >
          Load more
        </Button>
      ) : null}
    </div>
  )
}
