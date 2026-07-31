'use client'

import { Shield } from 'lucide-react'

import React from 'react'
import { Typography, Button, Stack, Badge, Select } from '@/shared/ui'
import { IamSearchField } from './IamSearchField'
import { useIamAuthorizationCheck } from '../hooks/useIamAuthorizationCheck'
import { IamScopeReferenceSelect } from './IamScopeReferenceSelect'

const RESOURCE_TYPE_OPTIONS = ['GLOBAL', 'ORGANIZATION', 'WORKSPACE', 'PROJECT'].map((value) => ({
  value,
  label: value,
}))

export function AdminIamAuthorizationCheckView() {
  const {
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
  } = useIamAuthorizationCheck()

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Authorization check
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Check whether the current user is allowed a permission/action on a resource. GLOBAL does
          not need resourceRefId.
        </Typography>
      </div>

      <Stack direction="vertical" spacing="md" className="max-w-md">
        <IamSearchField
          placeholder="permissionCode (e.g. SYSTEM_IAM_MANAGEMENT)"
          value={permissionCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPermissionCode(e.target.value)}
          className="w-full max-w-md"
        />
        <IamSearchField
          placeholder="actionCode (e.g. VIEW_USER)"
          value={actionCode}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActionCode(e.target.value)}
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
          {checking ? 'Checking…' : 'Check authorization'}
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
    </div>
  )
}
