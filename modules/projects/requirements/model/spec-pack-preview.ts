/**
 * Shared preview document model — drives both on-screen preview and DOC export.
 * Keep renderers dumb: only map this tree to React or HTML.
 */

export interface SpecPackPreviewItem {
  id: string
  code?: string | null
  name: string
  secondary?: string | null
}

export interface SpecPackPreviewFlowStep {
  stepType: string
  text: string
}

export interface SpecPackPreviewFlow {
  flowType: string
  name?: string | null
  conditionText?: string | null
  steps: SpecPackPreviewFlowStep[]
}

export interface SpecPackPreviewUseCase {
  id: string
  key: string
  name: string
  goal?: string | null
  primaryActorName?: string | null
  triggerText?: string | null
  conditions: Array<{ type: string; content: string }>
  businessRules: Array<{ code: string; description: string }>
  acceptanceCriteria: Array<{
    title: string
    givenText?: string | null
    whenText?: string | null
    thenText?: string | null
  }>
  flows: SpecPackPreviewFlow[]
}

export interface SpecPackPreviewFunctionDetail {
  id: string
  code?: string | null
  name: string
  description?: string | null
  priority?: string | null
  status?: string | null
  type?: string | null
  moduleId?: string | null
  acceptanceCriteria?: string[] | null
  createdAt?: string | null
  updatedAt?: string | null
  businessRules?: Array<{
    code: string
    title: string
    description?: string | null
    severity?: string | null
    status?: string | null
  }>
}

export interface SpecPackPreviewFunctionBlock {
  function: SpecPackPreviewFunctionDetail
  module?: SpecPackPreviewItem | null
  useCases: SpecPackPreviewUseCase[]
  screens: SpecPackPreviewItem[]
  apis: SpecPackPreviewItem[]
  components: SpecPackPreviewItem[]
  entities: SpecPackPreviewItem[]
  communications: SpecPackPreviewItem[]
}

export interface SpecPackPreviewRequirementChapter {
  requirement: {
    id: string
    code: string
    title: string
    requirementType?: string | null
    priority?: string | null
    description?: string | null
  }
  functions: SpecPackPreviewFunctionBlock[]
  loadError?: string | null
}

export interface SpecPackPreviewDocument {
  packId: string
  title: string
  note?: string | null
  projectId: string
  createdAt: string
  generatedAt: string
  chapters: SpecPackPreviewRequirementChapter[]
}
