export const UseCaseStatus = {
  Draft: 'DRAFT',
  InReview: 'IN_REVIEW',
  Approved: 'APPROVED',
  Deprecated: 'DEPRECATED',
  Archived: 'ARCHIVED',
} as const
export type UseCaseStatus = (typeof UseCaseStatus)[keyof typeof UseCaseStatus]

export const UseCaseCompletenessStatus = {
  NotStarted: 'NOT_STARTED',
  Incomplete: 'INCOMPLETE',
  ReadyForReview: 'READY_FOR_REVIEW',
  Complete: 'COMPLETE',
} as const
export type UseCaseCompletenessStatus =
  (typeof UseCaseCompletenessStatus)[keyof typeof UseCaseCompletenessStatus]

export const UseCaseFlowType = {
  Main: 'MAIN',
  Alternative: 'ALTERNATIVE',
  Exception: 'EXCEPTION',
} as const
export type UseCaseFlowType = (typeof UseCaseFlowType)[keyof typeof UseCaseFlowType]

export const UseCaseFlowStepType = {
  UserAction: 'USER_ACTION',
  SystemAction: 'SYSTEM_ACTION',
  Condition: 'CONDITION',
  Navigation: 'NAVIGATION',
  Result: 'RESULT',
  Error: 'ERROR',
} as const
export type UseCaseFlowStepType =
  (typeof UseCaseFlowStepType)[keyof typeof UseCaseFlowStepType]

export const UseCaseConditionType = {
  Precondition: 'PRECONDITION',
  Assumption: 'ASSUMPTION',
  SuccessPostcondition: 'SUCCESS_POSTCONDITION',
  FailurePostcondition: 'FAILURE_POSTCONDITION',
} as const
export type UseCaseConditionType =
  (typeof UseCaseConditionType)[keyof typeof UseCaseConditionType]

export interface UseCase {
  id: string
  projectId: string
  primaryFunctionId: string
  primaryFunctionName: string
  key: string
  name: string
  goal?: string | null
  primaryActorName?: string | null
  triggerText?: string | null
  status: string
  completenessStatus: string
  displayOrder: number
  version: number
  createdAt: string
  updatedAt: string
}

export interface UseCaseFlowStep {
  id: string
  flowId: string
  stepType: string
  screenContextId?: string | null
  contentJson?: string | null
  nextScreenId?: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface UseCaseFlow {
  id: string
  useCaseId: string
  flowType: string
  name?: string | null
  sourceStepId?: string | null
  conditionText?: string | null
  displayOrder: number
  steps: UseCaseFlowStep[]
  createdAt: string
  updatedAt: string
}

export interface UseCaseCondition {
  id: string
  useCaseId: string
  conditionType: string
  content: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface UseCaseBusinessRule {
  id: string
  useCaseId: string
  ruleCode: string
  description: string
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface UseCaseAcceptanceCriterion {
  id: string
  useCaseId: string
  title: string
  givenText?: string | null
  whenText?: string | null
  thenText?: string | null
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export interface SupportingFunction {
  functionId: string
  functionName: string
  functionCode: string
}

export interface UseCaseDetail {
  overview: UseCase
  flows: UseCaseFlow[]
  conditions: UseCaseCondition[]
  businessRules: UseCaseBusinessRule[]
  acceptanceCriteria: UseCaseAcceptanceCriterion[]
  supportingFunctions: SupportingFunction[]
}

export interface CreateUseCaseBody {
  primaryFunctionId: string
  key: string
  name: string
  goal?: string | null
  primaryActorName?: string | null
  triggerText?: string | null
}

export interface UpdateUseCaseBody {
  name: string
  goal?: string | null
  primaryActorName?: string | null
  triggerText?: string | null
  status: string
}

export interface CreateUseCaseFlowBody {
  flowType: string
  name?: string | null
  sourceStepId?: string | null
  conditionText?: string | null
}

export interface UpdateUseCaseFlowBody {
  name?: string | null
  sourceStepId?: string | null
  conditionText?: string | null
}

export interface AddFlowStepBody {
  stepType: string
  screenContextId?: string | null
  contentJson?: string | null
  nextScreenId?: string | null
  displayOrder: number
}

export interface UpdateFlowStepBody {
  stepType: string
  screenContextId?: string | null
  contentJson?: string | null
  nextScreenId?: string | null
}

export interface ReorderFlowStepsBody {
  stepIds: string[]
}

export interface AddUseCaseConditionBody {
  conditionType: string
  content: string
  displayOrder: number
}

export interface UpdateUseCaseConditionBody {
  content: string
  displayOrder: number
}

export interface AddUseCaseBusinessRuleBody {
  ruleCode: string
  description: string
  displayOrder: number
}

export interface UpdateUseCaseBusinessRuleBody {
  ruleCode: string
  description: string
  displayOrder: number
}

export interface AddUseCaseAcceptanceCriterionBody {
  title: string
  givenText?: string | null
  whenText?: string | null
  thenText?: string | null
  displayOrder: number
}

export interface UpdateUseCaseAcceptanceCriterionBody {
  title: string
  givenText?: string | null
  whenText?: string | null
  thenText?: string | null
  displayOrder: number
}

export interface AddSupportingFunctionBody {
  functionId: string
}

export interface LinkRequirementBody {
  requirementId: string
}
