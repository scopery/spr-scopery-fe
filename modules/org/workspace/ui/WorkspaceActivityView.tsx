'use client'

import { useParams } from 'next/navigation'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { OrganizationActivityPanel } from '../../organization/ui/OrganizationActivityPanel'

export function WorkspaceActivityView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb workspaceId={workspaceId} current="Activity" className="mb-4" />
      <OrganizationActivityPanel scopeLabel="workspace" workspaceId={workspaceId} />
    </div>
  )
}
