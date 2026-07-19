'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { Button, Typography, Select } from '@/shared/ui'
import type { DocumentCollaborationPanelProps } from '@/modules/collaboration/core/model/collaboration'
import { DocumentCommentsPanel } from '@/modules/collaboration/comments/ui/DocumentCommentsPanel'
import { DocumentSuggestionsPanel } from '@/modules/collaboration/suggestions/ui/DocumentSuggestionsPanel'
import { DocumentActivityPanel } from '@/modules/collaboration/activity/ui/DocumentActivityPanel'
import { ShareDocumentDialog } from '@/modules/collaboration/sharing/ui/ShareDocumentDialog'

type PanelTab = 'comments' | 'suggestions' | 'activity'

export function DocumentCollaborationPanel({
  orgId,
  documentId,
  projectId,
  permissions,
}: DocumentCollaborationPanelProps) {
  const [tab, setTab] = useState<PanelTab>('comments')
  const [shareOpen, setShareOpen] = useState(false)

  const tabs: Array<{ id: PanelTab; label: string; visible: boolean }> = [
    { id: 'comments', label: 'Comments', visible: permissions.canViewComments },
    { id: 'suggestions', label: 'Suggestions', visible: permissions.canViewSuggestions },
    { id: 'activity', label: 'Activity', visible: permissions.canViewActivity },
  ]

  const visibleTabs = tabs.filter((t) => t.visible)
  if (visibleTabs.length === 0 && !permissions.canShare) return null

  return (
    <aside className="space-y-4 border border-neutral-200 bg-white p-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <div className="flex items-center justify-between gap-2">
        <Typography weight="semibold">Collaboration</Typography>
        {permissions.canShare && (
          <Button
            variant="outline"
            onClick={() => setShareOpen(true)}
            aria-label="Share document internally"
            icon={<Share2 size={14} />}
          >
            Share
          </Button>
        )}
      </div>

      {visibleTabs.length > 0 ? (
        <Select
          value={tab}
          onValueChange={(v: string) => setTab(v as PanelTab)}
          options={visibleTabs.map((t) => ({ value: t.id, label: t.label }))}
          placeholder="Select panel"
        />
      ) : null}

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
