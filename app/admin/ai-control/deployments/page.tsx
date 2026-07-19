'use client'

import { Suspense } from 'react'
import { DeploymentsListView } from '@/modules/ai-agent-admin/deployments/presentation/ui/DeploymentsListView'
import { PageSkeleton } from '@/shared/ui'

export default function AdminAiControlDeploymentsPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="list" className="p-lg" />}>
      <DeploymentsListView />
    </Suspense>
  )
}
