'use client'

import { Shield } from 'lucide-react'

import { useState } from 'react'
import { Button, Stack, Typography, Badge, Select } from '@/shared/ui'
import { IamSearchField } from '../IamSearchField'
import { iamAuthorizationApi } from '@/modules/auth/iam'
import type { AuthorizationCheckResult } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { IamScopeReferenceSelect } from '../IamScopeReferenceSelect'

const RESOURCE_TYPE_OPTIONS = ['GLOBAL', 'ORGANIZATION', 'WORKSPACE', 'PROJECT'].map((value) => ({
  value,
  label: value,
}))

export function IamAuthCheckPanel() {
  const [permissionCode, setPermissionCode] = useState('SYSTEM_IAM_MANAGEMENT')
  const [actionCode, setActionCode] = useState('VIEW_USER')
  const [resourceType, setResourceType] = useState('GLOBAL')
  const [resourceRefId, setResourceRefId] = useState('')
  const [checking, setChecking] = useState(false)
  const [result, setResult] = useState<AuthorizationCheckResult | null>(null)

  const check = async () => {
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
  }

  return (
    <Stack direction="vertical" spacing="md" className="max-w-md">
      <Typography as="p" variant="small" tone="muted">
        Check permission/action for the current user. GLOBAL does not need resourceRefId.
      </Typography>
      <IamSearchField
        placeholder="permissionCode"
        value={permissionCode}
        onChange={(e) => setPermissionCode(e.target.value)}
        className="w-full max-w-md"
      />
      <IamSearchField
        placeholder="actionCode"
        value={actionCode}
        onChange={(e) => setActionCode(e.target.value)}
        className="w-full max-w-md"
      />
      <Select
        value={resourceType}
        options={RESOURCE_TYPE_OPTIONS}
        onValueChange={(next: string) => {
          setResourceType(next)
          setResourceRefId('')
        }}
      />
      <IamScopeReferenceSelect
        resourceType={resourceType}
        value={resourceRefId}
        optional
        onChange={setResourceRefId}
      />
      <Button
        variant="primary"
        disabled={checking}
        onClick={() => void check()}
        icon={<Shield size={16} />}
      >
        Check authorization
      </Button>
      {result && (
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          <Stack direction="horizontal" spacing="sm" className="items-center">
            <Typography as="span" size="sm" weight="medium">
              Result:
            </Typography>
            <Badge tone={result.allowed ? 'success' : 'error'}>
              {result.allowed ? 'ALLOWED' : 'DENIED'}
            </Badge>
          </Stack>
          {(result.reason || result.explanation) && (
            <Typography as="p" variant="small" className="mt-2 text-neutral-600">
              {result.explanation ?? result.reason}
            </Typography>
          )}
        </div>
      )}
    </Stack>
  )
}
