'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageSkeleton } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'

/** Legacy /work/[taskId] → stay on the work list and open the drawer via ?task=. */
export default function ProjectWorkTaskPage() {
  const params = useParams<{
    workspaceId: string
    projectId: string
    taskId: string
  }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(
      ROUTES.workspace.projectWorkTask(params.workspaceId, params.projectId, params.taskId)
    )
  }, [params.workspaceId, params.projectId, params.taskId, router])

  return <PageSkeleton variant="list" />
}
