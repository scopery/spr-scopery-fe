'use client'

import { useParams } from 'next/navigation'
import { AuthGuard } from '@/shared/components/guards'
import { AppShell } from '@/shared/components/layout/AppShell'

export default function OrgLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const orgId = params.orgId as string

  return (
    <AuthGuard>
      <AppShell orgId={orgId}>{children}</AppShell>
    </AuthGuard>
  )
}
