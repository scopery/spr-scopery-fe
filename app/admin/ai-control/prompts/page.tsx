'use client'

import { Suspense } from 'react'
import { PromptTemplatesListView } from '@/modules/ai-agent-admin/prompt-templates/presentation/ui/PromptTemplatesListView'
import { PageSkeleton } from '@/shared/ui'

export default function AdminAiControlPromptsPage() {
  return (
    <Suspense fallback={<PageSkeleton variant="list" className="p-lg" />}>
      <PromptTemplatesListView />
    </Suspense>
  )
}
