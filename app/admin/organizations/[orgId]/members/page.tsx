'use client'

import { useParams } from 'next/navigation'
import { OrganizationMembersPanel } from '@/modules/org/organization-members/ui/OrganizationMembersPanel'

export default function AdminOrganizationMembersPage() {
  const { orgId } = useParams<{ orgId: string }>()
  return <OrganizationMembersPanel organizationId={orgId} embedded />
}
