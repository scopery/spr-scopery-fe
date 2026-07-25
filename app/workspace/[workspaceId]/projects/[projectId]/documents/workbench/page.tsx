'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageSkeleton } from '@/shared/ui'
import { WORKSPACE_ROUTES } from '@/modules/org/lib/routes'

/** Legacy workbench URL — redirect to Document Hub. */
export default function ProjectDocumentWorkbenchRedirectPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const router = useRouter()

  useEffect(() => {
    if (!workspaceId) return
    router.replace(WORKSPACE_ROUTES.documentHub(workspaceId))
  }, [workspaceId, router])

  return <PageSkeleton variant="detail" />
}
