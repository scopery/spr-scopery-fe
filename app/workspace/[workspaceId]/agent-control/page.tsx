'use client'

import { useParams } from 'next/navigation'
import { AgentControlView } from '@/modules/ai-agent-control'
import { useWorkspace } from '@/modules/org/workspace'
import { PageSkeleton, Typography } from '@/shared/ui'

export default function AgentControlPage() {
  const params = useParams<{ workspaceId: string }>()
  const workspaceId = params.workspaceId
  const { workspace, loading, error } = useWorkspace(workspaceId)
  const orgId = workspace?.organizationId ?? null

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>
  if (!orgId) {
    return (
      <Typography tone="muted" className="p-lg">
        This workspace has no organization linked — Agent Control needs an organization scope.
      </Typography>
    )
  }

  return <AgentControlView orgId={orgId} />
}
