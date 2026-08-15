import { apiPath } from '@/shared/lib/api-paths'
import { apiClient } from '@/shared/lib/apiClient'
import { assertBulkItemCount, type BulkJobResponse } from '@/shared/lib/bulkJobs'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import type {
  CreateRegistryApiEndpointBody,
  CreateRegistryAppComponentBody,
  CreateRegistryAppModuleBody,
  CreateRegistryApplicationBody,
  CreateRegistryDataEntityBody,
  CreateCommunicationSpecBody,
  CreateRegistryScreenActionBody,
  CreateRegistryScreenBody,
  CreateRegistryScreenFieldBody,
  CreateRegistryScreenSectionBody,
  CommunicationSpecification,
  RegistryApiEndpoint,
  ApiRequestParam,
  RegistryAppComponent,
  RegistryAppModule,
  RegistryApplication,
  RegistryDataEntity,
  RegistryScreen,
  RegistryScreenAction,
  RegistryScreenField,
  RegistryScreenSection,
  UpdateRegistryApiEndpointBody,
  UpdateRegistryAppComponentBody,
  UpdateRegistryAppModuleBody,
  UpdateRegistryDataEntityBody,
  UpdateCommunicationSpecBody,
  UpdateRegistryScreenActionBody,
  UpdateRegistryScreenBody,
  UpdateRegistryScreenFieldBody,
  UpdateRegistryScreenSectionBody,
} from '../model/application-registry'
import type { AddStructureRelationBody, StructureRelation } from '../model/structure-relation'
import type {
  LinkScreenComponentBody,
  OverallStructureResponse,
  ScreenComponentLink,
  StructureCandidatesResponse,
} from '../model/overall-structure'

