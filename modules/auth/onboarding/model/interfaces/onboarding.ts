import type {
  WorkspaceOnboardingOption,
  WorkspaceOnboardingStatus,
  WorkspaceOnboardingStep,
} from '../enums/onboarding.enum'

export interface WorkspaceOnboardingStatusResponse {
  userId: string
  status: WorkspaceOnboardingStatus
  currentStep: WorkspaceOnboardingStep
  selectedOption: WorkspaceOnboardingOption | null
  targetWorkspaceId: string | null
  createdWorkspaceId: string | null
  joinRequestId: string | null
  joinRequestStatus: string | null
  currentWorkspaceId: string | null
  requiresWorkspaceSelection: boolean
  availableWorkspaceCount: number
  failureReason: string | null
  completedAt: string | null
  lastSeenAt: string
}

export interface ChooseOptionPayload {
  option: WorkspaceOnboardingOption
}

export interface CreateWorkspacePayload {
  organizationName: string
  organizationCode: string
  workspaceName: string
  workspaceCode: string
  workspaceDescription?: string
}

export interface AcceptInvitationPayload {
  code: string
}
