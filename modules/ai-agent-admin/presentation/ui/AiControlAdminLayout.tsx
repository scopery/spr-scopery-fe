'use client'

import { usePathname } from 'next/navigation'
import {
  Bot,
  Boxes,
  Cpu,
  FileCode2,
  Gauge,
  KeyRound,
  LayoutDashboard,
  MessageSquare,
  Play,
  Server,
  Settings2,
  Shield,
  Wrench,
  Zap,
} from 'lucide-react'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { ShellSidebar } from '@/modules/platform/layout/ui/ShellSidebar'

export function AiControlAdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`)

  return (
    <div className="-m-6 flex min-h-0 flex-1 lg:-m-8">
      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-neutral-200 bg-white px-3 py-4 lg:block">
        <ShellSidebar
          ariaLabel="AI and automation navigation"
          sections={[
            {
              label: 'AI & Automation',
              items: [
                {
                  label: 'Overview',
                  href: ADMIN_ROUTES.aiControlOverview,
                  icon: <LayoutDashboard size={16} />,
                  active: pathname === ADMIN_ROUTES.aiControlOverview,
                },
                {
                  label: 'Providers',
                  href: ADMIN_ROUTES.aiControlProviders,
                  icon: <Server size={16} />,
                  active: isActive(ADMIN_ROUTES.aiControlProviders),
                },
                {
                  label: 'Provider secrets',
                  href: ADMIN_ROUTES.aiControlProviderSecrets,
                  icon: <KeyRound size={16} />,
                  active: isActive(ADMIN_ROUTES.aiControlProviderSecrets),
                },
                {
                  label: 'Models',
                  href: ADMIN_ROUTES.aiControlModels,
                  icon: <Cpu size={16} />,
                  active: isActive(ADMIN_ROUTES.aiControlModels),
                },
                {
                  label: 'Deployments',
                  href: ADMIN_ROUTES.aiControlDeployments,
                  icon: <Boxes size={16} />,
                  active: isActive(ADMIN_ROUTES.aiControlDeployments),
                },
                {
                  label: 'Parameter capabilities',
                  href: ADMIN_ROUTES.aiControlParameterCapabilities,
                  icon: <Settings2 size={16} />,
                  active: isActive(ADMIN_ROUTES.aiControlParameterCapabilities),
                },
                {
                  label: 'Agents',
                  href: ADMIN_ROUTES.aiControlAgents,
                  icon: <Bot size={16} />,
                  active: isActive(ADMIN_ROUTES.aiControlAgents),
                },
                {
                  label: 'Prompt templates',
                  href: ADMIN_ROUTES.aiControlPrompts,
                  icon: <FileCode2 size={16} />,
                  active: isActive(ADMIN_ROUTES.aiControlPrompts),
                },
                {
                  label: 'Event configs',
                  href: ADMIN_ROUTES.aiControlEventConfigs,
                  icon: <Zap size={16} />,
                  active: isActive(ADMIN_ROUTES.aiControlEventConfigs),
                },
                {
                  label: 'Usage policies',
                  href: ADMIN_ROUTES.aiControlUsagePolicies,
                  icon: <Shield size={16} />,
                  active: isActive(ADMIN_ROUTES.aiControlUsagePolicies),
                },
                {
                  label: 'Executions',
                  href: ADMIN_ROUTES.aiControlExecutions,
                  icon: <Gauge size={16} />,
                  active: isActive(ADMIN_ROUTES.aiControlExecutions),
                },
                {
                  label: 'Playground',
                  href: ADMIN_ROUTES.aiControlPlayground,
                  icon: <Play size={16} />,
                  active: isActive(ADMIN_ROUTES.aiControlPlayground),
                },
                {
                  label: 'Tools',
                  href: ADMIN_ROUTES.aiControlTools,
                  icon: <Wrench size={16} />,
                  active: isActive(ADMIN_ROUTES.aiControlTools),
                },
                {
                  label: 'AI Assistant settings',
                  href: ADMIN_ROUTES.aiControlAssistantSettings,
                  icon: <MessageSquare size={16} />,
                  active: isActive(ADMIN_ROUTES.aiControlAssistantSettings),
                },
              ],
            },
          ]}
        />
      </aside>
      <div className="min-w-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}