export const TRACEABILITY_ENDPOINTS = {
  coverageMatrix: (
    projectId: string,
    params?: {
      q?: string
      coverageStatus?: string
      latestResult?: string
      priority?: string
      module?: string
      releaseId?: string
      hasOpenDefect?: boolean
      limit?: number
      offset?: number
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.q) p.set('q', params.q)
    if (params?.coverageStatus) p.set('coverageStatus', params.coverageStatus)
    if (params?.latestResult) p.set('latestResult', params.latestResult)
    if (params?.priority) p.set('priority', params.priority)
    if (params?.module) p.set('module', params.module)
    if (params?.releaseId) p.set('releaseId', params.releaseId)
    if (params?.hasOpenDefect != null) p.set('hasOpenDefect', String(params.hasOpenDefect))
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return apiPath(`/projects/${projectId}/reports/coverage-matrix`) + (q ? `?${q}` : '')
  },
  coverageMatrixRequirement: (projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/reports/coverage-matrix/requirements/${requirementId}`),
  traceLinks: (
    projectId: string,
    params?: {
      linkType?: string
      sourceType?: string
      sourceId?: string
      targetType?: string
      q?: string
      limit?: number
      offset?: number
    }
  ) => {
    const p = new URLSearchParams()
    if (params?.linkType) p.set('linkType', params.linkType)
    if (params?.sourceType) p.set('sourceType', params.sourceType)
    if (params?.sourceId) p.set('sourceId', params.sourceId)
    if (params?.targetType) p.set('targetType', params.targetType)
    if (params?.q) p.set('q', params.q)
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return apiPath(`/projects/${projectId}/trace-links`) + (q ? `?${q}` : '')
  },
  traceLinksBatch: (projectId: string) => apiPath(`/projects/${projectId}/trace-links/batch`),
  traceLink: (projectId: string, linkId: string) =>
    apiPath(`/projects/${projectId}/trace-links/${linkId}`),
  archiveTraceLink: (projectId: string, linkId: string) =>
    apiPath(`/projects/${projectId}/trace-links/${linkId}/archive`),
  requirementTestCaseLinks: (projectId: string, requirementId: string) =>
    apiPath(`/projects/${projectId}/requirements/${requirementId}/test-case-links`),
  linkableTestCases: (
    projectId: string,
    requirementId: string,
    params?: { q?: string; limit?: number; offset?: number }
  ) => {
    const p = new URLSearchParams()
    if (params?.q) p.set('q', params.q)
    if (params?.limit != null) p.set('limit', String(params.limit))
    if (params?.offset != null) p.set('offset', String(params.offset))
    const q = p.toString()
    return (
      apiPath(`/projects/${projectId}/requirements/${requirementId}/linkable-test-cases`) +
      (q ? `?${q}` : '')
    )
  },
  applications: (workspaceId: string) => apiPath(`/workspaces/${workspaceId}/applications`),
  application: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}`),
  modules: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/modules`),
  modulesBulk: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/modules/bulk`),
  module: (workspaceId: string, applicationId: string, appModuleId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/modules/${appModuleId}`),
  screens: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/screens`),
  screensBulk: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/screens/bulk`),
  screen: (workspaceId: string, applicationId: string, screenId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/screens/${screenId}`),
  apiEndpoints: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/api-endpoints`),
  apiEndpointsBulk: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/api-endpoints/bulk`),
  apiEndpoint: (workspaceId: string, applicationId: string, endpointId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/api-endpoints/${endpointId}`),
  components: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/components`),
  componentsBulk: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/components/bulk`),
  component: (workspaceId: string, applicationId: string, appComponentId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/applications/${applicationId}/components/${appComponentId}`
    ),
  dataEntities: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/data-entities`),
  dataEntitiesBulk: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/data-entities/bulk`),
  dataEntity: (workspaceId: string, applicationId: string, dataEntityId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/applications/${applicationId}/data-entities/${dataEntityId}`
    ),
  communicationSpecs: (workspaceId: string, applicationId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/applications/${applicationId}/communication-specifications`
    ),
  communicationSpec: (workspaceId: string, applicationId: string, communicationSpecId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/applications/${applicationId}/communication-specifications/${communicationSpecId}`
    ),
  communicationSpecMarkReady: (
    workspaceId: string,
    applicationId: string,
    communicationSpecId: string
  ) =>
    apiPath(
      `/workspaces/${workspaceId}/applications/${applicationId}/communication-specifications/${communicationSpecId}/mark-ready`
    ),
  screenSections: (workspaceId: string, screenId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/sections`),
  screenSection: (workspaceId: string, screenId: string, sectionId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/sections/${sectionId}`),
  screenFields: (workspaceId: string, screenId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/fields`),
  screenField: (workspaceId: string, screenId: string, fieldId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/fields/${fieldId}`),
  screenActions: (workspaceId: string, screenId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/actions`),
  screenAction: (workspaceId: string, screenId: string, actionId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/actions/${actionId}`),
  structureRelations: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/structure-relations`),
  structureRelation: (workspaceId: string, applicationId: string, id: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/structure-relations/${id}`),
  overallStructure: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/overall-structure`),
  overallStructureCandidates: (workspaceId: string, applicationId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/applications/${applicationId}/overall-structure/candidates`
    ),
  screenComponents: (workspaceId: string, screenId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/components`),
  screenComponent: (workspaceId: string, screenId: string, componentId: string) =>
    apiPath(`/workspaces/${workspaceId}/screens/${screenId}/components/${componentId}`),
} as const

export type CoverageLatestResult = 'PASSED' | 'FAILED' | 'BLOCKED' | 'NOT_RUN' | 'SKIPPED'

export type CoverageStatusApi = 'MISSING_TESTS' | 'NOT_EVALUATED' | 'AT_RISK' | 'COVERED'

export interface CoverageDefectSummary {
  id: string
  code?: string | null
  title: string
  status?: string | null
  severity?: string | null
}

export interface CoverageTestCaseSummary {
  id: string
  code?: string | null
  title: string
  linkId?: string | null
  latestResult?: CoverageLatestResult | string | null
  latestResultAt?: string | null
}

export interface CoverageTargetRelease {
  id: string
  name: string
  status?: string | null
}

