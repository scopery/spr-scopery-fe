'use client'

import { AuthGuard } from '@/modules/platform/guards/ui/AuthGuard'
import { RequestJoinWorkspaceView } from '@/modules/org/join-requests/ui/RequestJoinWorkspaceView'

export default function JoinWorkspacePage() {
  return (
    <AuthGuard>
      <RequestJoinWorkspaceView />
    </AuthGuard>
  )
}
