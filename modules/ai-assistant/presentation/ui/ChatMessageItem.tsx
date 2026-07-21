'use client'

import { Copy, ThumbsDown, ThumbsUp } from 'lucide-react'
import { Button, Typography } from '@/shared/ui'
import { AiMessageRole } from '../../domain/enums/ai-assistant.enum'
import type { AiMessage } from '../../domain/model/conversation'
import { AiInlineActions } from './AiInlineActions'
import { AiMarkdownContent } from './AiMarkdownContent'
import { AiMessageShell } from './AiMessageShell'
import type { AiLandingMode } from './AiWorkspaceLanding'
import type { FeedbackRating } from './MessageFeedbackDialog'

interface ChatMessageItemProps {
  message: AiMessage
  actionMode?: AiLandingMode
  showActions?: boolean
  feedbackSubmitted?: boolean
  canSubmitFeedback?: boolean
  onRequestFeedback?: (messageId: string, rating: FeedbackRating) => void
  onCopy?: (content: string) => void
}

export function ChatMessageItem({
  message,
  actionMode = 'general',
  showActions = false,
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
  const isUser = role === AiMessageRole.User || role === 'USER' || role === 'user'
  const content = message.content ?? ''

  if (isTool) {
    return null
  }

  if (!isUser && !isAssistant) {
    return (
      <AiMessageShell role="assistant">
        <Typography variant="small" className="whitespace-pre-wrap leading-relaxed">
          {content}
        </Typography>
      </AiMessageShell>
    )
  }

  return (
    <AiMessageShell
      role={isUser ? 'user' : 'assistant'}
      footer={
        isAssistant ? (
          <div className="flex flex-wrap items-center gap-1">
            {onCopy && content ? (
              <Button
                size="sm"
                variant="ghost"
                icon={<Copy size={14} />}
                aria-label="Copy"
                onClick={() => onCopy(content)}
              />
            ) : null}
            {onRequestFeedback && canSubmitFeedback && !feedbackSubmitted ? (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<ThumbsUp size={14} />}
                  aria-label="Helpful"
                  onClick={() => onRequestFeedback(message.id, 'THUMBS_UP')}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<ThumbsDown size={14} />}
                  aria-label="Not helpful"
                  onClick={() => onRequestFeedback(message.id, 'THUMBS_DOWN')}
                />
              </>
            ) : null}
            {feedbackSubmitted ? (
              <Typography variant="caption" tone="muted">
                Thanks for your feedback
              </Typography>
            ) : null}
          </div>
        ) : undefined
      }
    >
      {isAssistant ? (
        <>
          <AiMarkdownContent content={content} />
          {showActions ? <AiInlineActions mode={actionMode} /> : null}
        </>
      ) : (
        <Typography variant="small" className="whitespace-pre-wrap text-[15px] leading-[1.65]">
          {content}
        </Typography>
      )}
    </AiMessageShell>
  )
}
