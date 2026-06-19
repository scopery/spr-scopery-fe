import type { Document } from '../model/document'
import type { CollaborationPermissions } from '@/modules/collaboration'

export type {
  PlainDocumentContent,
  PlateDocumentContent,
  DocumentContent,
  SaveStatus,
} from '../ui/editor/editor.types'

export { isPlateContent, isPlainContent } from '../ui/editor/editor.types'

export interface DocumentEditorProps {
  orgId: string
  projectId?: string
  document: Document
  canEdit: boolean
  canArchive?: boolean
  canExport?: boolean
  linkPermissions?: {
    canView: boolean
    canCreate: boolean
    canDelete: boolean
  }
  collaborationPermissions?: CollaborationPermissions
  aiPermissions?: {
    canSummarizeDocument: boolean
    canFindRelatedDocuments: boolean
    canViewAIMetadata: boolean
  }
  backHref: string
  backLabel?: string
  onArchived?: () => void
}
