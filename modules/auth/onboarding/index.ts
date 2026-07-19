export {
  getOnboardingStatus,
  startOnboarding,
  chooseOnboardingOption,
  createWorkspaceOnboarding,
  acceptOnboardingInvitation,
  resetOnboardingChoice,
} from './api/onboarding.api'

export type {
  WorkspaceOnboardingOption,
  WorkspaceOnboardingStatus,
  WorkspaceOnboardingStep,
  WorkspaceOnboardingStatusResponse,
  ChooseOptionPayload,
  CreateWorkspacePayload,
  AcceptInvitationPayload,
} from './model'

export { useOnboarding } from './hooks/useOnboarding'
export { OnboardingView } from './ui/OnboardingView'
