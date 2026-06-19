export type CommentStatus = 'open' | 'resolved' | 'deleted'
export type SuggestionStatus = 'open' | 'accepted' | 'rejected' | 'deleted'
export type SuggestionType = 'general' | 'replace_text' | 'insert_text' | 'delete_text'
export type CollaboratorRole = 'viewer' | 'commenter' | 'editor'

export interface MentionSummary {
  user_id: string
  display_name: string | null
  email: string | null
}

export interface DocumentComment {
  id: string
  org_id: string
  document_id: string
  project_id: string | null
  section_id: string | null
  parent_id: string | null
  author_id: string
  body: string
  status: CommentStatus
  anchor: Record<string, unknown> | null
  selected_text: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  resolved_by: string | null
  author_display_name: string | null
  author_email: string | null
  resolved_by_display_name: string | null
  replies?: DocumentComment[]
  mentions?: MentionSummary[]
}

export interface DocumentSuggestion {
  id: string
  org_id: string
  document_id: string
  project_id: string | null
  author_id: string
  type: SuggestionType
  status: SuggestionStatus
  title: string | null
  description: string | null
  created_at: string
  updated_at: string
  accepted_at: string | null
  rejected_at: string | null
  author_display_name: string | null
  author_email: string | null
  mentions?: MentionSummary[]
}

export interface DocumentActivity {
  id: string
  org_id: string
  document_id: string
  actor_id: string | null
  action: string
  metadata: Record<string, unknown> | null
  created_at: string
  actor_display_name?: string | null
}

export interface DocumentCollaborator {
  id: string
  org_id: string
  document_id: string
  user_id: string
  role: CollaboratorRole
  created_at: string
  display_name?: string | null
  email?: string | null
}

export interface MentionableUser {
  user_id: string
  display_name: string | null
  email: string | null
}

export interface CollaborationPermissions {
  canViewComments: boolean
  canCreateComment: boolean
  canResolveComment: boolean
  canViewSuggestions: boolean
  canCreateSuggestion: boolean
  canAcceptSuggestion: boolean
  canRejectSuggestion: boolean
  canViewActivity: boolean
  canShare: boolean
  canManageCollaborators: boolean
}
