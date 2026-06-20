'use client'

import { Plus, Link2, Download, FileOutput } from 'lucide-react'
import { Button } from '@/shared/ui'
import { ProjectAIActionsMenu } from '@/modules/ai-document-intelligence'
import { buildAIPermissions } from '@/modules/permissions'

type DocumentSpacePerms = {
  canCreateDocument: boolean
  canCreateFromTemplate: boolean
  canAttachDocument: boolean
  canExportDocuments: boolean
}

type ProjectDocumentsHeaderActionsProps = {
  orgId: string
  projectId: string
  canManageDocuments: boolean
  docPerms: DocumentSpacePerms
  aiPerms: ReturnType<typeof buildAIPermissions>
  handoffExportLoading: boolean
  onExportHandoff: () => void
  onAttach: () => void
  onCreateDeliverable: () => void
  onCreateDocument: () => void
}

export function ProjectDocumentsHeaderActions({
  orgId,
  projectId,
  canManageDocuments,
  docPerms,
  aiPerms,
  handoffExportLoading,
  onExportHandoff,
  onAttach,
  onCreateDeliverable,
  onCreateDocument,
}: ProjectDocumentsHeaderActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <ProjectAIActionsMenu orgId={orgId} projectId={projectId} permissions={aiPerms} />
      {docPerms.canExportDocuments && (
        <Button
          variant="outline"
          size="sm"
          loading={handoffExportLoading}
          onClick={() => void onExportHandoff()}
          className="flex items-center gap-2"
        >
          <Download size={16} aria-hidden />
          Export handoff
        </Button>
      )}
      {canManageDocuments && docPerms.canAttachDocument && (
        <Button variant="outline" size="sm" onClick={onAttach} className="flex items-center gap-2">
          <Link2 size={16} aria-hidden />
          Attach existing
        </Button>
      )}
      {docPerms.canCreateDocument && docPerms.canCreateFromTemplate && (
        <Button
          variant="outline"
          size="sm"
          onClick={onCreateDeliverable}
          className="flex items-center gap-2"
        >
          <FileOutput size={16} aria-hidden />
          Create deliverable
        </Button>
      )}
      {docPerms.canCreateDocument && (
        <Button
          variant="primary"
          size="sm"
          onClick={onCreateDocument}
          className="flex items-center gap-2"
        >
          <Plus size={16} aria-hidden />
          New document
        </Button>
      )}
    </div>
  )
}
