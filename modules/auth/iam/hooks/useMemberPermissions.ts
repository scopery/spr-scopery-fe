'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as api from '../api/member-permissions.api'
import type { MemberPermissionCatalogItem } from '../model/member-permissions'
import { ApiError } from '@/shared/lib/api-types'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export type MemberPermissionsScope =
  | { kind: 'workspace'; workspaceId: string }
  | { kind: 'organization'; organizationId: string }
  | { kind: 'project'; projectId: string }

function scopeKeyOf(scope: MemberPermissionsScope | null): string {
  if (scope == null) return ''
  if (scope.kind === 'workspace') return `ws:${scope.workspaceId}`
  if (scope.kind === 'organization') return `org:${scope.organizationId}`
  return `project:${scope.projectId}`
}

async function fetchCatalog(scope: MemberPermissionsScope) {
  if (scope.kind === 'workspace') {
    return api.getWorkspaceMemberPermissionsCatalog(scope.workspaceId)
  }
  if (scope.kind === 'organization') {
    return api.getOrganizationMemberPermissionsCatalog(scope.organizationId)
  }
  return api.getProjectMemberPermissionsCatalog(scope.projectId)
}

async function fetchSnapshot(scope: MemberPermissionsScope, userId: string) {
  if (scope.kind === 'workspace') {
    return api.getWorkspaceMemberPermissionsSnapshot(scope.workspaceId, userId)
  }
  if (scope.kind === 'organization') {
    return api.getOrganizationMemberPermissionsSnapshot(scope.organizationId, userId)
  }
  return api.getProjectMemberPermissionsSnapshot(scope.projectId, userId)
}

async function replacePermissions(
  scope: MemberPermissionsScope,
  userId: string,
  permissionActionIds: string[]
) {
  const body = { permissionActionIds }
  if (scope.kind === 'workspace') {
    return api.replaceWorkspaceMemberPermissions(scope.workspaceId, userId, body)
  }
  if (scope.kind === 'organization') {
    return api.replaceOrganizationMemberPermissions(scope.organizationId, userId, body)
  }
  return api.replaceProjectMemberPermissions(scope.projectId, userId, body)
}

export function useMemberPermissionsCatalog(scope: MemberPermissionsScope | null) {
  const [items, setItems] = useState<MemberPermissionCatalogItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const scopeKey = scopeKeyOf(scope)

  const load = useCallback(async () => {
    if (!scopeKey || !scope) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await fetchCatalog(scope)
      setItems(res.items ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true)
        setError(getProblemToastMessage(err))
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load permissions')
      }
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [scope, scopeKey])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, forbidden, refetch: load }
}

export function useMemberPermissionsEditor(
  scope: MemberPermissionsScope | null,
  userId: string | null
) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [baseline, setBaseline] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scopeKey = scopeKeyOf(scope)

  const load = useCallback(async () => {
    if (!scopeKey || !scope || !userId) {
      setSelected(new Set())
      setBaseline(new Set())
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetchSnapshot(scope, userId)
      const next = new Set(res.permissionActionIds ?? [])
      setSelected(next)
      setBaseline(new Set(next))
    } catch (err) {
      setError(getProblemToastMessage(err))
      setSelected(new Set())
      setBaseline(new Set())
    } finally {
      setLoading(false)
    }
  }, [scope, scopeKey, userId])

  useEffect(() => {
    void load()
  }, [load])

  const isDirty = useMemo(() => {
    if (selected.size !== baseline.size) return true
    for (const id of selected) {
      if (!baseline.has(id)) return true
    }
    return false
  }, [selected, baseline])

  const toggle = (permissionActionId: string, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (checked) next.add(permissionActionId)
      else next.delete(permissionActionId)
      return next
    })
  }

  const setMany = (permissionActionIds: string[], checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev)
      for (const id of permissionActionIds) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
  }

  const save = useCallback(async () => {
    if (!scope || !userId) return
    setSaving(true)
    setError(null)
    try {
      const res = await replacePermissions(scope, userId, Array.from(selected))
      const next = new Set(res.permissionActionIds ?? [])
      setSelected(next)
      setBaseline(new Set(next))
    } catch (err) {
      setError(getProblemToastMessage(err))
      throw err
    } finally {
      setSaving(false)
    }
  }, [scope, userId, selected])

  return { selected, loading, saving, error, isDirty, toggle, setMany, save, refetch: load }
}
