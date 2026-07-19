import { apiClient } from '@/shared/lib/apiClient'
import { TEMPLATE_ENDPOINTS, ADMIN_ENDPOINTS } from './endpoints'
import type {
  TemplateListItem,
  TemplateListResponse,
  TemplateDetail,
  SystemQuestion,
  CreateTemplateBody,
  AddTemplateQuestionBody,
} from '../../domain/model/template'

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

function unwrapTemplateDetail(res: unknown): TemplateDetail {
  if (res && typeof res === 'object') {
    if ('template' in res && res.template && typeof res.template === 'object')
      return res.template as TemplateDetail
    if ('data' in res && res.data && typeof res.data === 'object') return res.data as TemplateDetail
  }
  return res as TemplateDetail
}

function unwrapTemplate(res: unknown): TemplateListItem {
  if (res && typeof res === 'object') {
    if ('template' in res && res.template && typeof res.template === 'object')
      return res.template as TemplateListItem
    if ('data' in res && res.data && typeof res.data === 'object')
      return res.data as TemplateListItem
  }
  return res as TemplateListItem
}

function unwrapQuestion(res: unknown): SystemQuestion {
  if (res && typeof res === 'object') {
    if ('question' in res && res.question && typeof res.question === 'object')
      return res.question as SystemQuestion
    if ('data' in res && res.data && typeof res.data === 'object') return res.data as SystemQuestion
  }
  return res as SystemQuestion
}

export async function listTemplates(params?: {
  status?: string
  limit?: number
  offset?: number
}): Promise<TemplateListResponse> {
  const res = await apiClient.get<unknown>(TEMPLATE_ENDPOINTS.list(params))
  return unwrapList(res)
}

export async function getTemplate(templateId: string): Promise<TemplateDetail> {
  const res = await apiClient.get<unknown>(TEMPLATE_ENDPOINTS.get(templateId))
  return unwrapTemplateDetail(res)
}

export async function createTemplate(body: CreateTemplateBody): Promise<TemplateListItem> {
  const res = await apiClient.post<unknown>(ADMIN_ENDPOINTS.templates(), body)
  return unwrapTemplate(res)
}

export async function updateTemplate(
  templateId: string,
  body: { name?: string; version?: string }
): Promise<TemplateListItem> {
  const res = await apiClient.patch<unknown>(ADMIN_ENDPOINTS.template(templateId), body)
  return unwrapTemplate(res)
}

export async function publishTemplate(templateId: string): Promise<TemplateListItem> {
  const res = await apiClient.post<unknown>(ADMIN_ENDPOINTS.templatePublish(templateId), {})
  return unwrapTemplate(res)
}

export async function duplicateTemplate(templateId: string): Promise<TemplateListItem> {
  const res = await apiClient.post<unknown>(ADMIN_ENDPOINTS.templateDuplicate(templateId), {})
  return unwrapTemplate(res)
}

export async function addTemplateQuestion(
  templateId: string,
  body: AddTemplateQuestionBody
): Promise<SystemQuestion> {
  const res = await apiClient.post<unknown>(ADMIN_ENDPOINTS.templateQuestions(templateId), body)
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
  const res = await apiClient.patch<unknown>(ADMIN_ENDPOINTS.question(questionId), body)
  return unwrapQuestion(res)
}
