'use client'

import { useParams } from 'next/navigation'
import { AuthGuard } from '@/modules/platform/guards/ui/AuthGuard'
import { AppShell } from '@/modules/platform/layout/ui/AppShell'
import { useWorkspaceRouteSync } from '@/modules/auth/workspace-context/hooks/useWorkspaceRouteSync'

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams()
  const workspaceId = params.workspaceId as string

  useWorkspaceRouteSync(workspaceId)

  return (
    <AuthGuard>
      <AppShell workspaceId={workspaceId}>{children}</AppShell>
    </AuthGuard>
  )
}
