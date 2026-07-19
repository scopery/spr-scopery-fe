'use client'

import { useCallback, useState } from 'react'
import { iamAuthorizationApi } from '@/modules/auth/iam'
import type { AuthorizationCheckResult } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useIamAuthorizationCheck() {
  const [permissionCode, setPermissionCode] = useState('SYSTEM_IAM_MANAGEMENT')
  const [actionCode, setActionCode] = useState('VIEW_USER')
  const [resourceType, setResourceType] = useState('GLOBAL')
  const [resourceRefId, setResourceRefId] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<AuthorizationCheckResult | null>(null)

  const check = useCallback(async () => {
    if (!permissionCode.trim() || !actionCode.trim() || !resourceType.trim()) {
      toast.error('permissionCode, actionCode, and resourceType are required')
      return
    }
    const type = resourceType.trim().toUpperCase()
    if (type !== 'GLOBAL' && !resourceRefId.trim()) {
      toast.error('resourceRefId is required for non-GLOBAL resources')
      return
    }
    setChecking(true)
    setResult(null)
    try {
      const res = await iamAuthorizationApi.checkAuthorization({
        permissionCode: permissionCode.trim(),
        actionCode: actionCode.trim(),
        resourceType: type,
        resourceRefId: type === 'GLOBAL' ? undefined : resourceRefId.trim(),
      })
      setResult(res)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setChecking(false)
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
    checking,
    result,
    check,
  }
}
