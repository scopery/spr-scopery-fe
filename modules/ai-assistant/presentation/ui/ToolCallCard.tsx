'use client'

import { Loader2 } from 'lucide-react'
import { Typography } from '@/shared/ui'
import type { StreamToolCall } from '../hooks/aiMessageStream.reducer'

interface ToolCallCardProps {
  tool: StreamToolCall
}

export function ToolCallCard({ tool }: ToolCallCardProps) {
  const isRunning = tool.status === 'running'

  return (
    <div className="flex items-center gap-2 border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">
      {isRunning ? (
        <Loader2 size={14} className="shrink-0 animate-spin text-primary" />
      ) : null}
      <Typography variant="small" className="text-neutral-700">
        {isRunning ? 'Gathering project context…' : 'Context retrieved'}
      </Typography>
    </div>
  )
}
