'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as allocationsApi from '../../infrastructure/api/allocations.api'
import * as calcApi from '../../infrastructure/api/capacity-calculation.api'
import * as resourcesApi from '../../infrastructure/api/resources.api'
import * as projectsApi from '@/modules/projects/project/api/projects.api'
import * as workspaceMembersApi from '@/modules/org/workspace/api/workspace-members.api'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import {
  isAllocationPercentValid,
  isAllocationRangeValid,
  sumOverlappingAllocationPercent,
} from '../../domain/rules/capacity.rules'
import { AllocationType, CapacityEntityStatus } from '../../domain/enums/capacity.enum'
import type {
  CreateProjectAllocationPayload,
  ProjectResourceAllocation,
  UpdateProjectAllocationPayload,
} from '../../domain/model/project-allocation'
import type { OverAllocationItem } from '../../domain/model/capacity-overview'
import type { ResourceProfile } from '../../domain/model/resource-profile'

function defaultRange() {
  const from = new Date()
  from.setDate(1)
  const to = new Date(from)
  to.setMonth(to.getMonth() + 3)
  to.setDate(0)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return { fromDate: fmt(from), toDate: fmt(to) }
}

export function useAllocationPlanner(workspaceId: string | null) {
  const initial = useMemo(() => defaultRange(), [])
  const [fromDate, setFromDate] = useState(initial.fromDate)
  const [toDate, setToDate] = useState(initial.toDate)
  const [projectFilter, setProjectFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<string>(CapacityEntityStatus.Active)

  const [allocations, setAllocations] = useState<ProjectResourceAllocation[]>([])
  const [overAllocations, setOverAllocations] = useState<OverAllocationItem[]>([])
  const [resources, setResources] = useState<ResourceProfile[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string; code: string }[]>([])
  const [members, setMembers] = useState<{ id: string; userId: string }[]>([])

  const memberUserIds = useMemo(() => members.map((m) => m.userId), [members])
  const { labelFor } = useResolveUsers(memberUserIds)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [allocRes, over, profiles, projectRes, memberRes] = await Promise.all([
        allocationsApi.listProjectAllocations({
          workspaceId,
          projectId: projectFilter === 'ALL' ? undefined : projectFilter,
          status:
            statusFilter === 'ALL' ? undefined : (statusFilter as CapacityEntityStatus),
          page: 0,
          size: 200,
        }),
        calcApi.listOverAllocations({ workspaceId, fromDate, toDate }),
        resourcesApi.listResourceProfiles(workspaceId),
        projectsApi.listProjects(workspaceId, { page: 0, size: 100 }),
        workspaceMembersApi.listWorkspaceMembers(workspaceId, { page: 0, size: 100 }),
      ])
      setAllocations(allocRes.items)
      setOverAllocations(over)
      setResources(profiles)
      setProjects(
        projectRes.items.map((p) => ({
          id: p.id,
          name: p.name,
          code: p.code,
        }))
      )
      setMembers(memberRes.items.map((m) => ({ id: m.id, userId: m.userId })))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load allocations')
    } finally {
      setLoading(false)
    }
  }, [workspaceId, projectFilter, statusFilter, fromDate, toDate])

  useEffect(() => {
    void load()
  }, [load])

  const selected = allocations.find((a) => a.id === selectedId) ?? null

  const visibleAllocations = useMemo(() => {
    return allocations.filter((a) => a.startDate <= toDate && a.endDate >= fromDate)
  }, [allocations, fromDate, toDate])

  const groupedByMember = useMemo(() => {
    const map = new Map<string, ProjectResourceAllocation[]>()
    for (const a of visibleAllocations) {
      const list = map.get(a.workspaceMemberId) ?? []
      list.push(a)
      map.set(a.workspaceMemberId, list)
    }
    return Array.from(map.entries()).map(([memberId, items]) => ({
      memberId,
      items: items.sort((a, b) => a.startDate.localeCompare(b.startDate)),
      totalPercent: items
        .filter((i) => i.status === CapacityEntityStatus.Active)
        .reduce((s, i) => s + i.allocationPercent, 0),
    }))
  }, [visibleAllocations])

  const projectName = useCallback(
    (projectId: string) => {
      const p = projects.find((x) => x.id === projectId)
      return p ? `${p.name} (${p.code})` : projectId.slice(0, 8)
    },
    [projects]
  )

  const memberLabel = useCallback(
    (memberId: string) => {
      const resource = resources.find((r) => r.linkedWorkspaceMemberId === memberId)
      if (resource) return resource.displayName
      const member = members.find((m) => m.id === memberId)
      return member ? labelFor(member.userId) : memberId.slice(0, 8)
    },
    [resources, members, labelFor]
  )

  const validateCreate = useCallback(
    (body: CreateProjectAllocationPayload): string | null => {
      if (!isAllocationPercentValid(body.allocationPercent)) {
        return 'Allocation percent must be greater than 0'
      }
      if (!isAllocationRangeValid(body.startDate, body.endDate)) {
        return 'End date must be on or after start date'
      }
      const overlapping = sumOverlappingAllocationPercent(
        allocations,
        body.workspaceMemberId,
        body.startDate,
        body.endDate
      )
      if (overlapping + body.allocationPercent > 100) {
        return `Warning: total allocation would be ${overlapping + body.allocationPercent}% in this period`
      }
      return null
    },
    [allocations]
  )

  const createAllocation = useCallback(
    async (body: CreateProjectAllocationPayload) => {
      if (!workspaceId) return
      setSaving(true)
      try {
        const created = await allocationsApi.createProjectAllocation(workspaceId, body)
        await load()
        setSelectedId(created.id)
      } finally {
        setSaving(false)
      }
    },
    [workspaceId, load]
  )

  const updateAllocation = useCallback(
    async (allocationId: string, body: UpdateProjectAllocationPayload) => {
      setSaving(true)
      try {
        await allocationsApi.updateProjectAllocation(allocationId, body)
        await load()
      } finally {
        setSaving(false)
      }
    },
    [load]
  )

  const activate = useCallback(
    async (allocationId: string) => {
      await allocationsApi.activateProjectAllocation(allocationId)
      await load()
    },
    [load]
  )

  const deactivate = useCallback(
    async (allocationId: string) => {
      await allocationsApi.deactivateProjectAllocation(allocationId)
      await load()
    },
    [load]
  )

  const archive = useCallback(
    async (allocationId: string) => {
      await allocationsApi.archiveProjectAllocation(allocationId)
      await load()
      setSelectedId((id) => (id === allocationId ? null : id))
    },
    [load]
  )

  return {
    fromDate,
    toDate,
    setFromDate,
    setToDate,
    projectFilter,
    setProjectFilter,
    statusFilter,
    setStatusFilter,
    allocations: visibleAllocations,
    groupedByMember,
    overAllocations,
    projects,
    members,
    resources,
    selected,
    selectedId,
    setSelectedId,
    loading,
    error,
    saving,
    refetch: load,
    projectName,
    memberLabel,
    validateCreate,
    createAllocation,
    updateAllocation,
    activate,
    deactivate,
    archive,
    AllocationType,
    CapacityEntityStatus,
  }
}
