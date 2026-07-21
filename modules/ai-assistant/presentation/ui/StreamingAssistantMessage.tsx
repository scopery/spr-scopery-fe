'use client'

import { Button, Typography } from '@/shared/ui'
import { AiStreamUiState } from '../../domain/enums/ai-assistant.enum'
import type { StreamToolCall } from '../hooks/aiMessageStream.reducer'
import { AiMarkdownContent } from './AiMarkdownContent'
import { AiMessageShell } from './AiMessageShell'
import { ToolCallCard } from './ToolCallCard'

interface StreamingAssistantMessageProps {
  text: string
  tools: StreamToolCall[]
  uiState: AiStreamUiState
  messageStatus: string | null
  error: string | null
  canRetryConnection: boolean
  onRetryConnection?: () => void
  onStop?: () => void
}

function statusLabel(uiState: AiStreamUiState, messageStatus: string | null): string | null {
  if (messageStatus) return messageStatus
  switch (uiState) {
    case AiStreamUiState.Starting:
      return 'Starting…'
    case AiStreamUiState.Connecting:
      return 'Connecting…'
    case AiStreamUiState.Connected:
      return null
    case AiStreamUiState.Reconnecting:
      return 'Reconnecting…'
    case AiStreamUiState.Cancelling:
      return 'Stopping…'
    case AiStreamUiState.Failed:
      return 'Failed'
    case AiStreamUiState.Cancelled:
      return 'Cancelled'
    default:
      return null
  }
}

export function StreamingAssistantMessage({
  text,
  tools,
  uiState,
  messageStatus,
  error,
  canRetryConnection,
  onRetryConnection,
  onStop,
}: StreamingAssistantMessageProps) {
  const label = statusLabel(uiState, messageStatus)
  const showStop =
    uiState === AiStreamUiState.Connected ||
    uiState === AiStreamUiState.Connecting ||
    uiState === AiStreamUiState.Reconnecting ||
    uiState === AiStreamUiState.Starting

  return (
    <AiMessageShell
      role="assistant"
      status={
        label ? (
          <Typography variant="caption" tone="muted" className="normal-case">
            · {label}
          </Typography>
        ) : showStop ? (
          <Typography variant="caption" tone="muted" className="normal-case">
            · Generating…
          </Typography>
        ) : null
      }
      footer={
        showStop && onStop ? (
          <Button size="sm" variant="outline" onClick={onStop}>
            Stop generating
          </Button>
        ) : canRetryConnection && onRetryConnection ? (
          <Button size="sm" variant="outline" onClick={onRetryConnection}>
            Reconnect
          </Button>
        ) : undefined
      }
    >
      {tools.length > 0 ? (
        <div className="mb-3 space-y-2">
          {tools.map((tool) => (
            <ToolCallCard key={tool.id} tool={tool} />
          ))}
        </div>
      ) : null}

      {text ? (
        <AiMarkdownContent
          content={text}
          trailing={
            uiState === AiStreamUiState.Connected ? (
              <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-primary align-middle" />
            ) : null
          }
        />
      ) : (
        <Typography variant="small" tone="muted" className="leading-relaxed">
          {uiState === AiStreamUiState.Reconnecting
            ? 'Reconnecting — keeping previous response…'
            : 'Thinking…'}
        </Typography>
      )}

      {error ? (
        <Typography variant="small" tone="error" className="mt-3 block">
          {error}
        </Typography>
      ) : null}
    </AiMessageShell>
  )
}