/** Rich coverage row from BE (P0+). Booleans kept for backward compatibility. */
export interface CoverageMatrixCell {
  requirementId: string
  code?: string
  title?: string
  /** @deprecated use code */
  requirementCode?: string
  /** @deprecated use title */
  requirementTitle?: string
  requirementType?: string | null
  priority?: string | null
  moduleName?: string | null
  applicationId?: string | null
  functionalItemId?: string | null
  coverageStatus?: CoverageStatusApi | string | null
  testCaseCount?: number
  executedCount?: number
  passedCount?: number
  failedCount?: number
  blockedCount?: number
  notRunCount?: number
  latestResult?: CoverageLatestResult | string | null
  latestResultAt?: string | null
  latestTestRunId?: string | null
  latestTestCaseId?: string | null
  latestTestCaseCode?: string | null
  latestTestCaseTitle?: string | null
  openDefectCount?: number
  openDefects?: CoverageDefectSummary[]
  targetRelease?: CoverageTargetRelease | null
  testCases?: CoverageTestCaseSummary[]
  /** @deprecated */
  hasTestCase?: boolean
  /** @deprecated */
  hasResult?: boolean
  /** @deprecated */
  hasDefect?: boolean
  /** @deprecated */
  hasRelease?: boolean
  /** @deprecated */
  gap?: boolean
}

export interface CoverageMatrixSummary {
  requirements: number
  covered: number
  coveredPct: number
  missingTests: number
  failed: number
  blocked: number
  notEvaluated?: number
  atRisk?: number
}

export interface CoverageMatrixResponse {
  summary?: CoverageMatrixSummary | null
  items: CoverageMatrixCell[]
  page?: { limit: number; offset: number; total: number } | null
  generatedAt?: string | null
  stale?: boolean | null
}

export interface TraceLink {
  id: string
  sourceType: string
  sourceId: string
  sourceCode?: string | null
  sourceTitle?: string | null
  targetType: string
  targetId: string
  targetCode?: string | null
  targetTitle?: string | null
  linkType: string
  status?: string
  createdAt?: string | null
  createdByUserId?: string | null
  createdByDisplayName?: string | null
  updatedAt?: string | null
}

export interface BatchCreateTraceLinkBody {
  links: Array<{
    sourceType: string
    sourceId: string
    targetType: string
    targetId: string
    linkType: string
  }>
}

export interface BatchCreateTraceLinkResponse {
  created: TraceLink[]
  skipped: Array<{ targetId?: string; sourceId?: string; reason: string }>
  failed: Array<{ targetId?: string; sourceId?: string; reason: string }>
}

export interface LinkableTestCase {
  id: string
  code?: string | null
  title: string
  status?: string | null
  type?: string | null
}

/** @deprecated Prefer RegistryApplication — kept for existing list callers */
export type ApplicationItem = RegistryApplication

export async function getCoverageMatrix(
  projectId: string,
  params?: {
    q?: string
    coverageStatus?: string
    latestResult?: string
    priority?: string
    module?: string
    releaseId?: string
    hasOpenDefect?: boolean
    limit?: number
    offset?: number
  }
): Promise<CoverageMatrixResponse> {
  const res = await apiClient.get<
    CoverageMatrixResponse | CoverageMatrixCell[] | ListPayload<CoverageMatrixCell>
  >(TRACEABILITY_ENDPOINTS.coverageMatrix(projectId, params))

  // New shape: { summary, items, page }
  if (res && typeof res === 'object' && !Array.isArray(res) && 'items' in res) {
    const typed = res as CoverageMatrixResponse
    return {
      summary: typed.summary ?? null,
      items: typed.items ?? [],
      page: typed.page ?? null,
      generatedAt: typed.generatedAt ?? null,
      stale: typed.stale ?? null,
    }
  }

  // Legacy: bare list
  const { items } = normalizeItemList(res as ListPayload<CoverageMatrixCell>)
  return { summary: null, items, page: null }
}

export async function getCoverageMatrixRequirement(
  projectId: string,
  requirementId: string
): Promise<CoverageMatrixCell> {
  return apiClient.get<CoverageMatrixCell>(
    TRACEABILITY_ENDPOINTS.coverageMatrixRequirement(projectId, requirementId)
  )
}

export async function listTraceLinks(
  projectId: string,
  params?: {
    linkType?: string
    sourceType?: string
    sourceId?: string
    targetType?: string
    q?: string
    limit?: number
    offset?: number
  }
): Promise<{ items: TraceLink[] }> {
  const res = await apiClient.get<ListPayload<TraceLink>>(
    TRACEABILITY_ENDPOINTS.traceLinks(projectId, params)
  )
  return normalizeItemList(res)
}

export async function createTraceLink(
  projectId: string,
  body: {
    sourceType: string
    sourceId: string
    targetType: string
    targetId: string
    linkType: string
  },
  init?: { skipErrorToast?: boolean }
): Promise<TraceLink> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.traceLinks(projectId), body, init)
}

