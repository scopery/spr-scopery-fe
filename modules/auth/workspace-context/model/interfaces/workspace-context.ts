/** GET/PUT /api/workspace-context/current */
export interface WorkspaceContextResponse {
  userId: string
  currentWorkspaceId: string | null
  currentWorkspaceName: string | null
  currentWorkspaceCode: string | null
  lastSwitchedAt: string | null
  onboardingCompleted: boolean
}

/** GET /api/workspace-context/available — matches BE WorkspaceResponse */
export interface AvailableWorkspace {
  id: string
  organizationId: string
  code: string
  name: string
  description: string | null
  ownerUserId: string
  defaultVisibility: string
  joinPolicy: string
  status: string
  createdAt: string
  updatedAt: string
}

/** Enriched workspace for switcher UI */
export interface WorkspaceListItem extends AvailableWorkspace {
  organizationName: string | null
}
