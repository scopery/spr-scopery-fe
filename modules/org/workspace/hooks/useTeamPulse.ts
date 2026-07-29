'use client'

import { useMemo } from 'react'
import { usePhaseWatch } from '@/modules/projects/phase'
import { flattenUnassignedTasks } from '../domain/rules/portfolio.rules'
import type { MemberDailySummary } from '../model/workspace-daily-summary'
import { useWorkspaceDailySummary } from './useWorkspaceDailySummary'
import { useWorkspaceMembers } from './useWorkspaceMembers'

export type MemberPulseStatus = 'working' | 'available'

export interface MemberPulseRow {
  userId: string
  status: MemberPulseStatus
  done: MemberDailySummary['done']
  inProgress: MemberDailySummary['inProgress']
}

export interface TeamPulseSummary {
  totalMembers: number
  working: number
  available: number
  doneToday: number
  unassignedCount: number
}

function deriveStatus(summary: MemberDailySummary | undefined): MemberPulseStatus {
  return summary && summary.inProgress.length > 0 ? 'working' : 'available'
}

export function useTeamPulse(workspaceId: string, date: string) {
  const {
    data: dailySummary,
    loading: summaryLoading,
    error,
    refetch,
  } = useWorkspaceDailySummary(workspaceId, date)

  const { members: workspaceMembers, loading: membersLoading } = useWorkspaceMembers(workspaceId)
  const phaseWatch = usePhaseWatch(workspaceId)

  const memberRows = useMemo((): MemberPulseRow[] => {
    if (!workspaceMembers.length) return []
    const summaryMap = new Map<string, MemberDailySummary>(
      (dailySummary?.members ?? []).map((m) => [m.userId, m])
    )
    return workspaceMembers.map((member): MemberPulseRow => {
      const summary = summaryMap.get(member.userId)
      return {
        userId: member.userId,
        status: deriveStatus(summary),
        done: summary?.done ?? [],
        inProgress: summary?.inProgress ?? [],
      }
    })
  }, [workspaceMembers, dailySummary])

  const unassignedTasks = useMemo(
    () => flattenUnassignedTasks(phaseWatch.allRows),
    [phaseWatch.allRows]
  )

  const pulseSummary = useMemo((): TeamPulseSummary => {
    const working = memberRows.filter((r) => r.status === 'working').length
    const doneToday = memberRows.reduce((sum, r) => sum + r.done.length, 0)
    return {
      totalMembers: memberRows.length,
      working,
      available: memberRows.length - working,
      doneToday,
      unassignedCount: unassignedTasks.length,
    }
  }, [memberRows, unassignedTasks])

  return {
    memberRows,
    pulseSummary,
    unassignedTasks,
    members: workspaceMembers,
    loading: summaryLoading || membersLoading,
    phaseWatchLoading: phaseWatch.loading,
    error,
    refetch,
    refetchPhaseWatch: phaseWatch.refetch,
  }
}
