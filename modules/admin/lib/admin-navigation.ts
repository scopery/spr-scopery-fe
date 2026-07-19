import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  Building2,
  FileStack,
  FileText,
  History,
  ShieldCheck,
  ServerCog,
  Sparkles,
  Wallet,
  Wrench,
  Layers,
  LayoutTemplate,
  Bell,
} from 'lucide-react'
import { ADMIN_ROUTES } from './routes'

export const ADMIN_DIRECTORY_GROUPS = ['Admin Areas', 'System', 'Developer'] as const

export type AdminDirectoryGroup = (typeof ADMIN_DIRECTORY_GROUPS)[number]

export interface AdminDirectoryItem {
  label: string
  description: string
  href: string
  group: AdminDirectoryGroup
  icon: LucideIcon
  matchPaths: string[]
  exactMatchPaths?: string[]
  createHref?: string
}

export const ADMIN_DIRECTORY_ITEMS: AdminDirectoryItem[] = [
  {
    label: 'Identity & Access',
    description: 'Users, roles, permissions',
    href: ADMIN_ROUTES.iamOverview,
    group: 'Admin Areas',
    icon: ShieldCheck,
    matchPaths: [
      ADMIN_ROUTES.iamOverview,
      ADMIN_ROUTES.iamUsers,
      ADMIN_ROUTES.iamRoles,
      ADMIN_ROUTES.iamRoleAssignments,
      ADMIN_ROUTES.iamPermissions,
      ADMIN_ROUTES.iamGrants,
      ADMIN_ROUTES.iamDelegations,
      ADMIN_ROUTES.iamOwnerPolicies,
      ADMIN_ROUTES.iamAuthorizationCheck,
      ADMIN_ROUTES.iamAuthorizationExplain,
      ADMIN_ROUTES.iamAccessControl,
    ],
    exactMatchPaths: [ADMIN_ROUTES.iam],
  },
  {
    label: 'AI & Automation',
    description: 'Providers, agents, prompts, playground',
    href: ADMIN_ROUTES.aiControlOverview,
    group: 'Admin Areas',
    icon: Sparkles,
    matchPaths: [ADMIN_ROUTES.aiControl],
    exactMatchPaths: [ADMIN_ROUTES.aiControl],
  },
  {
    label: 'AI Agents (legacy)',
    description: 'Legacy agent registry',
    href: ADMIN_ROUTES.aiAgents,
    group: 'Admin Areas',
    icon: Bot,
    matchPaths: [ADMIN_ROUTES.aiAgents],
  },
  {
    label: 'AI Budgets',
    description: 'Usage limits and spending control',
    href: ADMIN_ROUTES.aiBudgets,
    group: 'Admin Areas',
    icon: Wallet,
    matchPaths: [ADMIN_ROUTES.aiBudgets],
  },
  {
    label: 'Templates',
    description: 'Prompt and document templates',
    href: ADMIN_ROUTES.templates,
    group: 'Admin Areas',
    icon: FileStack,
    matchPaths: [ADMIN_ROUTES.templates],
    createHref: ADMIN_ROUTES.templateNew,
  },
  {
    label: 'Document Hub',
    description: 'Documents, workflows, governance',
    href: ADMIN_ROUTES.documents,
    group: 'Admin Areas',
    icon: FileText,
    matchPaths: [ADMIN_ROUTES.documents],
  },
  {
    label: 'Workspace Management',
    description: 'Organizations, workspaces, teams, members',
    href: ADMIN_ROUTES.workspaces,
    group: 'Admin Areas',
    icon: Building2,
    matchPaths: [ADMIN_ROUTES.workspaces, ADMIN_ROUTES.organizations],
    createHref: ADMIN_ROUTES.workspaceNew,
  },
  {
    label: 'Phase Definitions',
    description: 'System / org / workspace phase catalog',
    href: ADMIN_ROUTES.phaseDefinitions,
    group: 'Admin Areas',
    icon: Layers,
    matchPaths: [ADMIN_ROUTES.phaseDefinitions],
  },
  {
    label: 'Project Templates',
    description: 'Template library and apply',
    href: ADMIN_ROUTES.projectTemplates,
    group: 'Admin Areas',
    icon: LayoutTemplate,
    matchPaths: [ADMIN_ROUTES.projectTemplates],
  },
  {
    label: 'Notification Admin',
    description: 'Email rules and delivery operations',
    href: ADMIN_ROUTES.nadOverview,
    group: 'Admin Areas',
    icon: Bell,
    matchPaths: [
      ADMIN_ROUTES.nadOverview,
      ADMIN_ROUTES.nadEmailRules,
      ADMIN_ROUTES.nadEmailTemplates,
      ADMIN_ROUTES.nadDeliveries,
      ADMIN_ROUTES.nadAutomation,
    ],
  },
  {
    label: 'Access History',
    description: 'Audit logs and changes',
    href: ADMIN_ROUTES.platformAuditEvents,
    group: 'System',
    icon: History,
    matchPaths: [
      ADMIN_ROUTES.platformAuditEvents,
      ADMIN_ROUTES.iamAudit,
      ADMIN_ROUTES.iamAuditLog,
    ],
  },
  {
    label: 'Platform Reliability',
    description: 'Audit, activity, outbox, jobs, traces',
    href: ADMIN_ROUTES.platformOverview,
    group: 'System',
    icon: ServerCog,
    matchPaths: [ADMIN_ROUTES.platform],
    exactMatchPaths: [ADMIN_ROUTES.platform],
  },
  {
    label: 'Developer Tools',
    description: 'Resources and legacy mappings',
    href: ADMIN_ROUTES.iamResources,
    group: 'Developer',
    icon: Wrench,
    matchPaths: [ADMIN_ROUTES.iamResources, ADMIN_ROUTES.iamRights, ADMIN_ROUTES.developerTools],
  },
]

export const ADMIN_MODULE_ITEMS = ADMIN_DIRECTORY_ITEMS

export function isAdminPathMatch(pathname: string | null, path: string) {
  if (!pathname) return false
  return pathname === path || pathname.startsWith(`${path}/`)
}

export function isAdminDirectoryItemActive(item: AdminDirectoryItem, pathname: string | null) {
  if (!pathname) return false
  if (item.exactMatchPaths?.includes(pathname)) return true
  return item.matchPaths.some((path) => isAdminPathMatch(pathname, path))
}

export function getAdminModuleForPath(pathname: string | null) {
  return ADMIN_MODULE_ITEMS.find((item) => isAdminDirectoryItemActive(item, pathname))
}
