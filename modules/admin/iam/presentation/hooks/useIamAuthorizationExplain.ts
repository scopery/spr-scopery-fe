'use client'

import { useCallback, useState } from 'react'
import { iamAuthorizationApi } from '@/modules/auth/iam'
import type { AuthorizationExplainResult } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useIamAuthorizationExplain() {
  const [permissionCode, setPermissionCode] = useState('WORKSPACE_MANAGEMENT')
  const [actionCode, setActionCode] = useState('VIEW')
  const [resourceType, setResourceType] = useState('WORKSPACE')
  const [resourceRefId, setResourceRefId] = useState('')
  const [explaining, setExplaining] = useState(false)
  const [result, setResult] = useState<AuthorizationExplainResult | null>(null)

  const explain = useCallback(async () => {
    if (!permissionCode.trim() || !actionCode.trim() || !resourceType.trim()) {
      toast.error('permissionCode, actionCode, and resourceType are required')
      return
    }
    const type = resourceType.trim().toUpperCase()
    if (type !== 'GLOBAL' && !resourceRefId.trim()) {
      toast.error('resourceRefId is required for non-GLOBAL resources')
      return
    }
    setExplaining(true)
    setResult(null)
    try {
      const res = await iamAuthorizationApi.explainAuthorization({
        permissionCode: permissionCode.trim(),
        actionCode: actionCode.trim(),
        resourceType: type,
        resourceRefId: type === 'GLOBAL' ? undefined : resourceRefId.trim(),
      })
      setResult(res)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setExplaining(false)
    }
  }, [permissionCode, actionCode, resourceType, resourceRefId])

  return {
    permissionCode,
    setPermissionCode,
    actionCode,
    setActionCode,
    resourceType,
    setResourceType,
    resourceRefId,
    setResourceRefId,
    explaining,
    result,
    explain,
  }
}
