'use client'

import { Badge, Button, Typography } from '@/shared/ui'
import { AiMessageRole, AiMessageStatus } from '../../domain/enums/ai-assistant.enum'
import type { AiMessage } from '../../domain/model/conversation'
import type { FeedbackRating } from './MessageFeedbackDialog'

interface ChatMessageItemProps {
  message: AiMessage
  feedbackSubmitted?: boolean
  canSubmitFeedback?: boolean
  onRequestFeedback?: (messageId: string, rating: FeedbackRating) => void
  onCopy?: (content: string) => void
}

function statusTone(
  status: string | undefined
): 'default' | 'success' | 'warning' | 'error' | 'info' {
  switch (status) {
    case AiMessageStatus.Completed:
      return 'success'
    case AiMessageStatus.Failed:
    case AiMessageStatus.Blocked:
      return 'error'
    case AiMessageStatus.Cancelled:
    case AiMessageStatus.CancelRequested:
      return 'warning'
    case AiMessageStatus.Generating:
    case AiMessageStatus.Streaming:
    case AiMessageStatus.Retrieving:
    case AiMessageStatus.Contextualizing:
    case AiMessageStatus.Queued:
      return 'info'
    default:
      return 'default'
  }
}

export function ChatMessageItem({
  message,
  feedbackSubmitted = false,
  canSubmitFeedback = true,
  onRequestFeedback,
  onCopy,
}: ChatMessageItemProps) {
  const role = String(message.role)
  const isTool =
    role === AiMessageRole.ToolRequest ||
    role === AiMessageRole.ToolResult ||
    role === 'TOOL_REQUEST' ||
    role === 'TOOL_RESULT'
  const isAssistant =
    role === AiMessageRole.Assistant || role === 'ASSISTANT' || role === 'assistant'

  if (isTool) {
    return (
      <div className="border border-neutral-200 bg-neutral-50 p-sm">
        <Typography variant="caption" tone="muted">
          {role}
        </Typography>
        <Typography variant="small" className="mt-1 block whitespace-pre-wrap">
          {message.content ?? '—'}
        </Typography>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center gap-xs">
        <Typography variant="caption" tone="muted">
          {role}
        </Typography>
        {message.status ? (
          <Badge size="sm" tone={statusTone(message.status)}>
            {message.status}
          </Badge>
        ) : null}
        {feedbackSubmitted ? (
          <Badge size="sm" tone="success">
            Feedback sent
          </Badge>
        ) : null}
      </div>
      <Typography variant="small" className="whitespace-pre-wrap">
        {message.content ?? ''}
      </Typography>
      {isAssistant ? (
        <div className="mt-xs flex flex-wrap gap-xs">
          {onCopy && message.content ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopy(message.content ?? '')}
            >
              Copy
            </Button>
          ) : null}
          {onRequestFeedback && canSubmitFeedback && !feedbackSubmitted ? (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRequestFeedback(message.id, 'THUMBS_UP')}
              >
                Helpful
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRequestFeedback(message.id, 'THUMBS_DOWN')}
              >
                Not helpful
              </Button>
            </>
          ) : null}
          {feedbackSubmitted ? (
            <Typography variant="caption" tone="muted">
              Feedback already submitted
            </Typography>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
