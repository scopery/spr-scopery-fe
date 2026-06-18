/**
 * Project service — v2 API
 */

import { PROJECT_ENDPOINTS } from '@/constants/endpoints'
import { apiClient } from '@/shared/lib/apiClient'
import { normalizeQuestionTypeForApi } from '@/utils/questionType'

export interface ProjectListItem {
  id: string
  org_id: string
  name: string
  description: string | null
  status: string
  created_by: string
  created_at: string
  my_role: 'editor' | 'viewer'
}

export interface ProjectListResponse {
  items: ProjectListItem[]
  page: { limit: number; offset: number; total: number }
}

export interface ProjectDetail extends ProjectListItem {
  latest_session_id: string | null
  active_session_id: string | null
  questions_count: number
  answered_count: number
}

export interface ProjectQuestion {
  id: string
  project_id: string
  source: string
  system_question_id: string | null
  section: string
  tags: string[]
  q_type: string
  prompt: string
  help_text: string | null
  required: boolean
  answer_schema: Record<string, unknown>
  visibility_logic: unknown
  status: string
  position?: number
  created_at: string
}

export interface ProjectQuestionsResponse {
  [section: string]: ProjectQuestion[]
}

export async function listProjects(
  orgId: string,
  params?: { limit?: number; offset?: number }
): Promise<ProjectListResponse> {
  const url = PROJECT_ENDPOINTS.list(orgId, params)
  return apiClient.get<ProjectListResponse>(url)
}

export async function createProject(
  orgId: string,
  body: { name: string; description?: string; template_id: string }
): Promise<ProjectDetail> {
  const url = PROJECT_ENDPOINTS.create(orgId)
  return apiClient.post<ProjectDetail>(url, body)
}

export async function getProject(orgId: string, projectId: string): Promise<ProjectDetail> {
  const url = PROJECT_ENDPOINTS.get(orgId, projectId)
  return apiClient.get<ProjectDetail>(url)
}

export async function getProjectQuestions(
  orgId: string,
  projectId: string
): Promise<ProjectQuestionsResponse> {
  const url = PROJECT_ENDPOINTS.questions(orgId, projectId)
  return apiClient.get<ProjectQuestionsResponse>(url)
}

export interface ProjectMember {
  user_id: string
  display_name: string
  email: string
  role: 'editor' | 'viewer'
  status: string
}

export interface ProjectMembersResponse {
  items: ProjectMember[]
  page: { limit: number; offset: number; total: number }
}

export async function getProjectMembers(
  orgId: string,
  projectId: string,
  params?: { limit?: number; offset?: number }
): Promise<ProjectMembersResponse> {
  const url = PROJECT_ENDPOINTS.members(orgId, projectId, params)
  return apiClient.get<ProjectMembersResponse>(url)
}

export async function addProjectMember(
  orgId: string,
  projectId: string,
  body: { user_id: string; role: 'editor' | 'viewer' }
): Promise<ProjectMember> {
  const url = PROJECT_ENDPOINTS.members(orgId, projectId)
  return apiClient.post<ProjectMember>(url, body)
}

export async function patchProjectMember(
  orgId: string,
  projectId: string,
  userId: string,
  body: { role?: 'editor' | 'viewer'; status?: 'removed' }
): Promise<ProjectMember> {
  const url = PROJECT_ENDPOINTS.projectMember(orgId, projectId, userId)
  return apiClient.patch<ProjectMember>(url, body)
}

export interface CreateQuestionPayload {
  section: string
  tags?: string[]
  q_type: string
  prompt: string
  help_text?: string | null
  required: boolean
  answer_schema?: Record<string, unknown>
  visibility_logic?: unknown
}

export async function createProjectQuestion(
  orgId: string,
  projectId: string,
  body: CreateQuestionPayload
): Promise<ProjectQuestion> {
  const url = PROJECT_ENDPOINTS.questions(orgId, projectId)
  const payload = { ...body, q_type: normalizeQuestionTypeForApi(body.q_type) }
  return apiClient.post<ProjectQuestion>(url, payload)
}

export async function updateProjectQuestion(
  orgId: string,
  projectId: string,
  questionId: string,
  body: Partial<CreateQuestionPayload>
): Promise<ProjectQuestion> {
  const url = PROJECT_ENDPOINTS.question(orgId, projectId, questionId)
  const payload =
    body.q_type !== undefined
      ? { ...body, q_type: normalizeQuestionTypeForApi(body.q_type) }
      : body
  return apiClient.patch<ProjectQuestion>(url, payload)
}

export async function reorderProjectQuestions(
  orgId: string,
  projectId: string,
  body: { section: string; ordered_ids: string[] }
): Promise<void> {
  const url = PROJECT_ENDPOINTS.questionsReorder(orgId, projectId)
  return apiClient.post(url, body)
}

export async function archiveProjectQuestion(
  orgId: string,
  projectId: string,
  questionId: string
): Promise<void> {
  const url = PROJECT_ENDPOINTS.question(orgId, projectId, questionId)
  return apiClient.delete(url)
}

/** Project Scope (Traceability) */
export type ScopeRole = 'primary' | 'impacted' | 'out_of_scope'

export interface ProjectScopeItem {
  org_node_id: string
  scope_role: ScopeRole
}

export interface ProjectScopeResponse {
  items: ProjectScopeItem[]
}

export async function getProjectScope(
  orgId: string,
  projectId: string
): Promise<ProjectScopeResponse> {
  const url = PROJECT_ENDPOINTS.scope(orgId, projectId)
  const res = await apiClient.get<ProjectScopeResponse | ProjectScopeItem[]>(url)
  if (Array.isArray(res)) {
    return { items: res }
  }
  return res
}

