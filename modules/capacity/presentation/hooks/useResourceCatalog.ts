'use client'

import { useCallback, useEffect, useState } from 'react'
import * as catalogApi from '../../infrastructure/api/resource-catalog.api'
import type {
  CreateResourceRolePayload,
  CreateResourceSkillPayload,
  ResourceRole,
  ResourceSkill,
} from '../../domain/model/resource-catalog'

export function useResourceCatalog(workspaceId: string | null) {
  const [roles, setRoles] = useState<ResourceRole[]>([])
  const [skills, setSkills] = useState<ResourceSkill[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creatingRole, setCreatingRole] = useState(false)
  const [creatingSkill, setCreatingSkill] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [roleList, skillList] = await Promise.all([
        catalogApi.listResourceRoles(workspaceId),
        catalogApi.listResourceSkills(workspaceId),
      ])
      setRoles(roleList)
      setSkills(skillList)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resource catalog')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const createRole = useCallback(
    async (body: CreateResourceRolePayload) => {
      if (!workspaceId) return
      setCreatingRole(true)
      try {
        await catalogApi.createResourceRole(workspaceId, body)
        await load()
      } finally {
        setCreatingRole(false)
      }
    },
    [workspaceId, load]
  )

  const createSkill = useCallback(
    async (body: CreateResourceSkillPayload) => {
      if (!workspaceId) return
      setCreatingSkill(true)
      try {
        await catalogApi.createResourceSkill(workspaceId, body)
        await load()
      } finally {
        setCreatingSkill(false)
      }
    },
    [workspaceId, load]
  )

  return {
    roles,
    skills,
    loading,
    error,
    creatingRole,
    creatingSkill,
    refetch: load,
    createRole,
    createSkill,
  }
}
