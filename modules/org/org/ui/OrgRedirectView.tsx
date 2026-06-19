'use client'

import { useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { ContentLoader } from '@/shared/ui'

export function OrgRedirectView() {
  const router = useRouter()
  const params = useParams()
  const orgId = params.orgId as string

  useEffect(() => {
    if (orgId) router.replace(ROUTES.org.projects(orgId))
  }, [orgId, router])

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50">
      <ContentLoader variant="easeOut" className="w-20" />
    </main>
  )
}
