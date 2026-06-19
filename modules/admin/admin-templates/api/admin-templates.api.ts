import { TEMPLATE_ENDPOINTS, ADMIN_ENDPOINTS } from './endpoints'
/**
 * Template service — v2 API (public + admin)
 */

import { apiClient } from '@/shared/lib/apiClient'

export interface TemplateListItem {
  id: string
  name: string
  version: string
  status: string
  created_at: string
}

export interface TemplateListResponse {
  items: TemplateListItem[]
  page: { limit: number; offset: number; total: number }
}

export interface SystemQuestion {
  id: string
  template_id: string
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

export interface TemplateDetail extends TemplateListItem {
  questions: SystemQuestion[]
}

/** Backend may return { data: { items, page } } or raw { items, page }. */
function unwrapList(res: unknown): TemplateListResponse {
  if (res && typeof res === 'object') {
    if ('data' in res && res.data && typeof res.data === 'object') {
      const d = res.data as Record<string, unknown>
      return {
        items: Array.isArray(d.items) ? d.items : [],
        page: (d.page && typeof d.page === 'object'
          ? d.page
          : { limit: 100, offset: 0, total: 0 }) as TemplateListResponse['page'],
      }
    }
    if ('items' in res && Array.isArray((res as TemplateListResponse).items))
      return res as TemplateListResponse
  }
  return { items: [], page: { limit: 100, offset: 0, total: 0 } }
}

export async function listTemplates(params?: {
  status?: string
  limit?: number
  offset?: number
}): Promise<TemplateListResponse> {
  const url = TEMPLATE_ENDPOINTS.list(params)
  const res = await apiClient.get<unknown>(url)
  return unwrapList(res)
}

/** Backend may return { template } or { data } or raw template detail. */
function unwrapTemplateDetail(res: unknown): TemplateDetail {
  if (res && typeof res === 'object') {
    if ('template' in res && res.template && typeof res.template === 'object')
      return res.template as TemplateDetail
    if ('data' in res && res.data && typeof res.data === 'object') return res.data as TemplateDetail
  }
  return res as TemplateDetail
}

export async function getTemplate(templateId: string): Promise<TemplateDetail> {
  const url = TEMPLATE_ENDPOINTS.get(templateId)
  const res = await apiClient.get<unknown>(url)
  return unwrapTemplateDetail(res)
}

// ——— Admin (require profile.role === 'admin') ———

/** Backend may return { template } or { data } or raw object. */
function unwrapTemplate(res: unknown): TemplateListItem {
  if (res && typeof res === 'object') {
    if ('template' in res && res.template && typeof res.template === 'object')
      return res.template as TemplateListItem
    if ('data' in res && res.data && typeof res.data === 'object')
      return res.data as TemplateListItem
  }
  return res as TemplateListItem
}

/** Backend may return { question } or { data } or raw object. */
function unwrapQuestion(res: unknown): SystemQuestion {
  if (res && typeof res === 'object') {
    if ('question' in res && res.question && typeof res.question === 'object')
      return res.question as SystemQuestion
    if ('data' in res && res.data && typeof res.data === 'object') return res.data as SystemQuestion
  }
  return res as SystemQuestion
}

export interface CreateTemplateBody {
  name: string
  version?: string
}

export async function createTemplate(body: CreateTemplateBody): Promise<TemplateListItem> {
  const url = ADMIN_ENDPOINTS.templates()
  const res = await apiClient.post<unknown>(url, body)
  return unwrapTemplate(res)
}

export async function updateTemplate(
  templateId: string,
  body: { name?: string; version?: string }
): Promise<TemplateListItem> {
  const url = ADMIN_ENDPOINTS.template(templateId)
  const res = await apiClient.patch<unknown>(url, body)
  return unwrapTemplate(res)
}

export async function publishTemplate(templateId: string): Promise<TemplateListItem> {
  const url = ADMIN_ENDPOINTS.templatePublish(templateId)
  const res = await apiClient.post<unknown>(url, {})
  return unwrapTemplate(res)
}

export async function duplicateTemplate(templateId: string): Promise<TemplateListItem> {
  const url = ADMIN_ENDPOINTS.templateDuplicate(templateId)
  const res = await apiClient.post<unknown>(url, {})
  return unwrapTemplate(res)
}

export interface AddTemplateQuestionBody {
  section: string
  tags?: string[]
  q_type: string
  prompt: string
  help_text?: string | null
  required: boolean
  answer_schema: Record<string, unknown>
  visibility_logic?: unknown
  position?: number
}

export async function addTemplateQuestion(
  templateId: string,
  body: AddTemplateQuestionBody
): Promise<SystemQuestion> {
  const url = ADMIN_ENDPOINTS.templateQuestions(templateId)
  const res = await apiClient.post<unknown>(url, body)
  return unwrapQuestion(res)
}

export async function updateAdminQuestion(
  questionId: string,
  body: Partial<{
    section: string
    tags: string[]
    q_type: string
    prompt: string
    help_text: string | null
    required: boolean
    answer_schema: Record<string, unknown>
    visibility_logic: unknown
    status: string
    position: number
  }>
): Promise<SystemQuestion> {
  const url = ADMIN_ENDPOINTS.question(questionId)
  const res = await apiClient.patch<unknown>(url, body)
  return unwrapQuestion(res)
}
