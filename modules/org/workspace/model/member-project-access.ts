export const ProjectAccessMode = {
  All: 'ALL',
  Custom: 'CUSTOM',
} as const
export type ProjectAccessMode = (typeof ProjectAccessMode)[keyof typeof ProjectAccessMode]

export interface MemberProjectAccessItem {
  projectId: string
  projectName: string
  projectCode: string
}

export interface WorkspaceMemberAccessResponse {
  workspaceId: string
  userId: string
  accessMode: ProjectAccessMode | string
  totalProjects: number
  projects: MemberProjectAccessItem[]
  availableProjects: MemberProjectAccessItem[]
}

export interface ReplaceMemberProjectAccessPayload {
  mode: ProjectAccessMode
  projectIds?: string[]
}