export async function deleteTraceLink(projectId: string, linkId: string): Promise<void> {
  await apiClient.patch<void>(
    TRACEABILITY_ENDPOINTS.archiveTraceLink(projectId, linkId),
    {},
    { parseJson: false }
  )
}

export async function batchCreateTraceLinks(
  projectId: string,
  body: BatchCreateTraceLinkBody
): Promise<BatchCreateTraceLinkResponse> {
  return apiClient.post<BatchCreateTraceLinkResponse>(
    TRACEABILITY_ENDPOINTS.traceLinksBatch(projectId),
    body
  )
}

export async function linkTestCasesToRequirement(
  projectId: string,
  requirementId: string,
  testCaseIds: string[]
): Promise<BatchCreateTraceLinkResponse | TraceLink[]> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.requirementTestCaseLinks(projectId, requirementId), {
    testCaseIds,
  })
}

export async function listLinkableTestCases(
  projectId: string,
  requirementId: string,
  params?: { q?: string; limit?: number; offset?: number }
): Promise<{ items: LinkableTestCase[] }> {
  const res = await apiClient.get<ListPayload<LinkableTestCase>>(
    TRACEABILITY_ENDPOINTS.linkableTestCases(projectId, requirementId, params)
  )
  return normalizeItemList(res)
}

export async function listApplications(
  workspaceId: string
): Promise<{ items: RegistryApplication[] }> {
  const res = await apiClient.get<ListPayload<RegistryApplication>>(
    TRACEABILITY_ENDPOINTS.applications(workspaceId)
  )
  return normalizeItemList(res)
}

export async function getApplication(
  workspaceId: string,
  applicationId: string
): Promise<RegistryApplication> {
  return apiClient.get<RegistryApplication>(
    TRACEABILITY_ENDPOINTS.application(workspaceId, applicationId)
  )
}

export async function createApplication(
  workspaceId: string,
  body: CreateRegistryApplicationBody
): Promise<RegistryApplication> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.applications(workspaceId), body)
}

export async function listAppModules(
  workspaceId: string,
  applicationId: string
): Promise<{ items: RegistryAppModule[] }> {
  const res = await apiClient.get<ListPayload<RegistryAppModule>>(
    TRACEABILITY_ENDPOINTS.modules(workspaceId, applicationId)
  )
  return normalizeItemList(res)
}

export async function createAppModule(
  workspaceId: string,
  applicationId: string,
  body: CreateRegistryAppModuleBody
): Promise<RegistryAppModule> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.modules(workspaceId, applicationId), body)
}

export async function submitAppModulesBulk(
  workspaceId: string,
  applicationId: string,
  items: CreateRegistryAppModuleBody[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(
    TRACEABILITY_ENDPOINTS.modulesBulk(workspaceId, applicationId),
    { items },
    { skipGlobalLoading: true }
  )
}

export async function updateAppModule(
  workspaceId: string,
  applicationId: string,
  appModuleId: string,
  body: UpdateRegistryAppModuleBody
): Promise<RegistryAppModule> {
  return apiClient.put(TRACEABILITY_ENDPOINTS.module(workspaceId, applicationId, appModuleId), body)
}

export async function deleteAppModule(
  workspaceId: string,
  applicationId: string,
  appModuleId: string
): Promise<void> {
  await apiClient.delete<void>(
    TRACEABILITY_ENDPOINTS.module(workspaceId, applicationId, appModuleId)
  )
}

export async function listScreens(
  workspaceId: string,
  applicationId: string
): Promise<{ items: RegistryScreen[] }> {
  const res = await apiClient.get<ListPayload<RegistryScreen>>(
    TRACEABILITY_ENDPOINTS.screens(workspaceId, applicationId)
  )
  return normalizeItemList(res)
}

export async function createScreen(
  workspaceId: string,
  applicationId: string,
  body: CreateRegistryScreenBody
): Promise<RegistryScreen> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.screens(workspaceId, applicationId), body)
}

