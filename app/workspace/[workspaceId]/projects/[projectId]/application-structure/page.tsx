'use client'

import { Suspense } from 'react'
import { ProjectApplicationStructureView } from '@/modules/projects'
import { PageSkeleton } from '@/shared/ui'

export default function ProjectApplicationStructurePage() {
  return (
    <Suspense fallback={<PageSkeleton variant="list" className="p-lg" />}>
      <ProjectApplicationStructureView />
    </Suspense>
  )
}
