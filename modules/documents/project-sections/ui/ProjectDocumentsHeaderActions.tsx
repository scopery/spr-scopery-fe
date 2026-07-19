'use client'

import { Download, FileOutput, Link2, Plus } from 'lucide-react'
import { Button } from '@/shared/ui'
import { ProjectAIActionsMenu } from '@/modules/ai-document-intelligence'
import { buildAIPermissions } from '@/modules/permissions/access/lib/permissions'

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
          loading={handoffExportLoading}
          onClick={() => void onExportHandoff()}
          icon={<Download size={16} />}
        >
          Export handoff
        </Button>
      )}
      {canManageDocuments && docPerms.canAttachDocument && (
        <Button variant="outline" onClick={onAttach} icon={<Link2 size={16} />}>
          Attach existing
        </Button>
      )}
      {docPerms.canCreateDocument && docPerms.canCreateFromTemplate && (
        <Button variant="outline" onClick={onCreateDeliverable} icon={<FileOutput size={16} />}>
          Create deliverable
        </Button>
      )}
      {docPerms.canCreateDocument && (
        <Button variant="primary" onClick={onCreateDocument} icon={<Plus size={16} />}>
          New document
        </Button>
      )}
    </div>
  )
}
