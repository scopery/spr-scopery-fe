'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'

/** Legacy My Work route → My Insights single page. */
export default function MyWorkRedirectPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const router = useRouter()

  useEffect(() => {
    if (workspaceId) {
      router.replace(ROUTES.workspace.myInsights(workspaceId))
    }
  }, [router, workspaceId])

  return null
}
