'use client'

import { useParams } from 'next/navigation'
import { AgentControlView } from '@/modules/ai-agent-control'

export default function AgentControlPage() {
  const params = useParams()
  const orgId = params.orgId as string

  return <AgentControlView orgId={orgId} />
}