export async function submitScreensBulk(
  workspaceId: string,
  applicationId: string,
  items: CreateRegistryScreenBody[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(
    TRACEABILITY_ENDPOINTS.screensBulk(workspaceId, applicationId),
    { items },
    { skipGlobalLoading: true }
  )
}

export async function updateScreen(
  workspaceId: string,
  applicationId: string,
  screenId: string,
  body: UpdateRegistryScreenBody
): Promise<RegistryScreen> {
  return apiClient.put(TRACEABILITY_ENDPOINTS.screen(workspaceId, applicationId, screenId), body)
}

export async function deleteScreen(
  workspaceId: string,
  applicationId: string,
  screenId: string
): Promise<void> {
  await apiClient.delete<void>(TRACEABILITY_ENDPOINTS.screen(workspaceId, applicationId, screenId))
}

const API_PARAM_LOCATIONS = new Set(['QUERY', 'PATH', 'BODY', 'HEADER'])

function mapApiRequestParam(raw: unknown): ApiRequestParam | null {
  const r = asRecord(raw)
  const name = String(r.name ?? '').trim()
  if (!name) return null
  const loc = String(r.in ?? '').toUpperCase()
  return {
    name,
    in: (API_PARAM_LOCATIONS.has(loc) ? loc : 'QUERY') as ApiRequestParam['in'],
    type: String(r.type ?? 'string'),
    required: r.required == null ? false : Boolean(r.required),
    description: r.description == null ? null : String(r.description),
    example: r.example == null ? null : String(r.example),
  }
}

function parseRequestParams(raw: unknown): ApiRequestParam[] | null {
  let value: unknown = raw
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (!trimmed) return null
    try {
      value = JSON.parse(trimmed) as unknown
    } catch {
      return null
    }
  }
  if (!Array.isArray(value)) return null
  return value.map(mapApiRequestParam).filter((item): item is ApiRequestParam => item != null)
}

function mapRegistryApiEndpoint(raw: unknown): RegistryApiEndpoint {
  const r = asRecord(raw)
  return {
    id: String(r.id ?? ''),
    applicationId: String(r.applicationId ?? r.application_id ?? ''),
    method: String(r.method ?? 'GET'),
    pathPattern: String(r.pathPattern ?? r.path_pattern ?? ''),
    name: r.name == null ? null : String(r.name),
    description: r.description == null ? null : String(r.description),
    requestParams: parseRequestParams(
      r.requestParams ?? r.request_params ?? r.requestParamsJson ?? r.request_params_json
    ),
    responseSchemaJson:
      r.responseSchemaJson == null && r.response_schema_json == null
        ? null
        : String(r.responseSchemaJson ?? r.response_schema_json),
    status: String(r.status ?? 'ACTIVE'),
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
  }
}

export async function listApiEndpoints(
  workspaceId: string,
  applicationId: string
): Promise<{ items: RegistryApiEndpoint[] }> {
  const res = await apiClient.get<ListPayload<unknown>>(
    TRACEABILITY_ENDPOINTS.apiEndpoints(workspaceId, applicationId)
  )
  return { items: normalizeItemList(res).items.map(mapRegistryApiEndpoint) }
}

export async function getApiEndpoint(
  workspaceId: string,
  applicationId: string,
  endpointId: string
): Promise<RegistryApiEndpoint> {
  const res = await apiClient.get<unknown>(
    TRACEABILITY_ENDPOINTS.apiEndpoint(workspaceId, applicationId, endpointId)
  )
  return mapRegistryApiEndpoint(res)
}

export async function createApiEndpoint(
  workspaceId: string,
  applicationId: string,
  body: CreateRegistryApiEndpointBody
): Promise<RegistryApiEndpoint> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.apiEndpoints(workspaceId, applicationId), body)
}

