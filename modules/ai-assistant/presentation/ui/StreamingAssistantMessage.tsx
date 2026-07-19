'use client'

import { Button, Typography } from '@/shared/ui'
import { AiStreamUiState } from '../../domain/enums/ai-assistant.enum'
import type { StreamToolCall } from '../hooks/aiMessageStream.reducer'
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

function statusLabel(uiState: AiStreamUiState, messageStatus: string | null): string {
  if (messageStatus) return messageStatus
  switch (uiState) {
    case AiStreamUiState.Starting:
      return 'Starting…'
    case AiStreamUiState.Connecting:
      return 'Connecting…'
    case AiStreamUiState.Connected:
      return 'Generating…'
    case AiStreamUiState.Reconnecting:
      return 'Reconnecting…'
    case AiStreamUiState.Cancelling:
      return 'Stopping…'
    case AiStreamUiState.Failed:
      return 'Failed'
    case AiStreamUiState.Cancelled:
      return 'Cancelled'
    default:
      return ''
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
    <div className="border border-primary-100 bg-primary-50/40 p-sm">
      <div className="mb-sm flex items-center justify-between gap-sm">
        <Typography variant="caption" tone="primary">
          ASSISTANT {label ? `· ${label}` : ''}
        </Typography>
        {showStop && onStop ? (
          <Button size="sm" variant="ghost" onClick={onStop}>
            Stop
          </Button>
        ) : null}
        {uiState === AiStreamUiState.Cancelling ? (
          <Typography variant="caption" tone="warning">
            Cancel requested…
          </Typography>
        ) : null}
      </div>

      {tools.map((tool) => (
        <ToolCallCard key={tool.id} tool={tool} />
      ))}

      {text ? (
        <Typography variant="small" tone="primary" className="whitespace-pre-wrap">
          {text}
        </Typography>
      ) : (
        <Typography variant="small" tone="muted">
          {uiState === AiStreamUiState.Reconnecting
            ? 'Reconnecting — keeping previous tokens…'
            : 'Waiting for tokens…'}
        </Typography>
      )}

      {error ? (
        <Typography variant="small" tone="error" className="mt-sm block">
          {error}
        </Typography>
      ) : null}

      {canRetryConnection && onRetryConnection ? (
        <Button size="sm" className="mt-sm" variant="outline" onClick={onRetryConnection}>
          Retry connection
        </Button>
      ) : null}
    </div>
  )
}
