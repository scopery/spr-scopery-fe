'use client'

import { Suspense } from 'react'
import { ParameterCapabilitiesListView } from '@/modules/ai-agent-admin/parameter-capabilities/presentation/ui/ParameterCapabilitiesListView'
import { PageSkeleton } from '@/shared/ui'

export default function AdminAiControlParameterCapabilitiesPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="list" className="p-lg" />}>
      <ParameterCapabilitiesListView />
    </Suspense>
  )
}
