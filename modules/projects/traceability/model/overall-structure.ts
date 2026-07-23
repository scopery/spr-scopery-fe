/**
 * Application Overall Structure — match BE OverallStructure / Candidates DTOs.
 */

export const StructureFocusType = {
  Module: 'MODULE',
  Function: 'FUNCTION',
  Screen: 'SCREEN',
  ApiEndpoint: 'API_ENDPOINT',
  Component: 'COMPONENT',
  Entity: 'ENTITY',
  Nfr: 'NFR',
} as const
export type StructureFocusType =
  (typeof StructureFocusType)[keyof typeof StructureFocusType]

export const NfrScopeTargetType = {
  Module: 'MODULE',
  Function: 'FUNCTION',
  Screen: 'SCREEN',
} as const
export type NfrScopeTargetType =
  (typeof NfrScopeTargetType)[keyof typeof NfrScopeTargetType]

export interface StructureFocus {
  type: StructureFocusType
  id: string
}

export interface OverallStructureComponentRef {
  id: string
  code: string
  name: string
  componentType?: string | null
  displayOrder?: number | null
  sectionId?: string | null
  note?: string | null
}

export interface OverallStructureScreenRef {
  id: string
  code: string
  name: string
  routePath?: string | null
  usedByFunctionCount?: number | null
  components: OverallStructureComponentRef[]
}

export interface OverallStructureApiRef {
  id: string
  method: string
  pathPattern: string
  name?: string | null
  usedByFunctionCount?: number | null
}

export interface OverallStructureEntityRef {
  id: string
  code: string
  name: string
  tableName?: string | null
  moduleId?: string | null
}

export interface OverallStructureFunctionRef {
  id: string
  projectId?: string | null
  code: string
  title: string
  moduleId?: string | null
  screens: OverallStructureScreenRef[]
  apis: OverallStructureApiRef[]
}

export interface OverallStructureNfrRef {
  id: string
  projectId?: string | null
  code: string
  title: string
  category?: string | null
}

export interface OverallStructureModule {
  id: string
  code: string
  name: string
  description?: string | null
  functions: OverallStructureFunctionRef[]
  entities: OverallStructureEntityRef[]
  scopedNfrs?: OverallStructureNfrRef[]
}

export interface OverallStructureResponse {
  applicationId: string
  workspaceId: string
  modules: OverallStructureModule[]
  unassignedFunctions?: OverallStructureFunctionRef[]
  unassignedEntities?: OverallStructureEntityRef[]
  applicationNfrs?: OverallStructureNfrRef[]
}

export interface StructureCandidateItem {
  id: string
  kind: StructureFocusType | string
  code?: string | null
  name: string
  secondary?: string | null
  /** Optional long text for hover detail (e.g. FR description). */
  description?: string | null
  /** Linked to the current focus (already assigned here). */
  alreadyLinked?: boolean
  /** Has any existing ownership/link (e.g. function already on another module). */
  hasExistingLink?: boolean
  projectId?: string | null
}

export interface StructureCandidatesResponse {
  focusType: string
  focusId: string
  screens?: StructureCandidateItem[]
  apis?: StructureCandidateItem[]
  components?: StructureCandidateItem[]
  functions?: StructureCandidateItem[]
  entities?: StructureCandidateItem[]
  modules?: StructureCandidateItem[]
  /** NFRs that can be scoped onto Module / Function / Screen focus */
  nfrs?: StructureCandidateItem[]
  nfrTargets?: StructureCandidateItem[]
}

/** Normalize BE candidate payloads (alternate field names / missing arrays). */
export function normalizeStructureCandidates(
  raw: StructureCandidatesResponse | Record<string, unknown> | null | undefined,
  focus: StructureFocus
): StructureCandidatesResponse {
  const r = (raw ?? {}) as Record<string, unknown>
  const asList = (v: unknown): StructureCandidateItem[] => {
    if (!Array.isArray(v)) return []
    return v.filter(Boolean) as StructureCandidateItem[]
  }

  return {
    focusType: String(r.focusType ?? focus.type),
    focusId: String(r.focusId ?? focus.id),
    screens: asList(r.screens),
    apis: asList(r.apis ?? r.apiEndpoints),
    components: asList(r.components),
    functions: asList(r.functions ?? r.functionalItems),
    entities: asList(r.entities ?? r.dataEntities),
    modules: asList(r.modules),
    nfrs: asList(r.nfrs ?? r.nonFunctionalItems),
    nfrTargets: asList(r.nfrTargets),
  }
}

export interface FunctionScreenLink {
  functionId: string
  screenId: string
  note?: string | null
  createdAt?: string
}

export interface FunctionApiLink {
  functionId: string
  apiEndpointId: string
  note?: string | null
  createdAt?: string
}

export interface ScreenComponentLink {
  screenId: string
  componentId: string
  sectionId?: string | null
  displayOrder?: number | null
  note?: string | null
  createdAt?: string
}

export interface NfrScopeTarget {
  nfrId: string
  targetId: string
  targetType: NfrScopeTargetType | string
  note?: string | null
  createdAt?: string
}

export interface LinkFunctionScreenBody {
  screenId: string
  note?: string | null
}

export interface LinkFunctionApiBody {
  apiEndpointId: string
  note?: string | null
}

export interface LinkScreenComponentBody {
  componentId: string
  sectionId?: string | null
  displayOrder?: number | null
  note?: string | null
}

export interface LinkNfrScopeTargetBody {
  targetId: string
  targetType: NfrScopeTargetType | string
  note?: string | null
}
