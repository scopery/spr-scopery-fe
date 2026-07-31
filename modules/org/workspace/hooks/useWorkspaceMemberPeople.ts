'use client'

import { useMemo } from 'react'
import { useResolveUsers, type PersonIdentity } from '@/modules/platform'
import { useWorkspaceMembers } from './useWorkspaceMembers'

/** Active workspace members resolved into searchable user identities. */
export function useWorkspaceMemberPeople(workspaceId: string | null) {
  const { members, loading: loadingMembers, error } = useWorkspaceMembers(workspaceId)
  const activeMembers = useMemo(
    () => members.filter((member) => member.status.toUpperCase() === 'ACTIVE'),
    [members]
  )
  const userIds = useMemo(() => activeMembers.map((member) => member.userId), [activeMembers])
  const { personFor, loadingIds } = useResolveUsers(userIds)
  const people = useMemo(
    () =>
      activeMembers
        .map((member) => personFor(member.userId))
        .filter((person): person is PersonIdentity => Boolean(person)),
    [activeMembers, personFor]
  )

  return {
    people,
    loading: loadingMembers || loadingIds.length > 0,
    error,
  }
}
