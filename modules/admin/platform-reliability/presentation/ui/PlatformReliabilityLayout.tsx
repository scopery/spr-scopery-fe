'use client'

import { usePathname } from 'next/navigation'
import {
  Activity,
  AlertTriangle,
  Clock,
  GitBranch,
  LayoutDashboard,
  Mail,
  Radio,
  Settings,
  Waypoints,
} from 'lucide-react'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { ShellSidebar } from '@/modules/platform/layout/ui/ShellSidebar'

export function PlatformReliabilityLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`)

  return (
    <div className="-m-6 flex min-h-0 flex-1 lg:-m-8">
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white px-3 py-4 lg:block">
        <ShellSidebar
          ariaLabel="Platform reliability navigation"
          sections={[
            {
              label: 'Observability',
              items: [
                {
                  label: 'Overview',
                  href: ADMIN_ROUTES.platformOverview,
                  icon: <LayoutDashboard size={16} />,
                  active: pathname === ADMIN_ROUTES.platformOverview,
                },
                {
                  label: 'Activity logs',
                  href: ADMIN_ROUTES.platformActivityLogs,
                  icon: <Activity size={16} />,
                  active: isActive(ADMIN_ROUTES.platformActivityLogs),
                },
                {
                  label: 'Audit events',
                  href: ADMIN_ROUTES.platformAuditEvents,
                  icon: <Clock size={16} />,
                  active: isActive(ADMIN_ROUTES.platformAuditEvents),
                },
                {
                  label: 'Traces',
                  href: ADMIN_ROUTES.platformTraces,
                  icon: <Waypoints size={16} />,
                  active: isActive(ADMIN_ROUTES.platformTraces),
                },
                {
                  label: 'Errors',
                  href: ADMIN_ROUTES.platformErrors,
                  icon: <AlertTriangle size={16} />,
                  active: isActive(ADMIN_ROUTES.platformErrors),
                },
              ],
            },
            {
              label: 'Reliability',
              items: [
                {
                  label: 'Event outbox',
                  href: ADMIN_ROUTES.platformEventOutbox,
                  icon: <Radio size={16} />,
                  active: isActive(ADMIN_ROUTES.platformEventOutbox),
                },
                {
                  label: 'Dead letters',
                  href: ADMIN_ROUTES.platformDeadLetters,
                  icon: <GitBranch size={16} />,
                  active: isActive(ADMIN_ROUTES.platformDeadLetters),
                },
                {
                  label: 'Email outbox',
                  href: ADMIN_ROUTES.platformEmailOutbox,
                  icon: <Mail size={16} />,
                  active: isActive(ADMIN_ROUTES.platformEmailOutbox),
                },
              ],
            },
            {
              label: 'Controls',
              items: [
                {
                  label: 'Settings',
                  href: ADMIN_ROUTES.platformSettings,
                  icon: <Settings size={16} />,
                  active: isActive(ADMIN_ROUTES.platformSettings),
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
