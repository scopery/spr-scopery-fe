'use client'

import { MoreHorizontal, X } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import { Button, Input, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import type { AiConversation } from '../../domain/model/conversation'
import type { ConversationListTab } from '../hooks/useAiAssistant'

interface AiConversationDrawerProps {
  open: boolean
  conversations: AiConversation[]
  activeId: string | null
  listTab: ConversationListTab
  listSearch: string
  mutating?: boolean
  onClose: () => void
  onTabChange: (tab: ConversationListTab) => void
  onSearchChange: (value: string) => void
  onNew: () => void
  onOpen: (id: string) => void
  onRename: (c: AiConversation) => void
  onArchive: (c: AiConversation) => void
  onDelete: (c: AiConversation) => void
}

function dayBucket(iso: string | undefined | null): 'Today' | 'Yesterday' | 'Earlier' {
  if (!iso) return 'Earlier'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return 'Earlier'
  const now = new Date()
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startYesterday = new Date(startToday)
  startYesterday.setDate(startYesterday.getDate() - 1)
  if (d >= startToday) return 'Today'
  if (d >= startYesterday) return 'Yesterday'
  return 'Earlier'
}

export function AiConversationDrawer({
  open,
  conversations,
  activeId,
  listTab,
  listSearch,
  mutating = false,
  onClose,
  onTabChange,
  onSearchChange,
  onNew,
  onOpen,
  onRename,
  onArchive,
  onDelete,
}: AiConversationDrawerProps) {
  const [menuId, setMenuId] = useState<string | null>(null)

  const groups = useMemo(() => {
    const order: Array<'Today' | 'Yesterday' | 'Earlier'> = ['Today', 'Yesterday', 'Earlier']
    const map: Record<string, AiConversation[]> = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    }
    for (const c of conversations) {
      map[dayBucket(c.lastMessageAt ?? c.updatedAt ?? c.createdAt)].push(c)
    }
    return order
      .map((label) => ({ label, items: map[label] }))
      .filter((g) => g.items.length > 0)
  }, [conversations])

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-neutral-900/20"
        aria-label="Close conversations"
        onClick={onClose}
      />
      <aside className="fixed left-0 top-0 z-50 flex h-full w-[min(100%,320px)] flex-col border-r border-neutral-200 bg-white shadow-lg md:left-auto">
        <div className="flex h-14 items-center justify-between border-b border-neutral-200 px-3">
          <Typography weight="medium">Conversations</Typography>
          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" onClick={onNew} disabled={mutating}>
              New
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Close"
              icon={<X size={14} />}
              onClick={onClose}
            />
          </div>
        </div>

        <div className="border-b border-neutral-200 p-3">
          <Input
            value={listSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search…"
            aria-label="Search conversations"
          />
          <div className="mt-2 flex gap-1" role="tablist" aria-label="Conversation status">
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

        <div className="flex-1 overflow-auto">
          {conversations.length === 0 ? (
            <Typography variant="small" tone="muted" className="block p-3">
              {listTab === 'archived' ? 'No archived conversations.' : 'No conversations yet.'}
            </Typography>
          ) : (
            groups.map((group) => (
              <div key={group.label} className="border-b border-neutral-100 py-2">
                <Typography
                  variant="caption"
                  tone="muted"
                  className="block px-3 py-1 uppercase tracking-wide"
                >
                  {listTab === 'archived' && group.label === 'Earlier'
                    ? 'Archived'
                    : group.label}
                </Typography>
                <ul>
                  {group.items.map((c) => (
                    <li key={c.id} className="relative">
                      <div
                        className={cn(
                          'flex items-start gap-1 px-2 py-1.5 hover:bg-neutral-50',
                          activeId === c.id && 'bg-neutral-50'
                        )}
                      >
                        <button
                          type="button"
                          className="min-w-0 flex-1 truncate px-1 text-left text-sm text-neutral-800"
                          onClick={() => {
                            setMenuId(null)
                            onOpen(c.id)
                            onClose()
                          }}
                        >
                          {c.title ?? 'Untitled'}
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
                          className="absolute right-2 top-9 z-10 min-w-[140px] border border-neutral-200 bg-white p-1 shadow-sm"
                          role="menu"
                        >
                          <button
                            type="button"
                            className="block w-full px-2 py-1.5 text-left text-sm hover:bg-neutral-50"
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
                              className="block w-full px-2 py-1.5 text-left text-sm hover:bg-neutral-50"
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
                            className="block w-full px-2 py-1.5 text-left text-sm text-error hover:bg-neutral-50"
                            role="menuitem"
                            onClick={() => {
                              setMenuId(null)
                              onDelete(c)
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  )
}
