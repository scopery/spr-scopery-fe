'use client'

import type { RefObject } from 'react'
import NextLink from 'next/link'
import { Bell, FileText, Inbox, Search, Sparkles } from 'lucide-react'
import { Link as DesignLink, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { FEATURES } from '@/config/features'
import { cn } from '@/utils/cn'

export interface CommonNavigationProps {
  workspaceId: string
  projectId?: string | null
  collapsed: boolean
  documentHubActive: boolean
  notificationsActive: boolean
  workInboxActive?: boolean
  agentControlActive?: boolean
  canViewDocumentHub: boolean
  unreadCount: number
  badgePopKey: number
  onOpenSearch: () => void
  onOpenNotifications: () => void
  onOpenAiAssistant: () => void
  notificationsOpen?: boolean
  aiAssistantOpen?: boolean
  notificationsAnchorRef?: RefObject<HTMLButtonElement>
  aiAssistantAnchorRef?: RefObject<HTMLButtonElement>
}

export function CommonNavigation({
  workspaceId,
  projectId,
  collapsed,
  documentHubActive,
  notificationsActive,
  workInboxActive,
  agentControlActive,
  canViewDocumentHub,
  unreadCount,
  badgePopKey,
  onOpenSearch,
  onOpenNotifications,
  onOpenAiAssistant,
  notificationsOpen,
  aiAssistantOpen,
  notificationsAnchorRef,
  aiAssistantAnchorRef,
}: CommonNavigationProps) {
  const itemClass = (active?: boolean) =>
    cn(
      'relative flex w-full items-center gap-2 rounded-none border-l-2 border-transparent px-3 py-2 text-left text-sm motion-colors motion-icon-hover hover:bg-neutral-50',
      collapsed && 'justify-center px-2',
      active && 'border-primary bg-neutral-50 text-neutral-900'
    )

  const documentHubHref = ROUTES.workspace.documentHub(
    workspaceId,
    projectId ? { projectId } : undefined
  )
  const workInboxHref = ROUTES.workspace.workInbox(workspaceId)

  return (
    <nav aria-label="Common navigation" className={cn('py-2', collapsed ? 'px-1' : 'px-2')}>
      <ul className="flex flex-col">
        <li>
          <button
            type="button"
            title={collapsed ? 'Search (⌘K)' : undefined}
            className={itemClass(false)}
            onClick={onOpenSearch}
          >
            <Search size={16} className="shrink-0 text-neutral-500" aria-hidden />
            {!collapsed ? (
              <Typography as="span" variant="small" className="truncate">
                Search
              </Typography>
            ) : null}
          </button>
        </li>
        {canViewDocumentHub ? (
          <li>
            <DesignLink
              as={NextLink}
              href={documentHubHref}
              title={collapsed ? 'Document Hub' : undefined}
              aria-current={documentHubActive ? 'page' : undefined}
              className={itemClass(documentHubActive)}
            >
              <FileText
                size={16}
                className={cn(
                  'shrink-0',
                  documentHubActive ? 'text-primary' : 'text-neutral-500'
                )}
                aria-hidden
              />
              {!collapsed ? (
                <Typography as="span" variant="small" className="truncate">
                  Document Hub
                </Typography>
              ) : null}
            </DesignLink>
          </li>
        ) : null}
        <li>
          <button
            ref={notificationsAnchorRef}
            type="button"
            title={
              collapsed
                ? unreadCount > 0
                  ? `Notifications, ${unreadCount} unread`
                  : 'Notifications'
                : undefined
            }
            aria-expanded={notificationsOpen}
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : 'Notifications'
            }
            className={itemClass(notificationsActive || notificationsOpen)}
            onClick={onOpenNotifications}
          >
            <span className="relative shrink-0">
              <Bell
                size={16}
                className={cn(
                  notificationsActive || notificationsOpen
                    ? 'text-primary'
                    : 'text-neutral-500'
                )}
                aria-hidden
              />
              {unreadCount > 0 ? (
                <span
                  key={badgePopKey}
                  className="absolute -right-1.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center bg-red-600 px-0.5 text-[9px] font-medium text-white motion-badge-pop"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : null}
            </span>
            {!collapsed ? (
              <Typography as="span" variant="small" className="truncate">
                Notifications
              </Typography>
            ) : null}
          </button>
        </li>
        <li>
          <button
            ref={aiAssistantAnchorRef}
            type="button"
            title={collapsed ? 'AI Assistant' : undefined}
            aria-expanded={aiAssistantOpen}
            className={itemClass(agentControlActive || aiAssistantOpen)}
            onClick={onOpenAiAssistant}
          >
            <Sparkles
              size={16}
              className={cn(
                'shrink-0',
                agentControlActive || aiAssistantOpen
                  ? 'text-primary'
                  : 'text-neutral-500'
              )}
              aria-hidden
            />
            {!collapsed ? (
              <Typography as="span" variant="small" className="truncate">
                AI Assistant
              </Typography>
            ) : null}
          </button>
        </li>
        {FEATURES.workInbox ? (
          <li>
            <DesignLink
              as={NextLink}
              href={workInboxHref}
              title={collapsed ? 'Work Inbox' : undefined}
              aria-current={workInboxActive ? 'page' : undefined}
              className={itemClass(workInboxActive)}
            >
              <Inbox
                size={16}
                className={cn(
                  'shrink-0',
                  workInboxActive ? 'text-primary' : 'text-neutral-500'
                )}
                aria-hidden
              />
              {!collapsed ? (
                <Typography as="span" variant="small" className="truncate">
                  Work Inbox
                </Typography>
              ) : null}
            </DesignLink>
          </li>
        ) : null}
      </ul>
    </nav>
  )
}
