/** OpenAPI `ScreenImportItem` — POST …/screens/import-full */

export const SCREEN_IMPORT_FULL_MAX_ITEMS = 200

export interface ScreenImportModeItem {
  modeCode: string
  name: string
  displayOrder?: number | null
}

export interface ScreenImportModeConfigItem {
  modeCode: string
  isVisible?: boolean
  isRequired?: boolean
  isReadonly?: boolean
  defaultValue?: string | null
  displayOrder?: number | null
}

export interface ScreenImportValidationItem {
  ruleTypeCode: string
  modeCode?: string | null
  ruleParamJson?: string | null
  conditionJson?: string | null
  errorMessage?: string | null
  remark?: string | null
  displayOrder?: number | null
}

export interface ScreenImportFieldItem {
  fieldKey: string
  label: string
  fieldType: string
  description?: string | null
  required?: boolean | null
  displayOrder?: number | null
  maxLength?: number | null
  remark?: string | null
  componentCode?: string | null
  modeConfigs?: ScreenImportModeConfigItem[]
  validations?: ScreenImportValidationItem[]
}

export interface ScreenImportProcessItem {
  content: string
  title?: string | null
  modeCode?: string | null
  targetFieldKey?: string | null
  sourceTable?: string | null
  conditionNote?: string | null
  displayOrder?: number | null
}

export interface ScreenImportEventItem {
  content: string
  title?: string | null
  modeCode?: string | null
  triggerFieldKey?: string | null
  triggerActionCode?: string | null
  conditionNote?: string | null
  targetScreenCode?: string | null
  targetModeCode?: string | null
  displayOrder?: number | null
}

export interface ScreenImportItem {
  projectId: string
  code: string
  name: string
  routePath?: string | null
  modes?: ScreenImportModeItem[]
  fields?: ScreenImportFieldItem[]
  processItems?: ScreenImportProcessItem[]
  eventItems?: ScreenImportEventItem[]
}

export interface ImportFullScreenSpecRequest {
  items: ScreenImportItem[]
}
