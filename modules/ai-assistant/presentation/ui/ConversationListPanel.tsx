'use client'

import { MoreHorizontal } from 'lucide-react'
import React, { useState } from 'react'
import { Button, Input, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { AiConversation } from '../../domain/model/conversation'
import type { ConversationListTab } from '../hooks/useAiAssistant'

interface ConversationListPanelProps {
  conversations: AiConversation[]
  activeId: string | null
  listTab: ConversationListTab
  listSearch: string
  mutating?: boolean
  onTabChange: (tab: ConversationListTab) => void
  onSearchChange: (value: string) => void
  onNew: () => void
  onOpen: (id: string) => void
  onRename: (c: AiConversation) => void
  onArchive: (c: AiConversation) => void
  onDelete: (c: AiConversation) => void
}

export function ConversationListPanel({
  conversations,
  activeId,
  listTab,
  listSearch,
  mutating = false,
  onTabChange,
  onSearchChange,
  onNew,
  onOpen,
  onRename,
  onArchive,
  onDelete,
}: ConversationListPanelProps) {
  const [menuId, setMenuId] = useState<string | null>(null)

  return (
    <aside className="flex h-full min-h-[480px] flex-col border border-neutral-200">
      <div className="flex items-center justify-between border-b border-neutral-200 p-sm">
        <Typography variant="h4">Conversations</Typography>
        <Button size="sm" variant="ghost" onClick={onNew} disabled={mutating}>
          New
        </Button>
      </div>

      <div className="border-b border-neutral-200 p-sm">
        <Input
          value={listSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search…"
          aria-label="Search conversations"
        />
        <div className="mt-sm flex gap-xs" role="tablist" aria-label="Conversation status">
          <Button
            size="sm"
            variant={listTab === 'active' ? 'primary' : 'ghost'}
            onClick={() => onTabChange('active')}
            aria-selected={listTab === 'active'}
          >
            Active
          </Button>
          <Button
            size="sm"
            variant={listTab === 'archived' ? 'primary' : 'ghost'}
            onClick={() => onTabChange('archived')}
            aria-selected={listTab === 'archived'}
          >
            Archived
          </Button>
        </div>
      </div>

      <ul className="flex-1 overflow-auto">
        {conversations.length === 0 ? (
          <li className="p-sm">
            <Typography variant="small" tone="muted">
              {listTab === 'archived' ? 'No archived conversations.' : 'No conversations yet.'}
            </Typography>
          </li>
        ) : null}
        {conversations.map((c) => (
          <li key={c.id} className="relative border-b border-neutral-100">
            <div
              className={cn(
                'flex items-start gap-xs px-sm py-xs hover:bg-neutral-50',
                activeId === c.id && 'bg-neutral-50'
              )}
            >
              <button
                type="button"
                className={cn(
                  'min-w-0 flex-1 text-left text-sm',
                  activeId === c.id && 'font-medium'
                )}
                onClick={() => {
                  setMenuId(null)
                  onOpen(c.id)
                }}
              >
                <span className="block truncate">{c.title ?? 'Untitled'}</span>
                <span className="mt-0.5 block truncate text-xs text-neutral-500">
                  {[c.conversationType, c.capabilityLevel].filter(Boolean).join(' · ') ||
                    'Conversation'}
                </span>
              </button>
              <Button
                size="sm"
                variant="ghost"
                aria-label="Conversation actions"
                aria-expanded={menuId === c.id}
                disabled={mutating}
                icon={<MoreHorizontal size={14} />}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation()
                  setMenuId((prev) => (prev === c.id ? null : c.id))
                }}
              />
            </div>
            {menuId === c.id ? (
              <div
                className="absolute right-sm top-10 z-10 min-w-[140px] border border-neutral-200 bg-white p-xs shadow-sm"
                role="menu"
              >
                <button
                  type="button"
                  className="block w-full px-sm py-xs text-left text-sm hover:bg-neutral-50"
                  role="menuitem"
                  onClick={() => {
                    setMenuId(null)
                    onRename(c)
                  }}
                >
                  Rename
                </button>
                {listTab === 'active' ? (
                  <button
                    type="button"
                    className="block w-full px-sm py-xs text-left text-sm hover:bg-neutral-50"
                    role="menuitem"
                    onClick={() => {
                      setMenuId(null)
                      onArchive(c)
                    }}
                  >
                    Archive
                  </button>
                ) : null}
                <button
                  type="button"
                  className="block w-full px-sm py-xs text-left text-sm hover:bg-neutral-50"
                  role="menuitem"
                  onClick={() => {
                    setMenuId(null)
                    onDelete(c)
                  }}
                >
                  <Typography as="span" variant="small" tone="error">
                    Delete
                  </Typography>
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </aside>
  )
}
