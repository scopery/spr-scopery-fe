'use client'

import { Trash2 } from 'lucide-react'
import { Button, Stack, Typography } from '@/shared/ui'
import { UserIdentity } from '@/modules/platform/identity/presentation/ui/UserIdentity'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import type { Comment } from '../../domain/model/comment'

interface Props {
  comment: Comment
  onDelete?: (commentId: string) => void
}

export function CommentBubble({ comment, onDelete }: Props) {
  const { peopleById } = useResolveUsers([comment.authorId])

  if (comment.deleted) {
    return (
      <div className="py-1 text-sm italic text-neutral-400">
        [Comment deleted]
      </div>
    )
  }

  return (
    <div className="group flex items-start gap-2">
      <div className="flex-1">
        <Stack direction="horizontal" spacing="sm" className="items-center">
          <UserIdentity
            userId={comment.authorId}
            person={peopleById[comment.authorId]}
            size="xs"
            compact
          />
          <Typography variant="small" tone="muted">
            {new Date(comment.createdAt).toLocaleString()}
          </Typography>
        </Stack>
        <Typography className="mt-0.5 whitespace-pre-wrap text-sm">{comment.body}</Typography>
      </div>
      {onDelete && (
        <Button
          size="sm"
          variant="ghost"
          tone="error"
          icon={<Trash2 size={12} />}
          className="opacity-0 group-hover:opacity-100"
          onClick={() => onDelete(comment.id)}
        />
      )}
    </div>
  )
}
