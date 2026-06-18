'use client'

import { useState } from 'react'
import { MessageSquare, Lightbulb, Activity, Share2 } from 'lucide-react'
import { Button, Typography } from '@/shared/ui'
import type { CollaborationPermissions } from '@/types/collaboration'
import { DocumentCommentsPanel } from './DocumentCommentsPanel'
import { DocumentSuggestionsPanel } from './DocumentSuggestionsPanel'
import { DocumentActivityPanel } from './DocumentActivityPanel'
import { ShareDocumentDialog } from './ShareDocumentDialog'

type PanelTab = 'comments' | 'suggestions' | 'activity'

interface DocumentCollaborationPanelProps {
  orgId: string
  documentId: string
  projectId?: string
  permissions: CollaborationPermissions
}

export function DocumentCollaborationPanel({
  orgId,
  documentId,
  projectId,
  permissions,
}: DocumentCollaborationPanelProps) {
  const [tab, setTab] = useState<PanelTab>('comments')
  const [shareOpen, setShareOpen] = useState(false)

  const tabs: Array<{ id: PanelTab; label: string; icon: typeof MessageSquare; visible: boolean }> = [
    { id: 'comments', label: 'Comments', icon: MessageSquare, visible: permissions.canViewComments },
    { id: 'suggestions', label: 'Suggestions', icon: Lightbulb, visible: permissions.canViewSuggestions },
    { id: 'activity', label: 'Activity', icon: Activity, visible: permissions.canViewActivity },
  ]

  const visibleTabs = tabs.filter((t) => t.visible)
  if (visibleTabs.length === 0 && !permissions.canShare) return null

  return (
    <aside className="border border-neutral-200 bg-white p-4 space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <div className="flex items-center justify-between gap-2">
        <Typography weight="semibold">Collaboration</Typography>
        {permissions.canShare && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="flex items-center gap-1"
            aria-label="Share document internally"
          >
            <Share2 size={14} aria-hidden />
            Share
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Collaboration panels">
        {visibleTabs.map((t) => {
          const Icon = t.icon
          return (
            <Button
              key={t.id}
              variant={tab === t.id ? 'primary' : 'ghost'}
              size="sm"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1"
            >
              <Icon size={14} aria-hidden />
              {t.label}
            </Button>
          )
        })}
      </div>

      <div role="tabpanel">
        {tab === 'comments' && permissions.canViewComments && (
          <DocumentCommentsPanel
            orgId={orgId}
            documentId={documentId}
            projectId={projectId}
            permissions={permissions}
          />
        )}
        {tab === 'suggestions' && permissions.canViewSuggestions && (
          <DocumentSuggestionsPanel
            orgId={orgId}
            documentId={documentId}
            projectId={projectId}
            permissions={permissions}
          />
        )}
        {tab === 'activity' && permissions.canViewActivity && (
          <DocumentActivityPanel
            orgId={orgId}
            documentId={documentId}
            projectId={projectId}
            permissions={permissions}
          />
        )}
      </div>

      <ShareDocumentDialog
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        orgId={orgId}
        documentId={documentId}
        projectId={projectId}
        canManageCollaborators={permissions.canManageCollaborators}
      />
    </aside>
  )
}
