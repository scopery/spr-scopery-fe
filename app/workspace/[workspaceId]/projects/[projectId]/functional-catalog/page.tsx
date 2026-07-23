'use client'

import { Suspense } from 'react'
import { FunctionalCatalogView } from '@/modules/projects'
import { PageSkeleton } from '@/shared/ui'

export default function FunctionalCatalogPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="list" className="p-lg" />}>
      <FunctionalCatalogView />
    </Suspense>
  )
}
