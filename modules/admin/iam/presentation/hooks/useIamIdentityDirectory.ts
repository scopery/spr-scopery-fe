'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { iamResourcesApi, iamRolesApi, iamUsersApi } from '@/modules/auth/iam'
import type { IamResource, IamRole, IamUser } from '@/modules/auth/iam'
import { getWorkspace } from '@/modules/org/workspace'
import type { WorkspaceDetail } from '@/modules/org/workspace'

interface UseIamIdentityDirectoryParams {
  userIds?: Array<string | null | undefined>
  roleIds?: Array<string | null | undefined>
  resourceIds?: Array<string | null | undefined>
  workspaceIds?: Array<string | null | undefined>
}

function uniqIds(values: Array<string | null | undefined> = []): string[] {
  return [...new Set(values.map((value) => value?.trim()).filter(Boolean) as string[])]
}

export function useIamIdentityDirectory({
  userIds = [],
  roleIds = [],
  resourceIds = [],
  workspaceIds = [],
}: UseIamIdentityDirectoryParams) {
  const [usersById, setUsersById] = useState<Record<string, IamUser>>({})
  const [rolesById, setRolesById] = useState<Record<string, IamRole>>({})
  const [resourcesById, setResourcesById] = useState<Record<string, IamResource>>({})
  const [workspacesById, setWorkspacesById] = useState<Record<string, WorkspaceDetail>>({})
  const failedUserIdsRef = useRef<Set<string>>(new Set())
  const failedRoleIdsRef = useRef<Set<string>>(new Set())
  const failedResourceIdsRef = useRef<Set<string>>(new Set())
  const failedWorkspaceIdsRef = useRef<Set<string>>(new Set())

  const normalizedUserIds = useMemo(() => uniqIds(userIds), [JSON.stringify(uniqIds(userIds))])
  const normalizedRoleIds = useMemo(() => uniqIds(roleIds), [JSON.stringify(uniqIds(roleIds))])
  const normalizedResourceIds = useMemo(
    () => uniqIds(resourceIds),
    [JSON.stringify(uniqIds(resourceIds))]
  )
  const normalizedWorkspaceIds = useMemo(
    () => uniqIds(workspaceIds),
    [JSON.stringify(uniqIds(workspaceIds))]
  )
  const normalizedUserIdsKey = normalizedUserIds.join('|')
  const normalizedRoleIdsKey = normalizedRoleIds.join('|')
  const normalizedResourceIdsKey = normalizedResourceIds.join('|')
  const normalizedWorkspaceIdsKey = normalizedWorkspaceIds.join('|')

  useEffect(() => {
    const missingIds = normalizedUserIds.filter((id) => !usersById[id] && !failedUserIdsRef.current.has(id))
    if (!missingIds.length) return
    let cancelled = false

    const load = async () => {
      const results = await Promise.all(
        missingIds.map(async (id) => {
          try {
            return await iamUsersApi.getUser(id)
          } catch {
            return null
          }
        })
      )
      if (cancelled) return
      setUsersById((prev) => {
        const next = { ...prev }
        results.forEach((item, index) => {
          if (item) {
            next[item.id] = item
            failedUserIdsRef.current.delete(item.id)
            return
          }

          failedUserIdsRef.current.add(missingIds[index])
        })
        return next
      })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [normalizedUserIdsKey, usersById])

  useEffect(() => {
    const missingIds = normalizedRoleIds.filter((id) => !rolesById[id] && !failedRoleIdsRef.current.has(id))
    if (!missingIds.length) return
    let cancelled = false

    const load = async () => {
      const results = await Promise.all(
        missingIds.map(async (id) => {
          try {
            return await iamRolesApi.getRole(id)
          } catch {
            return null
          }
        })
      )
      if (cancelled) return
      setRolesById((prev) => {
        const next = { ...prev }
        results.forEach((item, index) => {
          if (item) {
            next[item.id] = item
            failedRoleIdsRef.current.delete(item.id)
            return
          }

          failedRoleIdsRef.current.add(missingIds[index])
        })
        return next
      })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [normalizedRoleIdsKey, rolesById])

  useEffect(() => {
    const missingIds = normalizedResourceIds.filter(
      (id) => !resourcesById[id] && !failedResourceIdsRef.current.has(id)
    )
    if (!missingIds.length) return
    let cancelled = false

    const load = async () => {
      const results = await Promise.all(
        missingIds.map(async (id) => {
          try {
            return await iamResourcesApi.getResource(id)
          } catch {
            return null
          }
        })
      )
      if (cancelled) return
      setResourcesById((prev) => {
        const next = { ...prev }
        results.forEach((item, index) => {
          if (item) {
            next[item.id] = item
            failedResourceIdsRef.current.delete(item.id)
            return
          }

          failedResourceIdsRef.current.add(missingIds[index])
        })
        return next
      })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [normalizedResourceIdsKey, resourcesById])

  useEffect(() => {
    const missingIds = normalizedWorkspaceIds.filter(
      (id) => !workspacesById[id] && !failedWorkspaceIdsRef.current.has(id)
    )
    if (!missingIds.length) return
    let cancelled = false

    const load = async () => {
      const results = await Promise.all(
        missingIds.map(async (id) => {
          try {
            return await getWorkspace(id)
          } catch {
            return null
          }
        })
      )
      if (cancelled) return
      setWorkspacesById((prev) => {
        const next = { ...prev }
        results.forEach((item, index) => {
          if (item) {
            next[item.id] = item
            failedWorkspaceIdsRef.current.delete(item.id)
            return
          }

          failedWorkspaceIdsRef.current.add(missingIds[index])
        })
        return next
      })
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [normalizedWorkspaceIdsKey, workspacesById])

  return {
    usersById,
    rolesById,
    resourcesById,
    workspacesById,
  }
}
