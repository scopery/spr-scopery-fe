/** Public facade — app imports only from here. */
export * from './ai-config'
export * from './ai-agents'
export * from './ai-budgets'
export * from './ai-routing'
export * from './ai-playground'
export * from './ai-feedback'
export * from './admin-templates'
export * from './iam'
export * from './organizations'
export * from './workspaces'
export * from './join-requests'
export * from './event-definitions'
export * from './notifications'
export * from './phase-definitions'
export * from './project-templates'
export * from './knowledge'
export * from './platform-reliability'
export {
  ADMIN_DIRECTORY_GROUPS,
  ADMIN_DIRECTORY_ITEMS,
  ADMIN_MODULE_ITEMS,
  getAdminModuleForPath,
  isAdminDirectoryItemActive,
  isAdminPathMatch,
} from './lib/admin-navigation'
export type { AdminDirectoryGroup, AdminDirectoryItem } from './lib/admin-navigation'
export { ADMIN_ROUTES } from './lib/routes'
export { AdminTenantManagementLayout } from './lib/AdminTenantManagementLayout'

