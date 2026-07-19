'use client'

import { AdminTenantManagementLayout } from '@/modules/admin/lib/AdminTenantManagementLayout'

export default function AdminWorkspacesLayout({ children }: { children: React.ReactNode }) {
  return <AdminTenantManagementLayout>{children}</AdminTenantManagementLayout>
}
