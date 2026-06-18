'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { Typography, Button, Badge, ContentLoader } from '@/shared/ui'
import { DocumentTypeBadge } from './DocumentTypeBadge'
import { WorkflowStatusBadge } from './WorkflowStatusBadge'
import { DeliverableReadinessBadge } from './DeliverableReadinessBadge'
import { DeliverableReadinessWarnings } from './DeliverableReadinessWarnings'
import * as deliverablesService from '@/services/document-deliverables.service'
import {
  DELIVERABLE_TYPE_LABELS,
  type DocumentDeliverableMetadata,
} from '@/types/document-deliverable'
import { ApiError } from '@/types/api'
import { toast } from 'sonner'

interface DocumentDeliverableMetadataPanelProps {
  orgId: string
  documentId: string
  projectId?: string
  canRefresh?: boolean
}

export function DocumentDeliverableMetadataPanel({
  orgId,
  documentId,
  projectId,
  canRefresh = false,
}: DocumentDeliverableMetadataPanelProps) {
  const [metadata, setMetadata] = useState<DocumentDeliverableMetadata | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showWarnings, setShowWarnings] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await deliverablesService.getDocumentDeliverableMetadata(
        orgId,
        documentId,
        projectId
      )
      setMetadata(data)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to load deliverable metadata')
    } finally {
      setLoading(false)
    }
  }, [orgId, documentId, projectId])

  useEffect(() => {
    void load()
  }, [load])

  const handleRefresh = async () => {
    if (!canRefresh) return
    setRefreshing(true)
    try {
      const result = await deliverablesService.refreshDocumentDeliverableReadiness(
        orgId,
        documentId,
        projectId
      )
      setMetadata((prev) =>
        prev
          ? {
              ...prev,
              readiness: result.readiness,
            }
          : prev
      )
      setShowWarnings(true)
      toast.success('Readiness refreshed')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to refresh readiness')
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-md border border-neutral-200 bg-white p-4">
        <ContentLoader />
      </div>
    )
  }

  if (!metadata?.is_generated_deliverable) {
    return null
  }

  const { readiness } = metadata
  const hasWarningDetails =
    readiness.warnings.length > 0 || readiness.blocking_issues.length > 0

  return (
    <div className="rounded-md border border-neutral-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Typography variant="small" className="font-medium">
          Generated deliverable
        </Typography>
        <Badge variant="soft" tone="neutral" size="sm">
          Template generated
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        <DocumentTypeBadge type={metadata.document_type} />
        <WorkflowStatusBadge status={metadata.workflow_status} />
        <DeliverableReadinessBadge
          status={readiness.readiness_status}
          warningCount={readiness.warning_count}
        />
      </div>

      {metadata.deliverable_type ? (
        <Typography variant="small" tone="muted">
          {DELIVERABLE_TYPE_LABELS[metadata.deliverable_type]}
        </Typography>
      ) : null}

      <dl className="space-y-1 text-sm">
        {metadata.template_name ?? metadata.template_key ? (
          <div>
            <dt className="text-muted-foreground inline">Template: </dt>
            <dd className="inline">{metadata.template_name ?? metadata.template_key}</dd>
          </div>
        ) : null}
        {metadata.source_entity.source_entity_type ? (
          <div>
            <dt className="text-muted-foreground inline">Source: </dt>
            <dd className="inline">
              {metadata.source_entity.source_entity_accessible &&
              metadata.source_entity.source_entity_path ? (
                <Link
                  href={metadata.source_entity.source_entity_path}
                  className="text-primary hover:underline"
                >
                  {metadata.source_entity.source_entity_label ??
                    metadata.source_entity.source_entity_type}
                </Link>
              ) : metadata.source_entity.source_entity_accessible &&
                metadata.source_entity.source_entity_label ? (
                metadata.source_entity.source_entity_label
              ) : (
                metadata.source_entity.source_entity_type
              )}
            </dd>
          </div>
        ) : null}
        {metadata.selected_document_count != null && metadata.selected_document_count > 0 ? (
          <div>
            <dt className="text-muted-foreground inline">Selected documents: </dt>
            <dd className="inline">{metadata.selected_document_count}</dd>
          </div>
        ) : null}
        <div>
          <dt className="text-muted-foreground inline">Generated by AI: </dt>
          <dd className="inline">{metadata.generated_by_ai ? 'Yes' : 'No'}</dd>
        </div>
        {readiness.computed_at ? (
          <div>
            <dt className="text-muted-foreground inline">Readiness computed: </dt>
            <dd className="inline">{new Date(readiness.computed_at).toLocaleString()}</dd>
          </div>
        ) : null}
      </dl>

      {readiness.stale ? (
        <Typography variant="small" tone="muted">
          Readiness may be outdated.
        </Typography>
      ) : null}

      {!readiness.computed_at && !readiness.stale ? (
        <Typography variant="small" tone="muted">
          Readiness not available. Refresh to compute.
        </Typography>
      ) : null}

      {readiness.blocking_issue_count > 0 ? (
        <Typography variant="small" tone="error">
          {readiness.blocking_issue_count} blocking issue
          {readiness.blocking_issue_count === 1 ? '' : 's'}
        </Typography>
      ) : null}

      {hasWarningDetails ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowWarnings((v) => !v)}
        >
          {showWarnings ? 'Hide' : 'Show'} readiness details
        </Button>
      ) : null}

      {showWarnings && hasWarningDetails ? (
        <DeliverableReadinessWarnings readiness={readiness} />
      ) : null}

      {canRefresh ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          icon={<RefreshCw size={14} />}
          loading={refreshing}
          onClick={() => void handleRefresh()}
        >
          Refresh readiness
        </Button>
      ) : null}
    </div>
  )
}
