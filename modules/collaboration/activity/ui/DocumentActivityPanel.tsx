'use client'

import { Avatar, Typography, ContentLoader } from '@/shared/ui'
import type {
  CollaborationPermissions,
  DocumentActivity,
} from '@/modules/collaboration/core/model/collaboration'
import { useDocumentActivity } from '@/modules/collaboration/core/hooks'

const ACTION_LABELS: Record<string, string> = {
  comment_created: 'created a comment',
  comment_resolved: 'resolved a comment',
  comment_reopened: 'reopened a comment',
  comment_deleted: 'deleted a comment',
  suggestion_created: 'created a suggestion',
  suggestion_accepted: 'accepted a suggestion',
  suggestion_rejected: 'rejected a suggestion',
  suggestion_deleted: 'deleted a suggestion',
  document_shared: 'shared this document',
  collaborator_removed: 'removed a collaborator',
}

function formatActivity(item: DocumentActivity): string {
  const actor = item.actor_display_name || 'Someone'
  const label = ACTION_LABELS[item.action] ?? item.action.replace(/_/g, ' ')
  return `${actor} ${label}`
}

interface DocumentActivityPanelProps {
  orgId: string
  documentId: string
  projectId?: string
  permissions: CollaborationPermissions
}

export function DocumentActivityPanel({
  orgId,
  documentId,
  projectId,
  permissions,
}: DocumentActivityPanelProps) {
  const { items, loading } = useDocumentActivity({
    orgId,
    documentId,
    projectId,
    canViewActivity: permissions.canViewActivity,
  })

  if (!permissions.canViewActivity) {
    return <Typography tone="muted">You do not have access to activity.</Typography>
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <ContentLoader variant="easeOut" className="w-16" />
      </div>
    )
  }

  if (items.length === 0) {
    return <Typography tone="muted">No activity yet.</Typography>
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2 border-b border-neutral-100 pb-2">
          <Avatar name={item.actor_display_name || 'User'} size="sm" />
          <div>
            <Typography variant="small">{formatActivity(item)}</Typography>
            <Typography variant="small" tone="muted">
              {new Date(item.created_at).toLocaleString()}
            </Typography>
          </div>
        </li>
      ))}
    </ul>
  )
}
