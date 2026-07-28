import type { CommentTargetType, ThreadStatus } from '../enums/comment.enum'

export interface CommentThread {
  id: string
  targetType: CommentTargetType | string
  targetId: string
  title: string | null
  status: ThreadStatus | string
  internalOnly?: boolean
  clientVisible?: boolean
  resolvedAt: string | null
}

/** FE helper: body becomes the first comment after the thread is created. */
export interface CreateThreadPayload {
  targetType: CommentTargetType | string
  targetId: string
  body: string
  title?: string | null
  clientVisible?: boolean
  mentionUserIds?: string[]
}
