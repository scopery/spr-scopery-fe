export type WorkspaceOnboardingOption = 'CREATE_WORKSPACE' | 'JOIN_WITH_INVITATION'

export type WorkspaceOnboardingStatus =
  | 'IN_PROGRESS'
  | 'WAITING_FOR_APPROVAL'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'

export type WorkspaceOnboardingStep =
  | 'CHOOSE_WORKSPACE_OPTION'
  | 'CREATE_WORKSPACE'
  | 'ENTER_INVITATION_CODE'
  | 'ACCEPT_INVITATION'
  | 'REQUEST_JOIN_WORKSPACE'
  | 'WAITING_JOIN_APPROVAL'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'
