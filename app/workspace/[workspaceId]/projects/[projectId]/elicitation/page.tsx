'use client'

import { Suspense } from 'react'
import { PageSkeleton } from '@/shared/ui'
import { ElicitationView } from '@/modules/projects/elicitation'

export default function ElicitationPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="list" className="p-lg" />}>
      <ElicitationView />
    </Suspense>
  )
}
