'use client'

import { Suspense, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Button, PageSkeleton, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'

/**
 * Legacy URL: /workspace/{ws}/documents/{docId}?projectId=…
 * BE documents are project-scoped — send users to the native editor when projectId is known.
 */
function DocumentDetailRedirect() {
  const params = useParams<{ workspaceId: string; documentId: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const workspaceId = params.workspaceId
  const documentId = params.documentId
  const projectId = searchParams.get('projectId')

  useEffect(() => {
    if (!workspaceId || !documentId) return
    if (projectId) {
      router.replace(ROUTES.workspace.projectDocumentEdit(workspaceId, projectId, documentId))
      return
    }
    // No projectId — fall back to Document Hub (cannot call BE without project scope).
    router.replace(ROUTES.workspace.documentHub(workspaceId))
  }, [workspaceId, documentId, projectId, router])

  if (!projectId) {
    return (
      <div className="space-y-3 p-lg">
        <Typography tone="error">Missing project context</Typography>
        <Typography variant="small" tone="muted">
          Documents are loaded via{' '}
          <code className="text-xs">GET /api/projects/&#123;projectId&#125;/documents/&#123;id&#125;</code>.
          Open the document from Document Hub again.
        </Typography>
        <Button
          variant="outline"
          onClick={() => router.push(ROUTES.workspace.documentHub(workspaceId))}
        >
          Back to Document Hub
        </Button>
      </div>
    )
  }

  return <PageSkeleton variant="detail" />
}

export function OrgDocumentDetailView() {
  return (
    <Suspense fallback={<PageSkeleton variant="detail" />}>
      <DocumentDetailRedirect />
    </Suspense>
  )
}
