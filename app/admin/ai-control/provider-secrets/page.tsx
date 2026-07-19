'use client'

import { Suspense } from 'react'
import { ProviderSecretsListView } from '@/modules/ai-agent-admin/provider-secrets/presentation/ui/ProviderSecretsListView'
import { PageSkeleton } from '@/shared/ui'

export default function AdminAiControlProviderSecretsPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="list" className="p-lg" />}>
      <ProviderSecretsListView />
    </Suspense>
  )
}
