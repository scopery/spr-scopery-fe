'use client'

import { useMemo } from 'react'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { hasPermission, PERMISSIONS } from '@/modules/permissions/access/lib/permissions'
import { useEffectivePermissions } from '@/modules/permissions/access/hooks/useEffectivePermissions'

/** Soft gate for AI agent config manage (W5-GAP-14 provisional). */
export function useCanManageAiConfig() {
  const { workspaces, currentWorkspaceId } = useAuth()
  const orgId =
    workspaces.find((w) => w.id === currentWorkspaceId)?.organizationId ??
    workspaces[0]?.organizationId ??
    null
  const { permissions } = useEffectivePermissions(orgId)

  return useMemo(() => {
    if (!permissions) return true
    if (hasPermission(permissions, PERMISSIONS.AI_AGENT_CONFIG_MANAGE)) return true
    const hasWave5 = permissions.permissions.some((p) => p.startsWith('AI_AGENT_CONFIG'))
    return !hasWave5
  }, [permissions])
}