export async function putProjectScope(
  orgId: string,
  projectId: string,
  body: { items: ProjectScopeItem[] }
): Promise<ProjectScopeResponse> {
  const url = PROJECT_ENDPOINTS.scope(orgId, projectId)
  const res = await apiClient.put<ProjectScopeResponse | ProjectScopeItem[]>(url, body)
  if (Array.isArray(res)) {
    return { items: res }
  }
  return res
}

/** Trace View (Traceability) — GET /trace returns full view */
export interface TraceViewResponse {
  landscape: { nodes: unknown[]; links: unknown[] }
  project_scope: ProjectScopeItem[]
  catalog: {
    requirements: unknown[]
    actors: unknown[]
    requirement_actors: unknown[]
    requirement_modules: unknown[]
  }
  trace_links: unknown[]
}

export async function getTraceView(
  orgId: string,
  projectId: string
): Promise<TraceViewResponse> {
  const url = PROJECT_ENDPOINTS.trace(orgId, projectId)
  return apiClient.get<TraceViewResponse>(url)
}

/** Requirements (Traceability) — BO/BR/FR/NFR */
export type RequirementType = 'BO' | 'BR' | 'FR' | 'NFR'

export interface Requirement {
  id: string
  project_id: string
  code: string
  title: string
  /** BE may return req_type or type */
  req_type?: RequirementType
  type?: RequirementType
  parent_id: string | null
  description: string | null
  created_at: string
  updated_at?: string
}

export interface RequirementsListResponse {
  items: Requirement[]
  page?: { limit: number; offset: number; total: number }
}

export async function listRequirements(
  orgId: string,
  projectId: string,
  params?: { limit?: number; offset?: number }
): Promise<RequirementsListResponse> {
  const url = PROJECT_ENDPOINTS.requirements(orgId, projectId)
  const res = await apiClient.get<RequirementsListResponse | Requirement[]>(url)
  if (Array.isArray(res)) {
    return { items: res }
  }
  return res
}

export interface CreateRequirementPayload {
  code: string
  title: string
  req_type: RequirementType
  parent_id?: string | null
  description?: string | null
}

export async function createRequirement(
  orgId: string,
  projectId: string,
  body: CreateRequirementPayload
): Promise<Requirement> {
  const url = PROJECT_ENDPOINTS.requirements(orgId, projectId)
  return apiClient.post<Requirement>(url, body)
}

export interface PatchRequirementPayload {
  title?: string
  req_type?: RequirementType
  parent_id?: string | null
  description?: string | null
}

export async function patchRequirement(
  orgId: string,
  projectId: string,
  requirementId: string,
  body: PatchRequirementPayload
): Promise<Requirement> {
  const url = PROJECT_ENDPOINTS.requirement(orgId, projectId, requirementId)
  return apiClient.patch<Requirement>(url, body)
}

/** Replace requirement_actors (PUT replace-all) */
export async function putRequirementActors(
  orgId: string,
  projectId: string,
  requirementId: string,
  body: { actor_ids: string[] }
): Promise<unknown> {
  const url = PROJECT_ENDPOINTS.requirementActors(orgId, projectId, requirementId)
  return apiClient.put(url, body)
}

/** Replace requirement_module_map (PUT replace-all) */
export async function putRequirementModules(
  orgId: string,
  projectId: string,
  requirementId: string,
  body: { org_node_ids: string[] }
): Promise<unknown> {
  const url = PROJECT_ENDPOINTS.requirementModules(orgId, projectId, requirementId)
  return apiClient.put(url, body)
}

/** Trace Links CRUD */
export type TraceLinkFromToType = 'requirement' | 'org_node'

export interface TraceLink {
  id: string
  from_type: TraceLinkFromToType
  from_id: string
  to_type: TraceLinkFromToType
  to_id: string
  link_type: string
  note: string | null
  project_id: string | null
  created_at?: string
}

export interface TraceLinksListResponse {
  items: TraceLink[]
  page?: { limit: number; offset: number; total: number }
}

export async function listTraceLinks(
  orgId: string,
  projectId: string
): Promise<TraceLinksListResponse> {
  const url = PROJECT_ENDPOINTS.traceLinks(orgId, projectId)
  const res = await apiClient.get<TraceLinksListResponse | TraceLink[]>(url)
  if (Array.isArray(res)) {
    return { items: res }
  }
  return res
}

export interface CreateTraceLinkPayload {
  from_type: TraceLinkFromToType
  from_id: string
  to_type: TraceLinkFromToType
  to_id: string
  link_type: string
  note?: string | null
  project_id?: string | null
}

export async function createTraceLink(
  orgId: string,
  projectId: string,
  body: CreateTraceLinkPayload
): Promise<TraceLink> {
  const url = PROJECT_ENDPOINTS.traceLinks(orgId, projectId)
  return apiClient.post<TraceLink>(url, body)
}

export interface PatchTraceLinkPayload {
  link_type?: string
  note?: string | null
}

export async function patchTraceLink(
  orgId: string,
  projectId: string,
  linkId: string,
  body: PatchTraceLinkPayload
): Promise<TraceLink> {
  const url = PROJECT_ENDPOINTS.traceLink(orgId, projectId, linkId)
  return apiClient.patch<TraceLink>(url, body)
}

export async function deleteTraceLink(
  orgId: string,
  projectId: string,
  linkId: string
): Promise<void> {
  const url = PROJECT_ENDPOINTS.traceLink(orgId, projectId, linkId)
  await apiClient.delete(url)
}
