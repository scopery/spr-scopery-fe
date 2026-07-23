import { apiPath } from '@/shared/lib/api-paths'
import { apiClient } from '@/shared/lib/apiClient'
import { normalizeItemList, type ListPayload } from '@/shared/lib/normalizeListResponse'
import type {
  CreateRegistryApiEndpointBody,
  CreateRegistryAppComponentBody,
  CreateRegistryAppModuleBody,
  CreateRegistryApplicationBody,
  CreateRegistryDataEntityBody,
  CreateRegistryScreenActionBody,
  CreateRegistryScreenBody,
  CreateRegistryScreenFieldBody,
  CreateRegistryScreenSectionBody,
  RegistryApiEndpoint,
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
  UpdateRegistryScreenActionBody,
  UpdateRegistryScreenBody,
  UpdateRegistryScreenFieldBody,
  UpdateRegistryScreenSectionBody,
} from '../model/application-registry'
import type {
  AddStructureRelationBody,
  StructureRelation,
} from '../model/structure-relation'
import type {
  LinkScreenComponentBody,
  OverallStructureResponse,
  ScreenComponentLink,
  StructureCandidatesResponse,
} from '../model/overall-structure'

export const TRACEABILITY_ENDPOINTS = {
  coverageMatrix: (projectId: string) =>
    apiPath(`/projects/${projectId}/reports/coverage-matrix`),
  traceLinks: (projectId: string) => apiPath(`/projects/${projectId}/trace-links`),
  applications: (workspaceId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications`),
  application: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}`),
  modules: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/modules`),
  module: (workspaceId: string, applicationId: string, appModuleId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/modules/${appModuleId}`),
  screens: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/screens`),
  screen: (workspaceId: string, applicationId: string, screenId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/screens/${screenId}`),
  apiEndpoints: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/api-endpoints`),
  apiEndpoint: (workspaceId: string, applicationId: string, endpointId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/applications/${applicationId}/api-endpoints/${endpointId}`
    ),
  components: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/components`),
  component: (workspaceId: string, applicationId: string, appComponentId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/applications/${applicationId}/components/${appComponentId}`
    ),
  dataEntities: (workspaceId: string, applicationId: string) =>
    apiPath(`/workspaces/${workspaceId}/applications/${applicationId}/data-entities`),
  dataEntity: (workspaceId: string, applicationId: string, dataEntityId: string) =>
    apiPath(
      `/workspaces/${workspaceId}/applications/${applicationId}/data-entities/${dataEntityId}`
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
    apiPath(
      `/workspaces/${workspaceId}/applications/${applicationId}/structure-relations/${id}`
    ),
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

export interface CoverageMatrixCell {
  requirementId: string
  requirementCode?: string
  requirementTitle?: string
  hasTestCase?: boolean
  hasResult?: boolean
  hasDefect?: boolean
  hasRelease?: boolean
  gap?: boolean
}

export interface TraceLink {
  id: string
  sourceType: string
  sourceId: string
  targetType: string
  targetId: string
  linkType: string
  status?: string
}

/** @deprecated Prefer RegistryApplication — kept for existing list callers */
export type ApplicationItem = RegistryApplication

export async function getCoverageMatrix(
  projectId: string
): Promise<{ items: CoverageMatrixCell[] }> {
  const res = await apiClient.get<ListPayload<CoverageMatrixCell>>(
    TRACEABILITY_ENDPOINTS.coverageMatrix(projectId)
  )
  return normalizeItemList(res)
}

export async function listTraceLinks(
  projectId: string
): Promise<{ items: TraceLink[] }> {
  const res = await apiClient.get<ListPayload<TraceLink>>(
    TRACEABILITY_ENDPOINTS.traceLinks(projectId)
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
  }
): Promise<TraceLink> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.traceLinks(projectId), body)
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

