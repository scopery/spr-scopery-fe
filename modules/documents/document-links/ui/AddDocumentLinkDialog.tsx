'use client'

import { useAddDocumentLinkDialog } from '../hooks/useAddDocumentLinkDialog'
import type { AddDocumentLinkDialogProps } from '../model/document-links'
import { AddDocumentLinkDialogView } from './AddDocumentLinkDialogView'

export function AddDocumentLinkDialog(props: AddDocumentLinkDialogProps) {
  const dialog = useAddDocumentLinkDialog(props)

  return (
    <AddDocumentLinkDialogView
      open={props.open}
      loading={dialog.loading}
      loadingTargets={dialog.loadingTargets}
      entityType={dialog.entityType}
      relationType={dialog.relationType}
      sessionId={dialog.sessionId}
      targetId={dialog.targetId}
      sessionOptions={dialog.sessionOptions}
      targetOptions={dialog.targetOptions}
      onClose={props.onClose}
      onSubmit={() => void dialog.handleSubmit()}
      onEntityTypeChange={dialog.handleEntityTypeChange}
      onRelationTypeChange={dialog.setRelationType}
      onSessionIdChange={dialog.setSessionId}
      onTargetIdChange={dialog.setTargetId}
    />
  )
}
