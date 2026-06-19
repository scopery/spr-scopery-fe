'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, Textarea, Typography, ContentLoader } from '@/shared/ui'
import * as collaborationApi from '@/modules/collaboration/core/api/collaboration.api'
import type {
  CollaborationPermissions,
  DocumentComment,
} from '@/modules/collaboration/core/model/collaboration'
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
  const [comments, setComments] = useState<DocumentComment[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showResolved, setShowResolved] = useState(false)

  const load = useCallback(async () => {
    if (!permissions.canViewComments) return
    setLoading(true)
    try {
      const res = await collaborationApi.listComments(orgId, documentId, {
        project_id: projectId,
        include_resolved: showResolved,
      })
      setComments(res.items)
    } catch {
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [orgId, documentId, projectId, permissions.canViewComments, showResolved])

  useEffect(() => {
    void load()
  }, [load])

  const handleCreate = async () => {
    if (!body.trim()) return
    setSubmitting(true)
    try {
      await collaborationApi.createComment(orgId, documentId, {
        body: body.trim(),
        project_id: projectId,
        mentioned_user_ids: mentions,
      })
      setBody('')
      setMentions([])
      await load()
    } catch (err) {
      const msg = err instanceof ApiError ? err.problem.detail : 'Failed to post comment'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (parentId: string, replyBody: string, mentionedUserIds: string[]) => {
    await collaborationApi.createComment(orgId, documentId, {
      body: replyBody,
      project_id: projectId,
      parent_id: parentId,
      mentioned_user_ids: mentionedUserIds,
    })
    await load()
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
              onResolve={async (id) => {
                await collaborationApi.resolveComment(orgId, documentId, id, projectId)
                await load()
              }}
              onReopen={async (id) => {
                await collaborationApi.reopenComment(orgId, documentId, id, projectId)
                await load()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
