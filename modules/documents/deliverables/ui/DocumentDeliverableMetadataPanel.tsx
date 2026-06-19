'use client'

import { useDocumentDeliverableMetadataPanel } from '../hooks/useDocumentDeliverableMetadataPanel'
import type { DocumentDeliverableMetadataPanelProps } from '../model/deliverable-document-set-picker'
import { DocumentDeliverableMetadataPanelView } from './DocumentDeliverableMetadataPanelView'

export function DocumentDeliverableMetadataPanel({
  orgId,
  documentId,
  projectId,
  canRefresh = false,
}: DocumentDeliverableMetadataPanelProps) {
  const panel = useDocumentDeliverableMetadataPanel({
    orgId,
    documentId,
    projectId,
    canRefresh,
  })

  return (
    <DocumentDeliverableMetadataPanelView
      loading={panel.loading}
      metadata={panel.metadata}
      canRefresh={canRefresh}
      refreshing={panel.refreshing}
      showWarnings={panel.showWarnings}
      hasWarningDetails={panel.hasWarningDetails}
      onToggleWarnings={panel.toggleWarnings}
      onRefresh={() => void panel.handleRefresh()}
    />
  )
}
