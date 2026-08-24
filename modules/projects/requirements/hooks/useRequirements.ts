'use client'

import { useCallback, useEffect, useState } from 'react'
import * as requirementsApi from '../api/requirements.api'
import type {
  CreateRequirementPayload,
  Requirement,
  UpdateRequirementPayload,
} from '../model/requirements'
import {
  normalizeRequirementStatus,
  RequirementStatus,
  type RequirementStatus as RequirementStatusValue,
} from '../model/requirement-status'
import type { BulkJobResponse } from '@/shared/lib/bulkJobs'

const PAGE_SIZE = 50

export function useRequirements(orgId: string | null, projectId: string | null) {
  const [requirements, setRequirements] = useState<Requirement[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState('createdAt,asc')
  const [offset, setOffset] = useState(0)

  const load = useCallback(async () => {
    if (!orgId || !projectId) return
    setLoading(true)
    setError(null)
    try {
      const res = await requirementsApi.listRequirements(orgId, projectId, {
        limit: PAGE_SIZE,
        offset,
        includeArchived: true,
        sort,
      })
      setRequirements(res.items)
      setTotal(res.page?.total ?? res.items.length)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requirements')
    } finally {
      setLoading(false)
    }
  }, [orgId, projectId, offset, sort])

  useEffect(() => {
    void load()
  }, [load])

  const createRequirement = useCallback(
    async (body: CreateRequirementPayload, opts?: { quiet?: boolean }) => {
      if (!orgId || !projectId) return null
      const created = await requirementsApi.createRequirement(orgId, projectId, body)
      if (opts?.quiet) {
        setRequirements((prev) => [...prev, created])
      } else {
        await load()
      }
      return created
    },
    [orgId, projectId, load]
  )

  const updateRequirement = useCallback(
    async (requirementId: string, body: UpdateRequirementPayload) => {
      if (!orgId || !projectId) return null
      const updated = await requirementsApi.updateRequirement(
        orgId,
        projectId,
        requirementId,
        body
      )
      setRequirements((prev) =>
        prev.map((r) => {
          if (r.id !== requirementId) return r
          const next: Requirement = {
            ...r,
            ...updated,
            title: updated.title ?? body.title ?? r.title,
            code: updated.code ?? body.code ?? r.code,
            description:
              updated.description !== undefined
                ? updated.description
                : body.description !== undefined
                  ? body.description
                  : r.description,
            priority: updated.priority ?? body.priority ?? r.priority,
            requirementType:
              updated.requirementType ?? body.requirementType ?? r.requirementType,
            status: updated.status ?? r.status,
          }
          // Keep legacy type aliases in sync when only requirementType is present.
          const typeSource = next.requirementType ?? next.req_type ?? next.type
          if (typeSource && !updated.req_type && !updated.type) {
            const t = String(typeSource).toUpperCase()
            if (t === 'FUNCTIONAL' || t === 'FR') {
              next.req_type = 'FR'
              next.type = 'FR'
            } else if (t === 'NON_FUNCTIONAL' || t === 'NFR') {
              next.req_type = 'NFR'
              next.type = 'NFR'
            } else if (t === 'BUSINESS' || t === 'BO' || t === 'BR') {
              next.req_type = 'BO'
              next.type = 'BO'
            }
          }
          return next
        })
      )
      return updated
    },
    [orgId, projectId]
  )

  const submitRequirementsBulk = useCallback(
    async (items: CreateRequirementPayload[]): Promise<BulkJobResponse> => {
      if (!orgId || !projectId) throw new Error('Missing project context')
      return requirementsApi.submitRequirementsBulk(orgId, projectId, items)
    },
    [orgId, projectId]
  )

  const archiveRequirement = useCallback(
    async (requirementId: string) => {
      if (!orgId || !projectId) return
      await requirementsApi.archiveRequirement(orgId, projectId, requirementId)
      setRequirements((prev) =>
        prev.map((r) =>
          r.id === requirementId ? { ...r, status: RequirementStatus.Archived } : r
        )
      )
    },
    [orgId, projectId]
  )

  const transitionRequirementStatus = useCallback(
    async (requirementId: string, status: RequirementStatusValue) => {
      if (!orgId || !projectId) return null
      const next = normalizeRequirementStatus(status)
      if (next === RequirementStatus.Archived) {
        await archiveRequirement(requirementId)
        return null
      }
      if (next === RequirementStatus.Draft) {
        throw new Error('Returning a requirement to Draft is not supported by the API')
      }
      const updated = await requirementsApi.transitionRequirementStatus(
        orgId,
        projectId,
        requirementId,
        next
      )
      const statusFromResponse =
        updated && typeof updated === 'object' && 'status' in updated
          ? normalizeRequirementStatus(updated.status)
          : next
      setRequirements((prev) =>
        prev.map((r) => {
          if (r.id !== requirementId) return r
          if (updated && typeof updated === 'object') {
            return {
              ...r,
              ...updated,
              status: statusFromResponse,
            }
          }
          return { ...r, status: statusFromResponse }
        })
      )
      return updated ?? null
    },
    [orgId, projectId, archiveRequirement]
  )

  return {
    requirements,
    total,
    loading,
    error,
    sort,
    setSort: (value: string) => { setSort(value); setOffset(0) },
    offset,
    setOffset,
    pageSize: PAGE_SIZE,
    refetch: load,
    createRequirement,
    updateRequirement,
    submitRequirementsBulk,
    archiveRequirement,
    transitionRequirementStatus,
  }
}
