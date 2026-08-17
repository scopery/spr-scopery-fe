import type { CreateFieldValidationBody } from './screen-spec'

/** One rule in Validations-tab JSON import. FE POSTs each item to createFieldValidation. */
export const FIELD_VALIDATION_IMPORT_MAX_ITEMS = 200

export interface FieldValidationImportItem {
  fieldKey: string
  ruleTypeCode: string
  modeCode?: string | null
  ruleParamJson?: unknown
  conditionJson?: unknown
  errorMessage?: string | null
  remark?: string | null
  displayOrder?: number | null
}

export interface FieldValidationImportRefs {
  fields: Array<{ id: string; fieldKey: string }>
  modes: Array<{ id: string; modeCode: string }>
  ruleTypes: Array<{ id: string; code: string }>
}

export interface ResolvedFieldValidationImport {
  fieldKey: string
  fieldId: string
  body: CreateFieldValidationBody
}
