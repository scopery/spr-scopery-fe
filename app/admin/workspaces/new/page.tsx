'use client'

import { Suspense } from 'react'
import { AdminWorkspaceCreateView } from '@/modules/admin/workspaces/presentation/ui/AdminWorkspaceCreateView'
import { PageSkeleton } from '@/shared/ui'

export default function AdminWorkspaceNewPage() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="form" />
      }
    >
      <AdminWorkspaceCreateView />
    </Suspense>
  )
}
