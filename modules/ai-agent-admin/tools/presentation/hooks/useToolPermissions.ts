'use client'

import { useMemo } from 'react'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { hasPermission, PERMISSIONS } from '@/modules/permissions/access/lib/permissions'
import { useEffectivePermissions } from '@/modules/permissions/access/hooks/useEffectivePermissions'

export function useCanViewTools() {
  const { workspaces, currentWorkspaceId } = useAuth()
  const orgId =
    workspaces.find((w) => w.id === currentWorkspaceId)?.organizationId ??
    workspaces[0]?.organizationId ??
    null
  const { permissions } = useEffectivePermissions(orgId)

  return useMemo(() => {
    if (!permissions) return true
    if (
      hasPermission(permissions, PERMISSIONS.AI_TOOL_VIEW) ||
      hasPermission(permissions, PERMISSIONS.AI_TOOL_MANAGE)
    ) {
      return true
    }
    const hasWave5 = permissions.permissions.some((p) => p.startsWith('AI_TOOL'))
    return !hasWave5
  }, [permissions])
}

export function useCanManageTools() {
  const { workspaces, currentWorkspaceId } = useAuth()
  const orgId =
    workspaces.find((w) => w.id === currentWorkspaceId)?.organizationId ??
    workspaces[0]?.organizationId ??
    null
  const { permissions } = useEffectivePermissions(orgId)

  return useMemo(() => {
    if (!permissions) return true
    if (hasPermission(permissions, PERMISSIONS.AI_TOOL_MANAGE)) return true
    const hasWave5 = permissions.permissions.some((p) => p.startsWith('AI_TOOL'))
    return !hasWave5
  }, [permissions])
}
