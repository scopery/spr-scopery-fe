'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { PageSkeleton } from '@/shared/ui'

/** Legacy route → Organization directory (members tab). */
export default function WorkspaceOrganizationMembersRedirectPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(ROUTES.workspace.organizationDirectory(workspaceId, 'members'))
  }, [router, workspaceId])

  return <PageSkeleton variant="split" />
}
