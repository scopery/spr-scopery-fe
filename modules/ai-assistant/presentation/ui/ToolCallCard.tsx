'use client'

import { useState } from 'react'
import { Button, Typography } from '@/shared/ui'
import type { StreamToolCall } from '../hooks/aiMessageStream.reducer'

interface ToolCallCardProps {
  tool: StreamToolCall
}

export function ToolCallCard({ tool }: ToolCallCardProps) {
  const [open, setOpen] = useState(false)
  const isRunning = tool.status === 'running'

  return (
    <div className="my-xs border border-neutral-200 bg-neutral-50 p-sm">
      <div className="flex items-start justify-between gap-sm">
        <div className="min-w-0">
          <Typography variant="caption" tone="muted">
            {isRunning ? 'Calling tool' : 'Tool'}
          </Typography>
          <Typography variant="small" weight="medium" className="block truncate">
            {tool.toolName}
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            Status: {tool.status}
            {tool.durationMs != null ? ` · ${tool.durationMs}ms` : ''}
          </Typography>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen((v) => !v)}>
          {open ? 'Hide' : 'Details'}
        </Button>
      </div>
      <Typography variant="caption" className="mt-sm block break-words">
        {isRunning ? `Input: ${tool.inputSummary}` : `Result: ${tool.resultSummary ?? '—'}`}
      </Typography>
      {open ? (
        <pre className="mt-sm max-h-40 overflow-auto border border-neutral-200 bg-white p-sm text-xs">
          {JSON.stringify(
            {
              input: tool.rawInput,
              result: tool.rawResult,
            },
            null,
            2
          )}
        </pre>
      ) : null}
    </div>
  )
}
