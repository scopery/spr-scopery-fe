import { apiPath } from '@/shared/lib/api-paths'

/**
 * Workspace Onboarding
 * Description: Multi-step workspace selection flow for new users (v1).
 */
export const WORKSPACE_ONBOARDING_ENDPOINTS = {
  status: () => apiPath('/workspace-onboarding/status'),
  start: () => apiPath('/workspace-onboarding/start'),
  chooseOption: () => apiPath('/workspace-onboarding/choose-option'),
  createWorkspace: () => apiPath('/workspace-onboarding/create-workspace'),
  acceptInvitation: () => apiPath('/workspace-onboarding/accept-invitation'),
  resetChoice: () => apiPath('/workspace-onboarding/reset-choice'),
} as const
