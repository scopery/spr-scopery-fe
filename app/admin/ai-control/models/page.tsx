'use client'

import { Suspense } from 'react'
import { ModelsListView } from '@/modules/ai-agent-admin/models/presentation/ui/ModelsListView'
import { PageSkeleton } from '@/shared/ui'

export default function AdminAiControlModelsPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="list" className="p-lg" />}>
      <ModelsListView />
    </Suspense>
  )
}
