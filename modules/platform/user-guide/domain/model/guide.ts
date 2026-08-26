export interface GuideStep {
  title: string
  body: string
  /** Exact UI control labels the user should look for */
  uiHints?: string[]
}

export type GuideDiagramType = 'org-hierarchy' | 'delivery-lifecycle' | 'workflow-e2e'

export interface GuideHighlight {
  iconKey: string
  label: string
  description: string
}

export interface GuideArticle {
  id: string
  groupId: string
  title: string
  subtitle: string
  keywords: string[]
  suggestedQuestions: string[]
  prerequisites?: string[]
  highlights?: GuideHighlight[]
  steps: GuideStep[]
  relatedIds?: string[]
  diagramType?: GuideDiagramType
}

export interface GuideGroup {
  id: string
  label: string
  order: number
}
