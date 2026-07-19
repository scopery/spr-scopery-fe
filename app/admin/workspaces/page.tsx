'use client'

import { Suspense } from 'react'
import { AdminWorkspacesListView } from '@/modules/admin/workspaces/presentation/ui/AdminWorkspacesListView'
import { PageSkeleton } from '@/shared/ui'

export default function AdminWorkspacesPage() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="list" />
      }
    >
      <AdminWorkspacesListView />
    </Suspense>
  )
}
