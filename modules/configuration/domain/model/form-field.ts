import type { FormFieldSource } from '../enums/configuration.enum'

export interface CustomFormField {
  id: string
  formVersionId: string
  sectionId: string | null
  fieldSource: FormFieldSource | string
  customFieldDefinitionId: string | null
  requiredOnForm: boolean
  sortOrder: number
}

export interface CreateFormFieldPayload {
  fieldSource: string
  sectionId?: string
  customFieldDefinitionId?: string
  coreFieldKey?: string
  requiredOnForm?: boolean
  readonlyFlag?: boolean
  sortOrder?: number
}