export async function submitApiEndpointsBulk(
  workspaceId: string,
  applicationId: string,
  items: CreateRegistryApiEndpointBody[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(
    TRACEABILITY_ENDPOINTS.apiEndpointsBulk(workspaceId, applicationId),
    { items },
    { skipGlobalLoading: true }
  )
}

export async function updateApiEndpoint(
  workspaceId: string,
  applicationId: string,
  endpointId: string,
  body: UpdateRegistryApiEndpointBody
): Promise<RegistryApiEndpoint> {
  const res = await apiClient.put<unknown>(
    TRACEABILITY_ENDPOINTS.apiEndpoint(workspaceId, applicationId, endpointId),
    body
  )
  return mapRegistryApiEndpoint(res)
}

export async function deleteApiEndpoint(
  workspaceId: string,
  applicationId: string,
  endpointId: string
): Promise<void> {
  await apiClient.delete<void>(
    TRACEABILITY_ENDPOINTS.apiEndpoint(workspaceId, applicationId, endpointId)
  )
}

export async function listAppComponents(
  workspaceId: string,
  applicationId: string
): Promise<{ items: RegistryAppComponent[] }> {
  const res = await apiClient.get<ListPayload<RegistryAppComponent>>(
    TRACEABILITY_ENDPOINTS.components(workspaceId, applicationId)
  )
  return normalizeItemList(res)
}

export async function createAppComponent(
  workspaceId: string,
  applicationId: string,
  body: CreateRegistryAppComponentBody
): Promise<RegistryAppComponent> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.components(workspaceId, applicationId), body)
}

export async function submitAppComponentsBulk(
  workspaceId: string,
  applicationId: string,
  items: CreateRegistryAppComponentBody[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(
    TRACEABILITY_ENDPOINTS.componentsBulk(workspaceId, applicationId),
    { items },
    { skipGlobalLoading: true }
  )
}

export async function updateAppComponent(
  workspaceId: string,
  applicationId: string,
  appComponentId: string,
  body: UpdateRegistryAppComponentBody
): Promise<RegistryAppComponent> {
  return apiClient.put(
    TRACEABILITY_ENDPOINTS.component(workspaceId, applicationId, appComponentId),
    body
  )
}

export async function deleteAppComponent(
  workspaceId: string,
  applicationId: string,
  appComponentId: string
): Promise<void> {
  await apiClient.delete<void>(
    TRACEABILITY_ENDPOINTS.component(workspaceId, applicationId, appComponentId)
  )
}

export async function listDataEntities(
  workspaceId: string,
  applicationId: string,
  params?: { moduleId?: string }
): Promise<{ items: RegistryDataEntity[] }> {
  const q = new URLSearchParams()
  if (params?.moduleId) q.set('moduleId', params.moduleId)
  const qs = q.toString()
  const res = await apiClient.get<ListPayload<RegistryDataEntity>>(
    TRACEABILITY_ENDPOINTS.dataEntities(workspaceId, applicationId) + (qs ? `?${qs}` : '')
  )
  return normalizeItemList(res)
}

export async function createDataEntity(
  workspaceId: string,
  applicationId: string,
  body: CreateRegistryDataEntityBody
): Promise<RegistryDataEntity> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.dataEntities(workspaceId, applicationId), body)
}

export async function submitDataEntitiesBulk(
  workspaceId: string,
  applicationId: string,
  items: CreateRegistryDataEntityBody[]
): Promise<BulkJobResponse> {
  assertBulkItemCount(items.length)
  return apiClient.post<BulkJobResponse>(
    TRACEABILITY_ENDPOINTS.dataEntitiesBulk(workspaceId, applicationId),
    { items },
    { skipGlobalLoading: true }
  )
}

export async function updateDataEntity(
  workspaceId: string,
  applicationId: string,
  dataEntityId: string,
  body: UpdateRegistryDataEntityBody
): Promise<RegistryDataEntity> {
  return apiClient.put(
    TRACEABILITY_ENDPOINTS.dataEntity(workspaceId, applicationId, dataEntityId),
    body
  )
}

export async function deleteDataEntity(
  workspaceId: string,
  applicationId: string,
  dataEntityId: string
): Promise<void> {
  await apiClient.delete<void>(
    TRACEABILITY_ENDPOINTS.dataEntity(workspaceId, applicationId, dataEntityId)
  )
}

export async function listCommunicationSpecs(
  workspaceId: string,
  applicationId: string
): Promise<{ items: CommunicationSpecification[] }> {
  const res = await apiClient.get<ListPayload<CommunicationSpecification>>(
    TRACEABILITY_ENDPOINTS.communicationSpecs(workspaceId, applicationId)
  )
  return normalizeItemList(res)
}

export async function createCommunicationSpec(
  workspaceId: string,
  applicationId: string,
  body: CreateCommunicationSpecBody
): Promise<CommunicationSpecification> {
  return apiClient.post(
    TRACEABILITY_ENDPOINTS.communicationSpecs(workspaceId, applicationId),
    body
  )
}

