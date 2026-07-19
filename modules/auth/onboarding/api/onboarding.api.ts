import { apiClient } from '@/shared/lib/apiClient'
import { WORKSPACE_ONBOARDING_ENDPOINTS } from './endpoints'
import type {
  WorkspaceOnboardingStatusResponse,
  ChooseOptionPayload,
  CreateWorkspacePayload,
  AcceptInvitationPayload,
} from '../model'

const mutationOpts = { skipAuthRedirect: true } as const

export async function getOnboardingStatus(): Promise<WorkspaceOnboardingStatusResponse> {
  // skipAuthRedirect: caller (useOnboarding) redirects to login on 401 after clearing cookies.
  // Avoids apiClient hard-redirect mid-bootstrap before we can clear HttpOnly token.
  return apiClient.get<WorkspaceOnboardingStatusResponse>(WORKSPACE_ONBOARDING_ENDPOINTS.status(), {
    skipAuthRedirect: true,
  })
}

export async function startOnboarding(): Promise<WorkspaceOnboardingStatusResponse> {
  return apiClient.post<WorkspaceOnboardingStatusResponse>(
    WORKSPACE_ONBOARDING_ENDPOINTS.start(),
    undefined,
    mutationOpts
  )
}

export async function chooseOnboardingOption(
  payload: ChooseOptionPayload
): Promise<WorkspaceOnboardingStatusResponse> {
  return apiClient.post<WorkspaceOnboardingStatusResponse>(
    WORKSPACE_ONBOARDING_ENDPOINTS.chooseOption(),
    payload,
    mutationOpts
  )
}

export async function createWorkspaceOnboarding(
  payload: CreateWorkspacePayload
): Promise<WorkspaceOnboardingStatusResponse> {
  return apiClient.post<WorkspaceOnboardingStatusResponse>(
    WORKSPACE_ONBOARDING_ENDPOINTS.createWorkspace(),
    payload,
    mutationOpts
  )
}

export async function acceptOnboardingInvitation(
  payload: AcceptInvitationPayload
): Promise<WorkspaceOnboardingStatusResponse> {
  return apiClient.post<WorkspaceOnboardingStatusResponse>(
    WORKSPACE_ONBOARDING_ENDPOINTS.acceptInvitation(),
    payload,
    mutationOpts
  )
}

export async function resetOnboardingChoice(): Promise<WorkspaceOnboardingStatusResponse> {
  return apiClient.post<WorkspaceOnboardingStatusResponse>(
    WORKSPACE_ONBOARDING_ENDPOINTS.resetChoice(),
    undefined,
    mutationOpts
  )
}
