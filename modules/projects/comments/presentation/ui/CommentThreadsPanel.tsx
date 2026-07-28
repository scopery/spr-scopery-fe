'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, ChevronDown, ChevronRight, MessageSquarePlus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Stack, Textarea, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { cn } from '@/utils/cn'
import { useEntityComments } from '../hooks/useEntityComments'
import { CommentBubble } from './CommentBubble'
import { isCommentDeleted } from '../../domain/model/comment'
import { ThreadStatus } from '../../domain/enums/comment.enum'
import type { CommentTargetType } from '../../domain/enums/comment.enum'

interface Props {
  projectId: string
  targetType: CommentTargetType | string
  targetId: string
}

export function CommentThreadsPanel({ projectId, targetType, targetId }: Props) {
  const {
    threads,
    commentsByThread,
    loading,
    error,
    postThread,
    postComment,
    resolveThread,
    removeComment,
  } = useEntityComments(projectId, targetType, targetId)

  const [expandedThreadIds, setExpandedThreadIds] = useState<Set<string>>(new Set())
  const [newThreadBody, setNewThreadBody] = useState('')
  const [replyBody, setReplyBody] = useState<Record<string, string>>({})
  const [posting, setPosting] = useState(false)

  // Auto-expand all threads so comments are visible without an extra click
  useEffect(() => {
    if (threads.length === 0) return
    setExpandedThreadIds(new Set(threads.map((t) => t.id)))
  }, [threads])

  const toggleThread = (threadId: string) => {
    setExpandedThreadIds((prev) => {
      const next = new Set(prev)
      if (next.has(threadId)) next.delete(threadId)
      else next.add(threadId)
      return next
    })
  }

  const handlePostThread = async () => {
    if (!newThreadBody.trim()) return
    setPosting(true)
    try {
      await postThread({ targetType, targetId, body: newThreadBody.trim() })
      setNewThreadBody('')
      toast.success('Comment posted')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setPosting(false)
    }
  }

  const handleReply = async (threadId: string) => {
    const body = replyBody[threadId]?.trim()
    if (!body) return
    try {
      await postComment(threadId, body)
      setReplyBody((prev) => ({ ...prev, [threadId]: '' }))
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleResolve = async (threadId: string) => {
    try {
      await resolveThread(threadId)
      toast.success('Thread resolved')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleDeleteComment = async (threadId: string, commentId: string) => {
    try {
      await removeComment(threadId, commentId)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 border border-neutral-200 bg-neutral-50 p-3">
        <Typography variant="small" weight="medium">New comment</Typography>
        <Textarea
          value={newThreadBody}
          onChange={(e) => setNewThreadBody(e.target.value)}
          placeholder="Write a comment…"
          rows={2}
          fullWidth
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="primary"
            icon={<MessageSquarePlus size={14} />}
            disabled={posting || !newThreadBody.trim()}
            onClick={() => void handlePostThread()}
          >
            Post
          </Button>
        </div>
      </div>

      {loading && threads.length === 0 ? (
        <Typography variant="small" tone="muted">Loading…</Typography>
      ) : error ? (
        <Typography variant="small" tone="error">{error}</Typography>
      ) : threads.length === 0 ? (
        <Typography variant="small" tone="muted">No comments yet</Typography>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => {
            const expanded = expandedThreadIds.has(thread.id)
            const comments = commentsByThread[thread.id] ?? []
            const isResolved = thread.status === ThreadStatus.Resolved
            const count = comments.length

            return (
              <div
                key={thread.id}
                className={cn(
                  'border',
                  isResolved ? 'border-neutral-100 opacity-60' : 'border-neutral-200'
                )}
              >
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50"
                  onClick={() => toggleThread(thread.id)}
                >
                  {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span className="flex-1 font-medium">
                    Thread · {count} comment{count !== 1 ? 's' : ''}
                  </span>
                  {isResolved && <Badge tone="success">Resolved</Badge>}
                  {!isResolved && (
                    <Button
                      size="sm"
                      variant="ghost"
                      icon={<CheckCircle size={14} />}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation()
                        void handleResolve(thread.id)
                      }}
                    >
                      Resolve
                    </Button>
                  )}
                </button>

                {expanded && (
                  <div className="space-y-3 border-t border-neutral-100 px-3 py-3">
                    {comments.length === 0 ? (
                      <Typography variant="small" tone="muted">
                        No comments in this thread.
                      </Typography>
                    ) : (
                      comments.map((c) => (
                        <CommentBubble
                          key={c.id}
                          comment={c}
                          onDelete={
                            !isCommentDeleted(c)
                              ? (id) => void handleDeleteComment(thread.id, id)
                              : undefined
                          }
                        />
                      ))
                    )}
                    {!isResolved && (
                      <Stack direction="horizontal" spacing="sm" className="items-end pt-1">
                        <Textarea
                          value={replyBody[thread.id] ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                            setReplyBody((prev) => ({ ...prev, [thread.id]: e.target.value }))
                          }
                          placeholder="Reply…"
                          rows={1}
                          fullWidth
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={!replyBody[thread.id]?.trim()}
                          onClick={() => void handleReply(thread.id)}
                        >
                          Reply
                        </Button>
                      </Stack>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
