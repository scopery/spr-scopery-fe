import type { CommentTargetType, ThreadStatus } from '../enums/comment.enum'

export interface CommentThread {
  id: string
  projectId: string
  targetType: CommentTargetType | string
  targetId: string
  status: ThreadStatus | string
  commentCount: number
  lastCommentAt: string | null
  createdAt: string
}

export interface CreateThreadPayload {
  targetType: CommentTargetType | string
  targetId: string
  body: string
  mentionedUserIds?: string[]
}
