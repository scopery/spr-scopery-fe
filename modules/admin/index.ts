/** Admin bounded-context facade — routes, navigation, and sub-module re-exports. */

export { ADMIN_ROUTES } from './lib/routes'
export {
  ADMIN_DIRECTORY_GROUPS,
  ADMIN_DIRECTORY_ITEMS,
  ADMIN_MODULE_ITEMS,
  getAdminModuleForPath,
  isAdminDirectoryItemActive,
  isAdminPathMatch,
} from './lib/admin-navigation'
export type { AdminDirectoryGroup, AdminDirectoryItem } from './lib/admin-navigation'
export { AdminTenantManagementLayout } from './lib/AdminTenantManagementLayout'

export * from './ai-budgets'
export * from './event-definitions'
export * from './iam'
export * from './join-requests'
export * from './knowledge'
export * from './notifications'
export * from './organizations'
export * from './phase-definitions'
export * from './platform-reliability'
export * from './project-templates'
export * from './workspaces'
