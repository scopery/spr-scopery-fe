'use client'

import { useState } from 'react'
import { Typography } from '@/shared/ui'
import { AdminOrganizationSearchSelect } from '@/modules/admin/organizations'
import { AdminWorkspaceSearchSelect } from '@/modules/admin/workspaces'
import { ProjectSearchSelect } from '@/modules/projects'

interface IamScopeReferenceSelectProps {
  resourceType: string
  value: string
  onChange: (resourceRefId: string) => void
  optional?: boolean
}

export function IamScopeReferenceSelect({
  resourceType,
  value,
  onChange,
  optional = false,
}: IamScopeReferenceSelectProps) {
  const [projectWorkspaceId, setProjectWorkspaceId] = useState('')
  const normalized = resourceType.toUpperCase()

  if (normalized === 'GLOBAL' || normalized === 'SYSTEM' || !normalized) {
    return (
      <Typography variant="caption" tone="muted">
        This scope does not require a resource reference.
      </Typography>
    )
  }

  if (normalized === 'ORG' || normalized === 'ORGANIZATION') {
    return (
      <AdminOrganizationSearchSelect
        optional={optional}
        label="Organization"
        value={value}
        onChange={onChange}
      />
    )
  }

  if (normalized === 'WORKSPACE') {
    return <AdminWorkspaceSearchSelect optional={optional} value={value} onChange={onChange} />
  }

  if (normalized === 'PROJECT') {
    return (
      <div className="space-y-sm">
        <AdminWorkspaceSearchSelect
          label="Project workspace"
          value={projectWorkspaceId}
          onChange={(workspaceId) => {
            setProjectWorkspaceId(workspaceId)
            onChange('')
          }}
        />
        <ProjectSearchSelect
          workspaceId={projectWorkspaceId}
          optional={optional}
          value={value}
          onChange={onChange}
        />
      </div>
    )
  }

  return (
    <Typography variant="caption" tone="warning">
      No selectable catalog is available for {resourceType}. Choose a supported resource type.
    </Typography>
  )
}
