'use client'

import { usePathname } from 'next/navigation'
import {
  BookOpen,
  Clock,
  Database,
  FileKey,
  GitBranch,
  Key,
  LayoutDashboard,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { ShellSidebar } from '@/modules/platform/layout/ui/ShellSidebar'

export default function AdminIamLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`)

  return (
    <div className="-m-6 flex min-h-0 flex-1 lg:-m-8">
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white px-3 py-4 lg:block">
        <ShellSidebar
          ariaLabel="Identity and access navigation"
          sections={[
            {
              label: 'Management',
              items: [
                {
                  label: 'Overview',
                  href: ADMIN_ROUTES.iamOverview,
                  icon: <LayoutDashboard size={16} />,
                  active: pathname === ADMIN_ROUTES.iamOverview,
                },
                {
                  label: 'Users',
                  href: ADMIN_ROUTES.iamUsers,
                  icon: <Users size={16} />,
                  active: isActive(ADMIN_ROUTES.iamUsers),
                },
                {
                  label: 'Roles',
                  href: ADMIN_ROUTES.iamRoles,
                  icon: <ShieldCheck size={16} />,
                  active: isActive(ADMIN_ROUTES.iamRoles),
                },
                {
                  label: 'Role assignments',
                  href: ADMIN_ROUTES.iamRoleAssignments,
                  icon: <UserCheck size={16} />,
                  active: isActive(ADMIN_ROUTES.iamRoleAssignments),
                },
                {
                  label: 'Permissions',
                  href: ADMIN_ROUTES.iamPermissions,
                  icon: <BookOpen size={16} />,
                  active: isActive(ADMIN_ROUTES.iamPermissions),
                },
                {
                  label: 'Grants',
                  href: ADMIN_ROUTES.iamGrants,
                  icon: <Key size={16} />,
                  active: isActive(ADMIN_ROUTES.iamGrants),
                },
              ],
            },
            {
              label: 'Access tooling',
              items: [
                {
                  label: 'Authorization check',
                  href: ADMIN_ROUTES.iamAuthorizationCheck,
                  icon: <Search size={16} />,
                  active: isActive(ADMIN_ROUTES.iamAuthorizationCheck),
                },
                {
                  label: 'Authorization explain',
                  href: ADMIN_ROUTES.iamAuthorizationExplain,
                  icon: <FileKey size={16} />,
                  active: isActive(ADMIN_ROUTES.iamAuthorizationExplain),
                },
              ],
            },
            {
              label: 'Policies',
              items: [
                {
                  label: 'Owner policies',
                  href: ADMIN_ROUTES.iamOwnerPolicies,
                  icon: <FileKey size={16} />,
                  active: isActive(ADMIN_ROUTES.iamOwnerPolicies),
                },
                {
                  label: 'Delegations',
                  href: ADMIN_ROUTES.iamDelegations,
                  icon: <GitBranch size={16} />,
                  active: isActive(ADMIN_ROUTES.iamDelegations),
                },
              ],
            },
            {
              label: 'Audit',
              items: [
                {
                  label: 'Audit events',
                  href: ADMIN_ROUTES.platformAuditEvents,
                  icon: <Clock size={16} />,
                  active:
                    isActive(ADMIN_ROUTES.platformAuditEvents) ||
                    isActive(ADMIN_ROUTES.iamAudit) ||
                    isActive(ADMIN_ROUTES.iamAuditLog),
                },
              ],
            },
            {
              label: 'Developer',
              items: [
                {
                  label: 'Resources',
                  href: ADMIN_ROUTES.iamResources,
                  icon: <Database size={16} />,
                  active: isActive(ADMIN_ROUTES.iamResources),
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
