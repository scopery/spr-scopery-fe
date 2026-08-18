import type { OptionSourceType, RequiredOverride, ScreenModeCode } from '../enums/screen-spec.enum'

export interface DataEntityField {
  id: string
  dataEntityId: string
  columnName: string
  dataType: string
  maxLength: number | null
  isNullable: boolean
  isUnique: boolean
  remark: string | null
  displayOrder: number | null
  status?: string
}

export interface CreateDataEntityFieldBody {
  columnName: string
  dataType: string
  maxLength?: number | null
  isNullable?: boolean
  isUnique?: boolean
  remark?: string | null
  displayOrder?: number | null
}

export interface UpdateDataEntityFieldBody {
  dataType: string
  maxLength?: number | null
  isNullable?: boolean
  isUnique?: boolean
  remark?: string | null
  displayOrder?: number | null
}

export interface ApplicationComponentField {
  id: string
  componentId: string
  fieldKey: string
  label: string
  fieldType: string
  required: boolean | null
  maxLength: number | null
  defaultValue: string | null
  remark: string | null
  displayOrder: number | null
}

export interface CreateComponentFieldBody {
  fieldKey: string
  label: string
  fieldType: string
  required?: boolean | null
  maxLength?: number | null
  defaultValue?: string | null
  remark?: string | null
  displayOrder?: number | null
}

export interface UpdateComponentFieldBody {
  label: string
  fieldType: string
  required?: boolean | null
  maxLength?: number | null
  defaultValue?: string | null
  remark?: string | null
  displayOrder?: number | null
}

export interface BindComponentToSectionBody {
  componentId: string
  displayOrder?: number | null
}

export interface BindComponentToSectionResult {
  fieldsImported: number
  importedFieldKeys: string[]
}

export interface ComponentApiLink {
  id: string
  componentId: string
  apiId: string
  workspaceId: string
  role: string
  note: string | null
  displayOrder: number | null
  status: string
  createdAt: string
}

export interface CreateComponentApiLinkBody {
  apiId: string
  role: string
  note?: string | null
  displayOrder?: number | null
}

export interface UpdateComponentApiLinkBody {
  role: string
  note?: string | null
  displayOrder?: number | null
}

export interface ComponentOption {
  id: string
  componentId: string
  optionValue: string
  optionLabel: string
  displayOrder: number | null
}

export interface CreateComponentOptionBody {
  optionValue: string
  optionLabel: string
  displayOrder?: number | null
}

export interface UpdateComponentOptionBody {
  optionValue: string
  optionLabel: string
  displayOrder?: number | null
}

export interface ComponentSourceFilter {
  op: 'IS_NULL' | 'EQUALS' | 'IN'
  field: string
  value?: string
  values?: string[]
}

export interface ApplicationComponentDetail {
  id: string
  applicationId: string
  code: string
  name: string
  description: string | null
  componentType: string | null
  optionSourceType: OptionSourceType | string
  sourceEntityId: string | null
  sourceValueColumn: string | null
  sourceLabelColumn: string | null
  sourceFilterJson: ComponentSourceFilter[] | null
  screenshotUrl?: string | null
  screenshotObjectKey?: string | null
  status?: string
}

export interface UpdateComponentSourceBody {
  name: string
  description?: string | null
  componentType?: string | null
  optionSourceType: OptionSourceType | string
  sourceEntityId?: string | null
  sourceValueColumn?: string | null
  sourceLabelColumn?: string | null
  sourceFilterJson?: ComponentSourceFilter[] | null
}

export interface ScreenMode {
  id: string
  screenId: string
  modeCode: ScreenModeCode | string
  name: string
  displayOrder: number | null
  status: string
}

export interface CreateScreenModeBody {
  modeCode: ScreenModeCode | string
  name: string
  displayOrder?: number | null
}

export interface UpdateScreenModeBody {
  name: string
  displayOrder?: number | null
}

export interface ScreenFieldModeConfig {
  modeId: string
  modeCode?: string
  isVisible: boolean
  isRequired: boolean
  isReadonly: boolean
  defaultValue: string | null
  displayOrder: number | null
}

