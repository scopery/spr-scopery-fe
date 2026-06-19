'use client'

import { useDocumentLinksPanel } from '../hooks/useDocumentLinksPanel'
import type { DocumentLinksPanelProps } from '../model/document-links'
import { DocumentLinksPanelView } from './DocumentLinksPanelView'

export function DocumentLinksPanel(props: DocumentLinksPanelProps) {
  const panel = useDocumentLinksPanel(props)

  if (!props.canView) return null

  return (
    <DocumentLinksPanelView
      orgId={props.orgId}
      projectId={props.projectId}
      documentId={props.documentId}
      canCreate={props.canCreate}
      canDelete={props.canDelete}
      links={panel.links}
      loading={panel.loading}
      showArchived={panel.showArchived}
      addOpen={panel.addOpen}
      removeTarget={panel.removeTarget}
      restoreTarget={panel.restoreTarget}
      removing={panel.removing}
      restoring={panel.restoring}
      onToggleArchived={panel.toggleArchived}
      onAddOpenChange={panel.setAddOpen}
      onAddSuccess={panel.handleAddSuccess}
      onRemoveTargetChange={panel.setRemoveTarget}
      onRestoreTargetChange={panel.setRestoreTarget}
      onRemove={() => void panel.handleRemove()}
      onRestore={() => void panel.handleRestore()}
    />
  )
}
