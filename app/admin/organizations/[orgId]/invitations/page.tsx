'use client'

import { useParams } from 'next/navigation'
import { OrganizationInvitationsPanel } from '@/modules/org/organization-invitations/ui/OrganizationInvitationsPanel'

export default function AdminOrganizationInvitationsPage() {
  const { orgId } = useParams<{ orgId: string }>()
  return <OrganizationInvitationsPanel organizationId={orgId} embedded />
}
