// Domain — enums
export {
  CustomFieldType,
  CustomFieldStatus,
  FieldOptionStatus,
  FormVersionStatus,
  FormFieldSource,
  LayoutType,
  LayoutStatus,
  StatusSetStatus,
  TagStatus,
  TaxonomyStatus,
  ValidationRuleType,
} from './domain/enums/configuration.enum'

// Domain — models
export type { ObjectType } from './domain/model/object-type'
export type { CustomFieldDefinition, CreateCustomFieldPayload } from './domain/model/custom-field'
export type { CustomFieldOption, CreateFieldOptionPayload } from './domain/model/field-option'
export type {
  CustomFieldValue,
  CustomFieldValueInput,
  UpsertFieldValuesPayload,
  GetFieldValuesParams,
} from './domain/model/field-value'
export type {
  FieldVisibilityPolicy,
  SetFieldVisibilityPayload,
} from './domain/model/field-visibility'
export type { CustomFormDefinition, CreateFormPayload } from './domain/model/form'
export type { CustomFormVersion } from './domain/model/form-version'
export type { CustomFormSection, CreateFormSectionPayload } from './domain/model/form-section'
export type { CustomFormField, CreateFormFieldPayload } from './domain/model/form-field'
export type { FormSubmission, SubmitFormPayload } from './domain/model/form-submission'
export type { LayoutDefinition, CreateLayoutPayload } from './domain/model/layout'
export type {
  StatusSet,
  StatusValue,
  CreateStatusSetPayload,
  CreateStatusValuePayload,
} from './domain/model/status-set'
export type {
  TagDefinition,
  TagAssignment,
  CreateTagPayload,
  CreateTagAssignmentPayload,
} from './domain/model/tag'
export type {
  Taxonomy,
  TaxonomyTerm,
  CreateTaxonomyPayload,
  CreateTaxonomyTermPayload,
} from './domain/model/taxonomy'
export type {
  CustomFieldValidationRule,
  CreateValidationRulePayload,
} from './domain/model/validation-rule'

// Domain — rules
export {
  isCustomFieldActive,
  isSelectFieldType,
  isMultiSelectFieldType,
  isFormVersionPublished,
  canEditFormVersion,
  isLayoutPublished,
  getValueKeyForFieldType,
  groupFormFieldsBySection,
} from './domain/rules/configuration.rules'

// Infrastructure — API
export * as objectTypesApi from './infrastructure/api/object-types.api'
export * as customFieldsApi from './infrastructure/api/custom-fields.api'
export * as fieldOptionsApi from './infrastructure/api/field-options.api'
export * as fieldValuesApi from './infrastructure/api/field-values.api'
export * as fieldVisibilityApi from './infrastructure/api/field-visibility.api'
export * as formsApi from './infrastructure/api/forms.api'
export * as formSectionsApi from './infrastructure/api/form-sections.api'
export * as formFieldsApi from './infrastructure/api/form-fields.api'
export * as formSubmissionsApi from './infrastructure/api/form-submissions.api'
export * as layoutsApi from './infrastructure/api/layouts.api'
export * as statusSetsApi from './infrastructure/api/status-sets.api'
export * as tagsApi from './infrastructure/api/tags.api'
export * as taxonomiesApi from './infrastructure/api/taxonomies.api'
export * as validationRulesApi from './infrastructure/api/validation-rules.api'

// Presentation — hooks
export { useConfigurationOverview } from './presentation/hooks/useConfigurationOverview'
export { useCustomFieldsStudio } from './presentation/hooks/useCustomFieldsStudio'
export { useFormsStudio } from './presentation/hooks/useFormsStudio'
export { useFormBuilder } from './presentation/hooks/useFormBuilder'
export { useUserForms } from './presentation/hooks/useUserForms'
export { useFormSubmission } from './presentation/hooks/useFormSubmission'
export { useUserSubmissions } from './presentation/hooks/useUserSubmissions'
export { useUiMetadata } from './presentation/hooks/useUiMetadata'
export { useObjectFieldValues } from './presentation/hooks/useObjectFieldValues'

// Presentation — UI
export { ConfigurationOverviewView } from './presentation/ui/ConfigurationOverviewView'
export { CustomFieldsStudioView } from './presentation/ui/CustomFieldsStudioView'
export { FormsStudioView } from './presentation/ui/FormsStudioView'
export { FormBuilderView } from './presentation/ui/FormBuilderView'
export { UserFormsView } from './presentation/ui/UserFormsView'
export { UserFormSubmitView } from './presentation/ui/UserFormSubmitView'
export { UserSubmissionsView } from './presentation/ui/UserSubmissionsView'
export { UiMetadataView } from './presentation/ui/UiMetadataView'
export { DynamicFieldRenderer } from './presentation/ui/DynamicFieldRenderer'
export type { DynamicFieldRendererProps } from './presentation/ui/DynamicFieldRenderer'
export { ObjectCustomFieldsPanel } from './presentation/ui/ObjectCustomFieldsPanel'
