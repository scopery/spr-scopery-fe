'use client'

import { useWorkspaceMemberPeople } from '@/modules/org/workspace'

export function useQualityAssigneePeople(workspaceId: string | null) {
  return useWorkspaceMemberPeople(workspaceId)
}
