'use client'

import { useCallback, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as orgTeamsApi from '../api/org-teams.api'
import type { OrgTeam, OrgTeamMember, OrgTeamWorkspaceAssignment } from '../model'

export function useOrgTeamDetail(organizationId: string | null, teamId: string | null) {
  const [team, setTeam] = useState<OrgTeam | null>(null)
  const [members, setMembers] = useState<OrgTeamMember[]>([])
  const [assignments, setAssignments] = useState<OrgTeamWorkspaceAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!organizationId || !teamId) return
    setLoading(true)
    setError(null)
    try {
      const [teamRes, membersRes, assignmentsRes] = await Promise.all([
        orgTeamsApi.getOrgTeam(organizationId, teamId),
        orgTeamsApi.listOrgTeamMembers(organizationId, teamId, { page: 0, size: 100 }),
        orgTeamsApi.listOrgTeamWorkspaceAssignments(organizationId, teamId, {
          page: 0,
          size: 50,
        }),
      ])
      setTeam(teamRes)
      setMembers(membersRes.items)
      setAssignments(assignmentsRes.items)
    } catch (err) {
      setError(err instanceof ApiError ? err.problem.detail : 'Failed to load team')
    } finally {
      setLoading(false)
    }
  }, [organizationId, teamId])

  return { team, members, assignments, loading, error, load, refetch: load }
}
