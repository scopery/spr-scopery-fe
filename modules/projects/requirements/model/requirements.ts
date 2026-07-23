export type RequirementType = 'BO' | 'BR' | 'FR' | 'NFR'

export interface Requirement {
  id: string
  project_id: string
  code: string
  title: string
  req_type?: RequirementType
  type?: RequirementType
  parent_id: string | null
  description: string | null
  created_at: string
  updated_at?: string
  /** Catalog FK (WAVE4) — camelCase from BE RequirementResponse */
  functionalItemId?: string | null
  nonFunctionalItemId?: string | null
  applicationId?: string | null
}

export interface RequirementsListResponse {
  items: Requirement[]
  page?: { limit: number; offset: number; total: number }
}
