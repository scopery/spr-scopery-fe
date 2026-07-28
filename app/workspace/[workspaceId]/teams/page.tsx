'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { PageSkeleton } from '@/shared/ui'

/** Org teams live under Organization → Directory. */
export default function WorkspaceTeamsRedirectPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(ROUTES.workspace.organizationDirectory(workspaceId, 'teams'))
  }, [router, workspaceId])

  return <PageSkeleton variant="split" />
}
