'use client'

import { useParams } from 'next/navigation'
import { AgentControlView } from '@/modules/ai-agent-control/agent-control/presentation/ui/AgentControlView'

export default function AgentControlPage() {
  const params = useParams()
  const orgId = params.workspaceId as string

  return <AgentControlView orgId={orgId} />
}
