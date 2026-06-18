'use client'

import { useEffect, useState } from 'react'
import { Button, Modal, Select, Typography } from '@/shared/ui'
import * as collaborationService from '@/services/collaboration.service'
import type { DocumentCollaborator, MentionableUser } from '@/types/collaboration'
import { ApiError } from '@/types/api'
import { toast } from 'sonner'

interface ShareDocumentDialogProps {
  open: boolean
  onClose: () => void
  orgId: string
  documentId: string
  projectId?: string
  canManageCollaborators: boolean
}

export function ShareDocumentDialog({
  open,
  onClose,
  orgId,
  documentId,
  projectId,
  canManageCollaborators,
}: ShareDocumentDialogProps) {
  const [users, setUsers] = useState<MentionableUser[]>([])
  const [collaborators, setCollaborators] = useState<DocumentCollaborator[]>([])
  const [selectedUser, setSelectedUser] = useState('')
  const [role, setRole] = useState<'viewer' | 'commenter' | 'editor'>('commenter')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    Promise.all([
      collaborationService.listMentionableUsers(orgId, { project_id: projectId }),
      collaborationService.listCollaborators(orgId, documentId, projectId).catch(() => ({ items: [] })),
    ]).then(([usersRes, collabRes]) => {
      setUsers(usersRes.items)
      setCollaborators(collabRes.items)
    })
  }, [open, orgId, documentId, projectId])

  const handleShare = async () => {
    if (!selectedUser) return
    setLoading(true)
    try {
      await collaborationService.shareDocument(orgId, documentId, {
        user_id: selectedUser,
        role,
        project_id: projectId,
      })
      toast.success('Document shared')
      const collabRes = await collaborationService.listCollaborators(orgId, documentId, projectId)
      setCollaborators(collabRes.items)
      setSelectedUser('')
    } catch (err) {
      const msg = err instanceof ApiError ? err.problem.detail : 'Failed to share document'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (userId: string) => {
    if (!canManageCollaborators) return
    try {
      await collaborationService.removeCollaborator(orgId, documentId, userId, projectId)
      setCollaborators((prev) => prev.filter((c) => c.user_id !== userId))
      toast.success('Collaborator removed')
    } catch (err) {
      const msg = err instanceof ApiError ? err.problem.detail : 'Failed to remove collaborator'
      toast.error(msg)
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
          <div className="space-y-2 pt-2 border-t border-neutral-200">
            <Typography weight="medium">Current collaborators</Typography>
            {collaborators.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-2">
                <Typography variant="small">
                  {c.display_name || c.email || c.user_id} — {c.role}
                </Typography>
                {canManageCollaborators && (
                  <Button variant="ghost" size="sm" onClick={() => void handleRemove(c.user_id)}>
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
