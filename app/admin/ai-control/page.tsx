'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export default function AdminAiControlIndexPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace(ADMIN_ROUTES.aiControlOverview)
  }, [router])
  return null
}
