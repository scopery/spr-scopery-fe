'use client'

import { AdminTenantManagementLayout } from '@/modules/admin/lib/AdminTenantManagementLayout'

export default function AdminOrganizationsLayout({ children }: { children: React.ReactNode }) {
  return <AdminTenantManagementLayout>{children}</AdminTenantManagementLayout>
}
