export interface GuideStep {
  title: string
  body: string
  /** Exact UI control labels the user should look for */
  uiHints?: string[]
}

export interface GuideArticle {
  id: string
  groupId: string
  title: string
  subtitle: string
  keywords: string[]
  suggestedQuestions: string[]
  prerequisites?: string[]
  steps: GuideStep[]
  relatedIds?: string[]
}

export interface GuideGroup {
  id: string
  label: string
  order: number
}
