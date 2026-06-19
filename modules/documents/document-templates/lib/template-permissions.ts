import type { DocumentTemplate, TemplateScope } from '../model/document-template-types'

export function isPlatformAdmin(role?: string): boolean {
  return role === 'admin'
}

export function canEditTemplate(
  template: Pick<DocumentTemplate, 'scope' | 'created_by' | 'archived_at'>,
  userId: string | undefined,
  isAdmin: boolean
): boolean {
  if (template.archived_at) return false
  if (template.scope === 'system') return isAdmin
  if (template.scope === 'personal') return !!userId && template.created_by === userId
  return false
}

export function canManageSystemTemplates(isAdmin: boolean): boolean {
  return isAdmin
}

export function allowedCreateScopes(isAdmin: boolean): TemplateScope[] {
  return isAdmin ? ['personal', 'system'] : ['personal']
}

export function canPublishTemplate(
  template: Pick<DocumentTemplate, 'scope' | 'created_by' | 'archived_at'>,
  userId: string | undefined,
  isAdmin: boolean
): boolean {
  if (template.archived_at) return false
  if (template.scope === 'system') return isAdmin
  if (template.scope === 'personal') return !!userId && template.created_by === userId
  return false
}

export function canArchiveTemplate(
  template: Pick<DocumentTemplate, 'scope' | 'created_by' | 'archived_at'>,
  userId: string | undefined,
  isAdmin: boolean
): boolean {
  return canPublishTemplate(template, userId, isAdmin)
}

export function canDuplicateTemplate(template: Pick<DocumentTemplate, 'archived_at'>): boolean {
  return !template.archived_at
}
