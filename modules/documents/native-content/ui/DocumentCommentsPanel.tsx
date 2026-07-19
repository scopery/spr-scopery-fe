'use client'

import { useState } from 'react'
import { Button, Input, Stack, Typography } from '@/shared/ui'
import { useDocumentCommentThreads } from '../hooks/useDocumentCommentThreads'

export function DocumentCommentsPanel({
  projectId,
  documentId,
}: {
  projectId: string
  documentId: string
}) {
  const { items, loading, error, draft, setDraft, submitting, createThread, resolve, reply } =
    useDocumentCommentThreads(projectId, documentId)
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})

  return (
    <Stack direction="vertical" spacing="sm" className="w-full min-w-0 max-w-full">
      {error ? <Typography tone="error">{error}</Typography> : null}

      <div className="flex w-full min-w-0 max-w-full items-stretch gap-1.5">
        <Input
          size="sm"
          fullWidth
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="New comment…"
          aria-label="New comment"
          className="min-w-0 flex-1"
        />
        <Button
          size="sm"
          className="shrink-0 px-2.5"
          disabled={!draft.trim() || submitting}
          onClick={() => void createThread()}
        >
          Post
        </Button>
      </div>

      {loading && !items.length ? (
        <Typography variant="caption" tone="muted">
          Loading…
        </Typography>
      ) : null}
      {!loading && !items.length ? (
        <Typography variant="caption" tone="muted">
          No comments yet.
        </Typography>
      ) : null}

      <ul className="min-w-0 space-y-sm">
        {items.map((thread) => (
          <li key={thread.id} className="min-w-0 border border-neutral-100 p-sm text-sm">
            <div className="mb-xs flex min-w-0 items-start justify-between gap-1.5">
              <Typography variant="caption" tone="muted" className="min-w-0 break-words">
                {thread.status}
                {thread.anchorText ? ` · “${thread.anchorText}”` : ''}
              </Typography>
              {thread.status === 'OPEN' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="shrink-0"
                  onClick={() => void resolve(thread.id)}
                >
                  Resolve
                </Button>
              ) : null}
            </div>
            <ul className="mb-xs space-y-xs break-words">
              {(thread.comments ?? []).map((c) => (
                <li key={c.id} className="text-neutral-800">
                  {c.deleted ? (
                    <Typography variant="caption" tone="muted">
                      [deleted]
                    </Typography>
                  ) : (
                    c.body
                  )}
                </li>
              ))}
            </ul>
            {thread.status === 'OPEN' ? (
              <div className="flex w-full min-w-0 max-w-full items-stretch gap-1.5">
                <Input
                  size="sm"
                  fullWidth
                  value={replyDrafts[thread.id] ?? ''}
                  onChange={(e) =>
                    setReplyDrafts((prev) => ({ ...prev, [thread.id]: e.target.value }))
                  }
                  placeholder="Reply…"
                  aria-label={`Reply to thread ${thread.id}`}
                  className="min-w-0 flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 px-2.5"
                  onClick={() => {
                    const text = replyDrafts[thread.id] ?? ''
                    void reply(thread.id, text).then(() =>
                      setReplyDrafts((prev) => ({ ...prev, [thread.id]: '' }))
                    )
                  }}
                >
                  Reply
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </Stack>
  )
}
