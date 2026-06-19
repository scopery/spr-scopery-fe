'use client'

import { useParams } from 'next/navigation'
import { AuthGuard, AppShell } from '@/modules/platform'

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const orgId = params.orgId as string

  return (
    <AuthGuard>
      <AppShell orgId={orgId}>{children}</AppShell>
    </AuthGuard>
  )
}