export async function updateCommunicationSpec(
  workspaceId: string,
  applicationId: string,
  communicationSpecId: string,
  body: UpdateCommunicationSpecBody
): Promise<CommunicationSpecification> {
  return apiClient.put(
    TRACEABILITY_ENDPOINTS.communicationSpec(workspaceId, applicationId, communicationSpecId),
    body
  )
}

export async function archiveCommunicationSpec(
  workspaceId: string,
  applicationId: string,
  communicationSpecId: string
): Promise<void> {
  await apiClient.delete<void>(
    TRACEABILITY_ENDPOINTS.communicationSpec(workspaceId, applicationId, communicationSpecId)
  )
}

export async function markCommunicationSpecReady(
  workspaceId: string,
  applicationId: string,
  communicationSpecId: string
): Promise<CommunicationSpecification> {
  return apiClient.post(
    TRACEABILITY_ENDPOINTS.communicationSpecMarkReady(
      workspaceId,
      applicationId,
      communicationSpecId
    ),
    {}
  )
}

export async function listScreenSections(
  workspaceId: string,
  screenId: string
): Promise<{ items: RegistryScreenSection[] }> {
  const res = await apiClient.get<ListPayload<RegistryScreenSection>>(
    TRACEABILITY_ENDPOINTS.screenSections(workspaceId, screenId)
  )
  return normalizeItemList(res)
}

export async function createScreenSection(
  workspaceId: string,
  screenId: string,
  body: CreateRegistryScreenSectionBody
): Promise<RegistryScreenSection> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.screenSections(workspaceId, screenId), body)
}

export async function updateScreenSection(
  workspaceId: string,
  screenId: string,
  sectionId: string,
  body: UpdateRegistryScreenSectionBody
): Promise<RegistryScreenSection> {
  return apiClient.put(TRACEABILITY_ENDPOINTS.screenSection(workspaceId, screenId, sectionId), body)
}

export async function deleteScreenSection(
  workspaceId: string,
  screenId: string,
  sectionId: string
): Promise<void> {
  await apiClient.delete<void>(
    TRACEABILITY_ENDPOINTS.screenSection(workspaceId, screenId, sectionId)
  )
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function mapRegistryScreenField(raw: unknown): RegistryScreenField {
  const r = asRecord(raw)
  const componentId = r.componentId ?? r.component_id
  const dataEntityFieldId = r.dataEntityFieldId ?? r.data_entity_field_id
  const componentFieldId = r.componentFieldId ?? r.component_field_id
  return {
    id: String(r.id ?? ''),
    screenId: String(r.screenId ?? r.screen_id ?? ''),
    sectionId: r.sectionId != null || r.section_id != null ? String(r.sectionId ?? r.section_id) : null,
    workspaceId: String(r.workspaceId ?? r.workspace_id ?? ''),
    fieldKey: String(r.fieldKey ?? r.field_key ?? ''),
    label: String(r.label ?? ''),
    fieldType: String(r.fieldType ?? r.field_type ?? 'TEXT'),
    description: r.description == null ? null : String(r.description),
    required: r.required == null ? null : Boolean(r.required),
    displayOrder:
      r.displayOrder == null && r.display_order == null
        ? null
        : Number(r.displayOrder ?? r.display_order),
    status: String(r.status ?? 'ACTIVE'),
    createdAt: String(r.createdAt ?? r.created_at ?? ''),
    componentId: componentId == null || componentId === '' ? null : String(componentId),
    dataEntityFieldId:
      dataEntityFieldId == null || dataEntityFieldId === '' ? null : String(dataEntityFieldId),
    componentFieldId:
      componentFieldId == null || componentFieldId === '' ? null : String(componentFieldId),
  }
}

export async function listScreenFields(
  workspaceId: string,
  screenId: string
): Promise<{ items: RegistryScreenField[] }> {
  const res = await apiClient.get<ListPayload<unknown>>(
    TRACEABILITY_ENDPOINTS.screenFields(workspaceId, screenId)
  )
  return { items: normalizeItemList(res).items.map(mapRegistryScreenField) }
}

export async function createScreenField(
  workspaceId: string,
  screenId: string,
  body: CreateRegistryScreenFieldBody
): Promise<RegistryScreenField> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.screenFields(workspaceId, screenId), body)
}

