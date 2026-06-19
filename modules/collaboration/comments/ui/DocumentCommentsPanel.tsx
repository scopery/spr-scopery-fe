'use client'

import { useState } from 'react'
import { Button, Textarea, Typography, ContentLoader } from '@/shared/ui'
import type { CollaborationPermissions } from '@/modules/collaboration/core/model/collaboration'
import { useDocumentComments } from '@/modules/collaboration/core/hooks'
import { DocumentCommentThread } from './DocumentCommentThread'
import { MentionUserPicker } from './MentionUserPicker'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'

interface DocumentCommentsPanelProps {
  orgId: string
  documentId: string
  projectId?: string
  permissions: CollaborationPermissions
}

export function DocumentCommentsPanel({
  orgId,
  documentId,
  projectId,
  permissions,
}: DocumentCommentsPanelProps) {
  const [body, setBody] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showResolved, setShowResolved] = useState(false)

  const { comments, loading, createComment, resolveComment, reopenComment } = useDocumentComments({
    orgId,
    documentId,
    projectId,
    canViewComments: permissions.canViewComments,
    includeResolved: showResolved,
  })

  const handleCreate = async () => {
    if (!body.trim()) return
    setSubmitting(true)
    try {
      await createComment(body.trim(), mentions)
      setBody('')
      setMentions([])
    } catch (err) {
      const msg = err instanceof ApiError ? err.problem.detail : 'Failed to post comment'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (parentId: string, replyBody: string, mentionedUserIds: string[]) => {
    await createComment(replyBody, mentionedUserIds, parentId)
  }

  if (!permissions.canViewComments) {
    return <Typography tone="muted">You do not have access to comments.</Typography>
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <ContentLoader variant="easeOut" className="w-16" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Typography weight="semibold">Comments ({comments.length})</Typography>
        <Button variant="ghost" size="sm" onClick={() => setShowResolved((v) => !v)}>
          {showResolved ? 'Hide resolved' : 'Show resolved'}
        </Button>
      </div>

      {permissions.canCreateComment && (
        <div className="space-y-2 border border-neutral-200 p-3">
          <Textarea
            label="Add comment"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            fullWidth
          />
          <MentionUserPicker
            orgId={orgId}
            projectId={projectId}
            value={mentions}
            onChange={setMentions}
          />
          <Button
            variant="primary"
            size="sm"
            loading={submitting}
            onClick={() => void handleCreate()}
          >
            Post comment
          </Button>
        </div>
      )}

      {comments.length === 0 ? (
        <Typography tone="muted">No comments yet.</Typography>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <DocumentCommentThread
              key={comment.id}
              comment={comment}
              canResolve={permissions.canResolveComment}
              canReply={permissions.canCreateComment}
              orgId={orgId}
              projectId={projectId}
              onReply={handleReply}
              onResolve={resolveComment}
              onReopen={reopenComment}
            />
          ))}
        </div>
      )}
    </div>
  )
}
