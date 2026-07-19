export interface Comment {
  id: string
  threadId: string
  authorId: string
  body: string
  mentionedUserIds: string[]
  deleted: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateCommentPayload {
  body: string
  mentionedUserIds?: string[]
}

export interface UpdateCommentPayload {
  body: string
}
