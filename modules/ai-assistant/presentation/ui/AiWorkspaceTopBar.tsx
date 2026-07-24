'use client'

import { Menu, Minimize2, MoreHorizontal, PanelRight, Plus, Sparkles } from 'lucide-react'
import { Button, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'

interface AiWorkspaceTopBarProps {
  title: string
  subtitle?: string | null
  sourcesOpen: boolean
  onToggleConversations: () => void
  onToggleSources: () => void
  onNewChat: () => void
  onMinimize?: () => void
  onMore?: () => void
}

export function AiWorkspaceTopBar({
  title,
  subtitle,
  sourcesOpen,
  onToggleConversations,
  onToggleSources,
  onNewChat,
  onMinimize,
  onMore,
}: AiWorkspaceTopBarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-neutral-200 bg-white px-3 md:px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          aria-label="Open conversations"
          icon={<Menu size={16} />}
          onClick={onToggleConversations}
        />
        <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-blue-400 text-white">
          <Sparkles size={14} />
        </span>
        <div className="min-w-0">
          <Typography as="p" className="font-calsans truncate text-sm text-neutral-900">
            Scopery AI
            {title ? (
              <span className="font-questrial ml-2 font-normal text-neutral-500">/ {title}</span>
            ) : null}
          </Typography>
          {subtitle ? (
            <Typography variant="caption" tone="muted" className="block truncate">
              {subtitle}
            </Typography>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant={sourcesOpen ? 'secondary' : 'ghost'}
          icon={<PanelRight size={14} />}
          onClick={onToggleSources}
          className={cn('hidden sm:inline-flex')}
        >
          Sources
        </Button>
        <Button
          type="button"
          size="sm"
          variant={sourcesOpen ? 'secondary' : 'ghost'}
          icon={<PanelRight size={14} />}
          aria-label="Sources"
          onClick={onToggleSources}
          className="sm:hidden"
        />
        <Button
          type="button"
          size="sm"
          variant="ghost"
          icon={<Plus size={14} />}
          onClick={onNewChat}
          className="hidden sm:inline-flex"
        >
          New chat
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          icon={<Plus size={14} />}
          aria-label="New chat"
          onClick={onNewChat}
          className="sm:hidden"
        />
        {onMinimize ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="Minimize"
            icon={<Minimize2 size={14} />}
            onClick={onMinimize}
          />
        ) : null}
        {onMore ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            aria-label="More actions"
            icon={<MoreHorizontal size={14} />}
            onClick={onMore}
          />
        ) : null}
      </div>
    </header>
  )
}
