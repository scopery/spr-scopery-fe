'use client'

import { useDeliverableHistoryPanel } from '../hooks/useDeliverableHistoryPanel'
import type { DeliverableHistoryPanelProps } from '../model/deliverable-document-set-picker'
import { DeliverableHistoryPanelView } from './DeliverableHistoryPanelView'

export function DeliverableHistoryPanel({
  orgId,
  projectId,
  canExport = false,
}: DeliverableHistoryPanelProps) {
  const panel = useDeliverableHistoryPanel({ orgId, projectId })

  return (
    <DeliverableHistoryPanelView
      items={panel.items}
      total={panel.total}
      loading={panel.loading}
      loadingMore={panel.loadingMore}
      exportingId={panel.exportingId}
      documentType={panel.documentType}
      documentTypeOptions={panel.documentTypeOptions}
      workflowStatus={panel.workflowStatus}
      workflowStatusOptions={panel.workflowStatusOptions}
      readinessStatus={panel.readinessStatus}
      readinessOptions={panel.readinessOptions}
      includeArchived={panel.includeArchived}
      canExport={canExport}
      orgId={orgId}
      projectId={projectId}
      onDocumentTypeChange={panel.setDocumentType}
      onWorkflowStatusChange={panel.setWorkflowStatus}
      onReadinessStatusChange={panel.setReadinessStatus}
      onIncludeArchivedChange={panel.setIncludeArchived}
      onLoadMore={panel.loadMore}
      onExport={(documentId) => void panel.handleExport(documentId)}
    />
  )
}
