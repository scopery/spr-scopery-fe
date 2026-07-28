'use client'

import { useParams } from 'next/navigation'
import { OrganizationActivityPanel } from '@/modules/org'

export default function AdminOrganizationActivityPage() {
  const { orgId } = useParams<{ orgId: string }>()
  return <OrganizationActivityPanel scopeLabel="organization" organizationId={orgId} />
}
