'use client'

import { useState } from 'react'
import { Button, Modal, Select, Typography } from '@/shared/ui'
import type { ShareDocumentDialogProps } from '@/modules/collaboration/core/model/collaboration'
import { useShareDocument } from '@/modules/collaboration/core/hooks'

export function ShareDocumentDialog({
  open,
  onClose,
  orgId,
  documentId,
  projectId,
  canManageCollaborators,
}: ShareDocumentDialogProps) {
  const [selectedUser, setSelectedUser] = useState('')
  const [role, setRole] = useState<'viewer' | 'commenter' | 'editor'>('commenter')

  const { users, collaborators, loading, shareDocument, removeCollaborator } = useShareDocument({
    open,
    orgId,
    documentId,
    projectId,
    canManageCollaborators,
  })

  const handleShare = async () => {
    if (!selectedUser) return
    try {
      await shareDocument(selectedUser, role)
      setSelectedUser('')
    } catch {
      // Error toast handled in hook
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share document internally"
      size="md"
      actions={[{ label: 'Close', onClick: onClose, variant: 'ghost' }]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Grant access to a workspace member. No public links are created.
        </Typography>

        <Select
          label="Member"
          value={selectedUser || '__none__'}
          onValueChange={(v: string) => setSelectedUser(v === '__none__' ? '' : v)}
          options={[
            { value: '__none__', label: 'Select member…' },
            ...users.map((u) => ({
              value: u.user_id,
              label: u.display_name || u.email || u.user_id,
            })),
          ]}
        />

        <Select
          label="Role"
          value={role}
          onValueChange={(v: string) => setRole(v as 'viewer' | 'commenter' | 'editor')}
          options={[
            { value: 'viewer', label: 'Viewer — read only' },
            { value: 'commenter', label: 'Commenter — view and comment' },
            { value: 'editor', label: 'Editor — edit document' },
          ]}
        />

        <Button variant="primary" size="sm" loading={loading} onClick={() => void handleShare()}>
          Grant access
        </Button>

        {collaborators.length > 0 && (
          <div className="space-y-2 border-t border-neutral-200 pt-2">
            <Typography weight="medium">Current collaborators</Typography>
            {collaborators.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <Typography variant="small">
                  {c.display_name || c.email || c.user_id} — {c.role}
                </Typography>
                {canManageCollaborators && (
                  <Button variant="ghost" size="sm" onClick={() => void removeCollaborator(c.user_id)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  )
}
