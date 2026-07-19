'use client'

import { usePathname } from 'next/navigation'
import { Building2, LayoutGrid } from 'lucide-react'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { ShellSidebar } from '@/modules/platform/layout/ui/ShellSidebar'

export function AdminTenantManagementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`)

  return (
    <div className="-m-6 flex min-h-0 flex-1 lg:-m-8">
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white px-3 py-4 lg:block">
        <ShellSidebar
          ariaLabel="Workspace management navigation"
          sections={[
            {
              label: 'Tenant',
              items: [
                {
                  label: 'Organizations',
                  href: ADMIN_ROUTES.organizations,
                  icon: <Building2 size={16} />,
                  active: isActive(ADMIN_ROUTES.organizations),
                },
                {
                  label: 'Workspaces',
                  href: ADMIN_ROUTES.workspaces,
                  icon: <LayoutGrid size={16} />,
                  active:
                    isActive(ADMIN_ROUTES.workspaces) &&
                    !pathname?.includes('/access'),
                },
              ],
            },
          ]}
        />
      </aside>
      <div className="min-w-0 flex-1 overflow-y-auto p-6 lg:p-8">{children}</div>
    </div>
  )
}
