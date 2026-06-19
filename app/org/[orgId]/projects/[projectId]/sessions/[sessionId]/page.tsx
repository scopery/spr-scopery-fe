'use client'

import { useParams } from 'next/navigation'
import { SessionDetailView } from '@/modules/sessions'

export default function SessionDetailPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const projectId = params.projectId as string
  const sessionId = params.sessionId as string

  return <SessionDetailView orgId={orgId} projectId={projectId} sessionId={sessionId} />
}
