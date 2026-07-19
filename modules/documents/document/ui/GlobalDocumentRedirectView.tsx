'use client'

import { useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { ContentLoader, Typography } from '@/shared/ui'

/** Legacy route — redirect to org-scoped document editor */
export function GlobalDocumentRedirectView() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const documentId = params.documentId as string
  const orgId = searchParams.get('orgId')

  useEffect(() => {
    if (orgId) {
      const projectId = searchParams.get('projectId')
      router.replace(ROUTES.workspace.document(orgId, documentId, projectId ?? undefined))
    }
  }, [orgId, documentId, router, searchParams])

  if (!orgId) {
    return (
      <div className="p-8 text-center">
        <Typography variant="small" tone="muted">
          Open this document from a project Documents Space, or add ?orgId= to the URL.
        </Typography>
      </div>
    )
  }

  return (
    <div className="flex justify-center py-12">
      <ContentLoader />
    </div>
  )
}
