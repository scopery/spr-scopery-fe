'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import * as collaborationApi from '../api/collaboration.api'
import type { DocumentCollaborator, MentionableUser } from '../model/collaboration'

interface UseShareDocumentOptions {
  open: boolean
  orgId: string
  documentId: string
  projectId?: string
  canManageCollaborators: boolean
}

export function useShareDocument({
  open,
  orgId,
  documentId,
  projectId,
  canManageCollaborators,
}: UseShareDocumentOptions) {
  const [users, setUsers] = useState<MentionableUser[]>([])
  const [collaborators, setCollaborators] = useState<DocumentCollaborator[]>([])
  const [loading, setLoading] = useState(false)

  const loadCollaborators = useCallback(async () => {
    const collabRes = await collaborationApi.listCollaborators(orgId, documentId, projectId)
    setCollaborators(collabRes.items)
  }, [orgId, documentId, projectId])

  const load = useCallback(async () => {
    if (!open) return
    try {
      const [usersRes, collabRes] = await Promise.all([
        collaborationApi.listMentionableUsers(orgId, { project_id: projectId }),
        collaborationApi.listCollaborators(orgId, documentId, projectId).catch(() => ({ items: [] })),
      ])
      setUsers(usersRes.items)
      setCollaborators(collabRes.items)
    } catch {
      toast.error('Failed to load sharing data')
    }
  }, [open, orgId, documentId, projectId])

  useEffect(() => {
    void load()
  }, [load])

  const shareDocument = useCallback(
    async (userId: string, role: 'viewer' | 'commenter' | 'editor') => {
      setLoading(true)
      try {
        await collaborationApi.shareDocument(orgId, documentId, {
          user_id: userId,
          role,
          project_id: projectId,
        })
        toast.success('Document shared')
        await loadCollaborators()
      } catch (err) {
        const msg = err instanceof ApiError ? err.problem.detail : 'Failed to share document'
        toast.error(msg)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [orgId, documentId, projectId, loadCollaborators]
  )

  const removeCollaborator = useCallback(
    async (userId: string) => {
      if (!canManageCollaborators) return
      try {
        await collaborationApi.removeCollaborator(orgId, documentId, userId, projectId)
        setCollaborators((prev) => prev.filter((c) => c.user_id !== userId))
        toast.success('Collaborator removed')
      } catch (err) {
        const msg = err instanceof ApiError ? err.problem.detail : 'Failed to remove collaborator'
        toast.error(msg)
      }
    },
    [canManageCollaborators, orgId, documentId, projectId]
  )

  return {
    users,
    collaborators,
    loading,
    shareDocument,
    removeCollaborator,
  }
}
