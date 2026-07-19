export {
  getWorkspaceContext,
  listAvailableWorkspaces,
  switchWorkspace,
} from './api/workspace-context.api'

export type {
  WorkspaceContextResponse,
  AvailableWorkspace,
  WorkspaceListItem,
} from './model'

export { enrichWorkspacesWithOrgNames } from './lib/enrich-workspaces'
export { useWorkspaceRouteSync } from './hooks/useWorkspaceRouteSync'
export { useWorkspaceContext } from './hooks/useWorkspaceContext'
export { useAvailableWorkspaces } from './hooks/useAvailableWorkspaces'
