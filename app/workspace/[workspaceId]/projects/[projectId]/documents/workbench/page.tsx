'use client'

import { useParams, useSearchParams } from 'next/navigation'
import { DocumentWorkbenchView } from '@/modules/documents/document-hub/ui/DocumentWorkbenchView'
import { Typography } from '@/shared/ui'

export default function ProjectDocumentWorkbenchPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const search = useSearchParams()
  const documentId = search.get('documentId')

  if (!projectId) {
    return <Typography tone="muted">Missing project</Typography>
  }

  return <DocumentWorkbenchView projectId={projectId} initialDocumentId={documentId} />
}
