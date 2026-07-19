'use client'

import { Suspense } from 'react'
import { AdminIamDelegationCreateView } from '@/modules/admin/iam/presentation/ui/AdminIamDelegationCreateView'
import { PageSkeleton } from '@/shared/ui'

export default function AdminIamDelegationNewPage() {
  return (
    <Suspense
      fallback={
        <PageSkeleton variant="form" />
      }
    >
      <AdminIamDelegationCreateView />
    </Suspense>
  )
}
