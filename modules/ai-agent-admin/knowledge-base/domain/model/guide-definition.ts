export interface AiGuideDefinition {
  id: string
  code: string
  pageCode: string
  fieldCode: string | null
  actionCode: string | null
  locale: string
  title: string
  bodyMarkdown: string
  metadataVersion: number
  sourceKind: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface CreateAiGuideDefinitionPayload {
  pageCode: string
  locale: string
  title: string
  bodyMarkdown: string
  fieldCode?: string | null
  actionCode?: string | null
}

export interface UpdateAiGuideDefinitionPayload {
  title?: string
  bodyMarkdown?: string
  status?: string
}
