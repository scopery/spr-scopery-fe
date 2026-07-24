import { Suspense } from 'react'
import { KnowledgeBaseView } from '@/modules/ai-agent-admin/knowledge-base/presentation/ui/KnowledgeBaseView'

export default function KnowledgePage() {
  return (
    <Suspense>
      <KnowledgeBaseView />
    </Suspense>
  )
}
