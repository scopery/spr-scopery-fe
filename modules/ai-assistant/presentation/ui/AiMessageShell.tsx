'use client'

import type { ReactNode } from 'react'
import { Sparkles } from 'lucide-react'
import { Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

interface AiMessageShellProps {
  role: 'user' | 'assistant'
  children: ReactNode
  footer?: ReactNode
  status?: ReactNode
}

export function AiMessageShell({ role, children, footer, status }: AiMessageShellProps) {
  const isUser = role === 'user'

  return (
    <article
      className={cn(
        'py-6',
        isUser ? 'border-b border-neutral-100' : 'border-b border-neutral-100 bg-neutral-50/60'
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        {isUser ? (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-neutral-200 text-[11px] font-medium text-neutral-700">
            You
          </span>
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center bg-primary-gradient text-white">
            <Sparkles size={12} />
          </span>
        )}
        <Typography
          variant="caption"
          className="font-medium uppercase tracking-wide text-neutral-500"
        >
          {isUser ? 'You' : 'Scopery AI'}
        </Typography>
        {status}
      </div>
      <div className="pl-8">{children}</div>
      {footer ? <div className="mt-3 pl-8">{footer}</div> : null}
    </article>
  )
}