export interface ScreenFieldModeConfigInput {
  modeId: string
  isVisible: boolean
  isRequired: boolean
  isReadonly: boolean
  defaultValue: string | null
  displayOrder: number | null
}

export interface ReplaceFieldModeConfigsBody {
  modeConfigs: ScreenFieldModeConfigInput[]
}

export interface ModeConfigDraft {
  modeId: string
  isVisible: boolean
  required: RequiredOverride
  isReadonly: boolean
  defaultValue: string | null
  displayOrder: number | null
}

export interface ScreenFieldValidation {
  id: string
  modeId: string | null
  modeCode?: string | null
  ruleTypeId?: string
  ruleTypeCode: string
  ruleParamJson: unknown
  conditionJson: unknown
  errorMessage: string | null
  remark: string | null
  displayOrder: number | null
}

export interface CreateFieldValidationBody {
  ruleTypeId: string
  modeId?: string | null
  ruleParamJson?: unknown
  conditionJson?: unknown
  errorMessage?: string | null
  remark?: string | null
  displayOrder?: number | null
}

export interface UpdateFieldValidationBody {
  ruleTypeId: string
  modeId?: string | null
  ruleParamJson?: unknown
  conditionJson?: unknown
  errorMessage?: string | null
  remark?: string | null
  displayOrder?: number | null
}

export interface CreateScreenFieldBody {
  fieldKey: string
  label: string
  fieldType: string
  description?: string | null
  required?: boolean | null
  displayOrder?: number | null
  sectionId?: string | null
  maxLength?: number | null
  remark?: string | null
  componentId?: string | null
  dataEntityFieldId?: string | null
}

export interface ScreenFieldDetail {
  id: string
  screenId?: string
  sectionId: string | null
  fieldKey: string
  label: string
  fieldType: string
  description: string | null
  required: boolean | null
  displayOrder: number | null
  maxLength: number | null
  remark: string | null
  componentId: string | null
  dataEntityFieldId: string | null
  componentFieldId: string | null
  modeConfigs: ScreenFieldModeConfig[]
  validations: ScreenFieldValidation[]
}

export interface UpdateScreenFieldSpecBody {
  label: string
  fieldType: string
  description?: string | null
  required?: boolean | null
  displayOrder?: number | null
  sectionId?: string | null
  maxLength?: number | null
  remark?: string | null
  componentId?: string | null
  dataEntityFieldId?: string | null
}

export interface ValidationRuleType {
  id: string
  code: string
  name: string
  category: string
  paramSchemaJson: string | Record<string, string> | null
  defaultMessage: string | null
  description: string | null
  displayOrder: number | null
  isSystem?: boolean
}

export interface ValidationApplyWhen {
  fieldKey: string
  op: string
  value?: string
}

export interface ScreenProcessItem {
  id: string
  screenId?: string
  modeId: string | null
  modeCode?: string | null
  targetFieldId: string | null
  title: string
  content: string | null
  sourceTable: string | null
  conditionNote: string | null
  displayOrder: number | null
}

export interface UpsertScreenProcessItemBody {
  modeId?: string | null
  targetFieldId?: string | null
  title: string
  content?: string | null
  sourceTable?: string | null
  conditionNote?: string | null
  displayOrder?: number | null
}

export interface ScreenEventItem {
  id: string
  screenId?: string
  modeId: string | null
  modeCode?: string | null
  triggerFieldId: string | null
  triggerActionCode: string | null
  title: string
  content: string | null
  conditionNote: string | null
  targetScreenId: string | null
  targetScreenCode?: string | null
  targetScreenName?: string | null
  targetModeCode: string | null
  displayOrder: number | null
}

export interface UpsertScreenEventItemBody {
  modeId?: string | null
  triggerFieldId?: string | null
  triggerActionCode?: string | null
  title: string
  content?: string | null
  conditionNote?: string | null
  targetScreenId?: string | null
  targetModeCode?: string | null
  displayOrder?: number | null
}
