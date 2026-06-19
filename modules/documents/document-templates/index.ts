export { OrgTemplateNewPageView } from './ui/OrgTemplateNewPageView'
export { OrgTemplateDetailPageView } from './ui/OrgTemplateDetailPageView'
export { OrgTemplatesManagementView } from './ui/OrgTemplatesManagementView'
export { TemplateEditor } from './ui/TemplateEditor'
export { TemplatePicker } from './ui/TemplatePicker'
export { TemplatePreviewDialog } from './ui/TemplatePreviewDialog'
export { TemplateVariablePanel } from './ui/TemplateVariablePanel'
export { TemplateVariableWarnings } from './ui/TemplateVariableWarnings'
export { TemplateCard } from './ui/TemplateCard'
export { TemplateCategoryBadge } from './ui/TemplateCategoryBadge'
export { TemplateScopeBadge } from './ui/TemplateScopeBadge'
export { TemplateStatusBadge } from './ui/TemplateStatusBadge'
export { useDocumentTemplates, useDocumentTemplateDetail } from './hooks/useDocumentTemplates'
export { useTemplatePreviewDialog } from './hooks/useTemplatePreviewDialog'
export { useTemplatePicker } from './hooks/useTemplatePicker'
export { useTemplateEditor } from './hooks/useTemplateEditor'
export type {
  DocumentTemplate,
  DocumentTemplateWithVariableScan,
  TemplateStatus,
  TemplateScope,
  TemplateVariableDefinition,
  TemplateVariablePreview,
  TemplateVariableWarning,
  CreateDocumentFromTemplateInput,
} from './model/document-template-types'
export type { DocumentTemplatesFilters } from './model/document-templates'
export {
  templateSnippet,
  TEMPLATE_SCOPE_LABEL,
  TEMPLATE_CATEGORY_LABEL,
} from './model/document-template-types'
export type { TemplatePickerProps } from './ui/TemplatePicker'
export type { TemplatePreviewDialogProps } from './ui/TemplatePreviewDialog'
export type { TemplateEditorProps } from './ui/TemplateEditor'
export type { TemplateVariablePanelProps } from './ui/TemplateVariablePanel'
export * as documentTemplatesApi from './api/document-templates.api'
export {
  isPlatformAdmin,
  canEditTemplate,
  canManageSystemTemplates,
  allowedCreateScopes,
  canPublishTemplate,
  canArchiveTemplate,
  canDuplicateTemplate,
} from './lib/template-permissions'
