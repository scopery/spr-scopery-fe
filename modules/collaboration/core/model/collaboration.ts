import type { CollaborationPermissions } from './collaboration-types'

export type {
  CommentStatus,
  SuggestionStatus,
  SuggestionType,
  CollaboratorRole,
  MentionSummary,
  DocumentComment,
  DocumentSuggestion,
  DocumentActivity,
  DocumentCollaborator,
  MentionableUser,
  CollaborationPermissions,
} from './collaboration-types'

export interface DocumentCollaborationPanelProps {
  orgId: string
  documentId: string
  projectId?: string
  permissions: CollaborationPermissions
}

export interface ShareDocumentDialogProps {
  open: boolean
  onClose: () => void
  orgId: string
  documentId: string
  projectId?: string
  canManageCollaborators: boolean
}

export interface MentionUserPickerProps {
  orgId: string
  projectId?: string
  value: string[]
  onChange: (userIds: string[]) => void
  disabled?: boolean
}