export async function updateScreenField(
  workspaceId: string,
  screenId: string,
  fieldId: string,
  body: UpdateRegistryScreenFieldBody
): Promise<RegistryScreenField> {
  return apiClient.put(TRACEABILITY_ENDPOINTS.screenField(workspaceId, screenId, fieldId), body)
}

export async function deleteScreenField(
  workspaceId: string,
  screenId: string,
  fieldId: string
): Promise<void> {
  await apiClient.delete<void>(TRACEABILITY_ENDPOINTS.screenField(workspaceId, screenId, fieldId))
}

export async function listScreenActions(
  workspaceId: string,
  screenId: string
): Promise<{ items: RegistryScreenAction[] }> {
  const res = await apiClient.get<ListPayload<RegistryScreenAction>>(
    TRACEABILITY_ENDPOINTS.screenActions(workspaceId, screenId)
  )
  return normalizeItemList(res)
}

export async function createScreenAction(
  workspaceId: string,
  screenId: string,
  body: CreateRegistryScreenActionBody
): Promise<RegistryScreenAction> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.screenActions(workspaceId, screenId), body)
}

export async function updateScreenAction(
  workspaceId: string,
  screenId: string,
  actionId: string,
  body: UpdateRegistryScreenActionBody
): Promise<RegistryScreenAction> {
  return apiClient.put(TRACEABILITY_ENDPOINTS.screenAction(workspaceId, screenId, actionId), body)
}

export async function deleteScreenAction(
  workspaceId: string,
  screenId: string,
  actionId: string
): Promise<void> {
  await apiClient.delete<void>(TRACEABILITY_ENDPOINTS.screenAction(workspaceId, screenId, actionId))
}

export async function listStructureRelations(
  workspaceId: string,
  applicationId: string,
  params?: { nodeType?: string; nodeId?: string }
): Promise<{ items: StructureRelation[] }> {
  const q = new URLSearchParams()
  if (params?.nodeType) q.set('nodeType', params.nodeType)
  if (params?.nodeId) q.set('nodeId', params.nodeId)
  const qs = q.toString()
  const url =
    TRACEABILITY_ENDPOINTS.structureRelations(workspaceId, applicationId) + (qs ? `?${qs}` : '')
  const res = await apiClient.get<ListPayload<StructureRelation>>(url)
  return normalizeItemList(res)
}

export async function createStructureRelation(
  workspaceId: string,
  applicationId: string,
  body: AddStructureRelationBody
): Promise<StructureRelation> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.structureRelations(workspaceId, applicationId), body)
}

export async function deleteStructureRelation(
  workspaceId: string,
  applicationId: string,
  id: string
): Promise<void> {
  await apiClient.delete<void>(
    TRACEABILITY_ENDPOINTS.structureRelation(workspaceId, applicationId, id)
  )
}

export async function getOverallStructure(
  workspaceId: string,
  applicationId: string
): Promise<OverallStructureResponse> {
  return apiClient.get(TRACEABILITY_ENDPOINTS.overallStructure(workspaceId, applicationId))
}

export async function getOverallStructureCandidates(
  workspaceId: string,
  applicationId: string,
  params: { focusType: string; focusId: string }
): Promise<StructureCandidatesResponse> {
  const q = new URLSearchParams()
  q.set('focusType', params.focusType)
  q.set('focusId', params.focusId)
  return apiClient.get(
    TRACEABILITY_ENDPOINTS.overallStructureCandidates(workspaceId, applicationId) +
      `?${q.toString()}`
  )
}

export async function listScreenComponents(
  workspaceId: string,
  screenId: string
): Promise<{ items: ScreenComponentLink[] }> {
  const res = await apiClient.get<ListPayload<ScreenComponentLink>>(
    TRACEABILITY_ENDPOINTS.screenComponents(workspaceId, screenId)
  )
  return normalizeItemList(res)
}

export async function linkScreenComponent(
  workspaceId: string,
  screenId: string,
  body: LinkScreenComponentBody
): Promise<ScreenComponentLink> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.screenComponents(workspaceId, screenId), body)
}

export async function unlinkScreenComponent(
  workspaceId: string,
  screenId: string,
  componentId: string
): Promise<void> {
  await apiClient.delete<void>(
    TRACEABILITY_ENDPOINTS.screenComponent(workspaceId, screenId, componentId)
  )
}
