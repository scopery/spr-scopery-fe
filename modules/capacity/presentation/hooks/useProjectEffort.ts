'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as effortApi from '../../infrastructure/api/effort.api'
import { listWorkspaceMembers } from '@/modules/org/workspace'
import { useResolveUsers } from '@/modules/platform'
import { ActualEffortStatus } from '../../domain/model/effort'
import type {
  ActualEffortRecord,
  CreateActualEffortPayload,
  CreateEffortEstimatePayload,
  EffortEstimate,
  WorkloadSnapshot,
} from '../../domain/model/effort'

export type EffortViewTab = 'register' | 'snapshots'

export function useProjectEffort(projectId: string | null, workspaceId: string | null) {
  const [tab, setTab] = useState<EffortViewTab>('register')
  const [estimates, setEstimates] = useState<EffortEstimate[]>([])
  const [actuals, setActuals] = useState<ActualEffortRecord[]>([])
  const [snapshots, setSnapshots] = useState<WorkloadSnapshot[]>([])
  const [members, setMembers] = useState<{ id: string; userId: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const memberUserIds = useMemo(() => members.map((m) => m.userId), [members])
  const { labelFor, personFor } = useResolveUsers(memberUserIds)
  const memberOptions = useMemo(
    () =>
      members.flatMap((member) => {
        const person = personFor(member.userId)
        return person ? [{ value: member.id, person }] : []
      }),
    [members, personFor]
  )

  const load = useCallback(async () => {
    if (!projectId) return
    setLoading(true)
    setError(null)
    try {
      const [est, act, snaps] = await Promise.all([
        effortApi.listEffortEstimates(projectId),
        effortApi.listActualEffort(projectId),
        effortApi.listWorkloadSnapshots(projectId),
      ])
      setEstimates(est)
      setActuals(act)
      setSnapshots(snaps)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load effort data')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!workspaceId) return
    void listWorkspaceMembers(workspaceId, { page: 0, size: 100 }).then((res) =>
      setMembers(res.items.map((m) => ({ id: m.id, userId: m.userId })))
    )
  }, [workspaceId])

  const createEstimate = useCallback(
    async (body: CreateEffortEstimatePayload) => {
      if (!projectId) return
      setSaving(true)
      try {
        await effortApi.createEffortEstimate(projectId, body)
        await load()
      } finally {
        setSaving(false)
      }
    },
    [projectId, load]
  )

  const createActual = useCallback(
    async (body: CreateActualEffortPayload) => {
      if (!projectId) return
      setSaving(true)
      try {
        await effortApi.createActualEffort(projectId, body)
        await load()
      } finally {
        setSaving(false)
      }
    },
    [projectId, load]
  )

  const cancelActual = useCallback(
    async (recordId: string) => {
      if (!projectId) return
      await effortApi.cancelActualEffort(projectId, recordId)
      await load()
    },
    [projectId, load]
  )

  const takeSnapshot = useCallback(async () => {
    if (!projectId) return
    setSaving(true)
    try {
      await effortApi.createWorkloadSnapshot(projectId, {
        snapshotDate: new Date().toISOString().slice(0, 10),
      })
      await load()
    } finally {
      setSaving(false)
    }
  }, [projectId, load])

  const memberLabel = useCallback(
    (memberId: string) => {
      const m = members.find((x) => x.id === memberId)
      return m ? labelFor(m.userId) : memberId.slice(0, 8)
    },
    [members, labelFor]
  )

  const activeActuals = actuals.filter((a) => a.status !== ActualEffortStatus.Cancelled)

  return {
    tab,
    setTab,
    estimates,
    actuals,
    activeActuals,
    snapshots,
    members,
    memberOptions,
    loading,
    error,
    saving,
    refetch: load,
    createEstimate,
    createActual,
    cancelActual,
    takeSnapshot,
    memberLabel,
    ActualEffortStatus,
  }
}