export async function updateAppModule(
  workspaceId: string,
  applicationId: string,
  appModuleId: string,
  body: UpdateRegistryAppModuleBody
): Promise<RegistryAppModule> {
  return apiClient.put(
    TRACEABILITY_ENDPOINTS.module(workspaceId, applicationId, appModuleId),
    body
  )
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

export async function updateScreen(
  workspaceId: string,
  applicationId: string,
  screenId: string,
  body: UpdateRegistryScreenBody
): Promise<RegistryScreen> {
  return apiClient.put(
    TRACEABILITY_ENDPOINTS.screen(workspaceId, applicationId, screenId),
    body
  )
}

export async function deleteScreen(
  workspaceId: string,
  applicationId: string,
  screenId: string
): Promise<void> {
  await apiClient.delete<void>(
    TRACEABILITY_ENDPOINTS.screen(workspaceId, applicationId, screenId)
  )
}

export async function listApiEndpoints(
  workspaceId: string,
  applicationId: string
): Promise<{ items: RegistryApiEndpoint[] }> {
  const res = await apiClient.get<ListPayload<RegistryApiEndpoint>>(
    TRACEABILITY_ENDPOINTS.apiEndpoints(workspaceId, applicationId)
  )
  return normalizeItemList(res)
}

export async function createApiEndpoint(
  workspaceId: string,
  applicationId: string,
  body: CreateRegistryApiEndpointBody
): Promise<RegistryApiEndpoint> {
  return apiClient.post(TRACEABILITY_ENDPOINTS.apiEndpoints(workspaceId, applicationId), body)
}

export async function updateApiEndpoint(
  workspaceId: string,
  applicationId: string,
  endpointId: string,
  body: UpdateRegistryApiEndpointBody
): Promise<RegistryApiEndpoint> {
  return apiClient.put(
    TRACEABILITY_ENDPOINTS.apiEndpoint(workspaceId, applicationId, endpointId),
    body
  )
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
    TRACEABILITY_ENDPOINTS.dataEntities(workspaceId, applicationId) +
      (qs ? `?${qs}` : '')
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
  return apiClient.put(
    TRACEABILITY_ENDPOINTS.screenSection(workspaceId, screenId, sectionId),
    body
  )
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

export async function listScreenFields(
  workspaceId: string,
  screenId: string
): Promise<{ items: RegistryScreenField[] }> {
  const res = await apiClient.get<ListPayload<RegistryScreenField>>(
    TRACEABILITY_ENDPOINTS.screenFields(workspaceId, screenId)
  )
  return normalizeItemList(res)
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
  return apiClient.put(
    TRACEABILITY_ENDPOINTS.screenField(workspaceId, screenId, fieldId),
    body
  )
}

export async function deleteScreenField(
  workspaceId: string,
  screenId: string,
  fieldId: string
): Promise<void> {
  await apiClient.delete<void>(
    TRACEABILITY_ENDPOINTS.screenField(workspaceId, screenId, fieldId)
  )
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
  return apiClient.put(
    TRACEABILITY_ENDPOINTS.screenAction(workspaceId, screenId, actionId),
    body
  )
}

export async function deleteScreenAction(
  workspaceId: string,
  screenId: string,
  actionId: string
): Promise<void> {
  await apiClient.delete<void>(
    TRACEABILITY_ENDPOINTS.screenAction(workspaceId, screenId, actionId)
  )
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
    TRACEABILITY_ENDPOINTS.structureRelations(workspaceId, applicationId) +
    (qs ? `?${qs}` : '')
  const res = await apiClient.get<ListPayload<StructureRelation>>(url)
  return normalizeItemList(res)
}

export async function createStructureRelation(
  workspaceId: string,
  applicationId: string,
  body: AddStructureRelationBody
): Promise<StructureRelation> {
  return apiClient.post(
    TRACEABILITY_ENDPOINTS.structureRelations(workspaceId, applicationId),
    body
  )
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
  return apiClient.get(
    TRACEABILITY_ENDPOINTS.overallStructure(workspaceId, applicationId)
  )
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
  return apiClient.post(
    TRACEABILITY_ENDPOINTS.screenComponents(workspaceId, screenId),
    body
  )
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
