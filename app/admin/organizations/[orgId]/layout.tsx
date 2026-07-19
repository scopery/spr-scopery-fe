'use client'

import { AdminOrganizationDetailShell } from '@/modules/admin/organizations/presentation/ui/AdminOrganizationDetailShell'

export default function AdminOrganizationDetailLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminOrganizationDetailShell>{children}</AdminOrganizationDetailShell>
}
