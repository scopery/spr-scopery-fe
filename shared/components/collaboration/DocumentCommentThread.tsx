'use client'

import { useState } from 'react'
import { Avatar, Badge, Button, Textarea, Typography } from '@/shared/ui'
import type { DocumentComment } from '@/types/collaboration'
import { MentionUserPicker } from './MentionUserPicker'

function displayName(comment: DocumentComment): string {
  return comment.author_display_name || comment.author_email || 'User'
}

interface DocumentCommentThreadProps {
  comment: DocumentComment
  canResolve: boolean
  canReply: boolean
  orgId: string
  projectId?: string
  onReply: (parentId: string, body: string, mentionedUserIds: string[]) => Promise<void>
  onResolve: (commentId: string) => Promise<void>
  onReopen: (commentId: string) => Promise<void>
}

export function DocumentCommentThread({
  comment,
  canResolve,
  canReply,
  orgId,
  projectId,
  onReply,
  onResolve,
  onReopen,
}: DocumentCommentThreadProps) {
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [mentions, setMentions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleReply = async () => {
    if (!replyBody.trim()) return
    setLoading(true)
    try {
      await onReply(comment.id, replyBody.trim(), mentions)
      setReplyBody('')
      setMentions([])
      setReplyOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="border border-neutral-200 p-3 space-y-2">
      <div className="flex items-start gap-2">
        <Avatar name={displayName(comment)} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Typography variant="small" weight="medium">
              {displayName(comment)}
            </Typography>
            <Badge
              variant="soft"
              tone={comment.status === 'resolved' ? 'neutral' : 'info'}
              size="sm"
            >
              {comment.status}
            </Badge>
            <Typography variant="small" tone="muted">
              {new Date(comment.created_at).toLocaleString()}
            </Typography>
          </div>
          {comment.selected_text && (
            <Typography variant="small" tone="muted" className="italic mt-1 block">
              On: &quot;{comment.selected_text.slice(0, 120)}&quot;
            </Typography>
          )}
          <Typography className="mt-1 whitespace-pre-wrap">{comment.body}</Typography>
          {comment.mentions && comment.mentions.length > 0 && (
            <Typography variant="small" tone="muted" className="mt-1">
              Mentioned: {comment.mentions.map((m) => m.display_name || m.email).join(', ')}
            </Typography>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {canReply && comment.status === 'open' && (
              <Button variant="ghost" size="sm" onClick={() => setReplyOpen((v) => !v)}>
                Reply
              </Button>
            )}
            {canResolve && comment.status === 'open' && (
              <Button variant="outline" size="sm" onClick={() => onResolve(comment.id)}>
                Resolve
              </Button>
            )}
            {canResolve && comment.status === 'resolved' && (
              <Button variant="outline" size="sm" onClick={() => onReopen(comment.id)}>
                Reopen
              </Button>
            )}
          </div>
        </div>
      </div>

      {comment.replies?.map((reply) => (
        <div key={reply.id} className="ml-6 border-l-2 border-neutral-200 pl-3">
          <DocumentCommentThread
            comment={reply}
            canResolve={false}
            canReply={false}
            orgId={orgId}
            projectId={projectId}
            onReply={onReply}
            onResolve={onResolve}
            onReopen={onReopen}
          />
        </div>
      ))}

      {replyOpen && (
        <div className="ml-6 space-y-2">
          <Textarea
            label="Reply"
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            rows={3}
            fullWidth
          />
          <MentionUserPicker
            orgId={orgId}
            projectId={projectId}
            value={mentions}
            onChange={setMentions}
          />
          <Button variant="primary" size="sm" loading={loading} onClick={() => void handleReply()}>
            Post reply
          </Button>
        </div>
      )}
    </div>
  )
}
