'use client'

import { Shield } from 'lucide-react'

import React from 'react'
import { Typography, Button, Stack, Badge } from '@/shared/ui'
import { IamSearchField } from './IamSearchField'
import { useIamAuthorizationExplain } from '../hooks/useIamAuthorizationExplain'

export function AdminIamAuthorizationExplainView() {
  const {
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
  } = useIamAuthorizationExplain()

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Authorization explain
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Explain why access is allowed or denied for a permission/action on a resource.
        </Typography>
      </div>

      <Stack direction="vertical" spacing="md" className="max-w-md">
        <IamSearchField
          placeholder="permissionCode"
          value={permissionCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPermissionCode(e.target.value)}
          className="w-full max-w-md"
        />
        <IamSearchField
          placeholder="actionCode"
          value={actionCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActionCode(e.target.value)}
          className="w-full max-w-md"
        />
        <IamSearchField
          placeholder="resourceType (GLOBAL | WORKSPACE | ORGANIZATION)"
          value={resourceType}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResourceType(e.target.value)}
          className="w-full max-w-md"
        />
        <IamSearchField
          placeholder="resourceRefId (omit for GLOBAL)"
          value={resourceRefId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setResourceRefId(e.target.value)}
          className="w-full max-w-md"
        />
        <Button variant="primary" disabled={explaining} onClick={() => void explain()} icon={<Shield size={16} />}>
          {explaining ? 'Explaining…' : 'Explain authorization'}
        </Button>
      </Stack>

      {result && (
        <div className="mt-6 max-w-2xl space-y-4">
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
            {result.contributingGrantIds?.length ? (
              <Typography as="p" variant="small" className="mt-2 font-mono text-xs text-neutral-500">
                grants: {result.contributingGrantIds.join(', ')}
              </Typography>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
