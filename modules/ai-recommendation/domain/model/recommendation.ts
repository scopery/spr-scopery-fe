export interface AiRecommendation {
  id: string
  /** Contract: `{sourceSystem}:{suggestionId}` when available */
  suggestionRef?: string
  projectId?: string | null
  title: string
  summary?: string | null
  status: string
  severity?: string | null
  entityType?: string | null
  entityId?: string | null
  createdAt: string
}

export function recommendationRef(item: AiRecommendation): string {
  return item.suggestionRef ?? item.id
}
