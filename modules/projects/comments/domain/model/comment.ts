export interface Comment {
  id: string
  threadId: string
  parentCommentId?: string | null
  authorType?: string
  authorId: string
  body: string
  /** BE: ACTIVE | EDITED | DELETED_SOFT | ARCHIVED */
  status: string
  createdAt: string
}

export interface CreateCommentPayload {
  body: string
  parentCommentId?: string | null
  clientVisible?: boolean
  /** BE field name (not mentionedUserIds) */
  mentionUserIds?: string[]
}

export interface UpdateCommentPayload {
  body: string
}

export function isCommentDeleted(comment: Pick<Comment, 'status'>): boolean {
  return comment.status === 'DELETED_SOFT'
}
