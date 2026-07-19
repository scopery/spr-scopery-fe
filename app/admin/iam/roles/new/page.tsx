'use client'

import { Suspense } from 'react'
import { AdminIamRoleCreateView } from '@/modules/admin/iam/presentation/ui/AdminIamRoleCreateView'
import { PageSkeleton } from '@/shared/ui'

export default function AdminIamRoleNewPage() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="form" />
      }
    >
      <AdminIamRoleCreateView />
    </Suspense>
  )
}
