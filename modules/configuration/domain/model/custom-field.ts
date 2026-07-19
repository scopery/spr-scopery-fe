import type { CustomFieldStatus, CustomFieldType } from '../enums/configuration.enum'

export interface CustomFieldDefinition {
  id: string
  objectTypeCode: string
  fieldKey: string
  label: string
  fieldType: CustomFieldType | string
  required: boolean
  sensitive: boolean
  clientVisible: boolean
  status: CustomFieldStatus | string
}

export interface CreateCustomFieldPayload {
  objectTypeCode: string
  fieldKey: string
  label: string
  fieldType: string
  required?: boolean
  sensitive?: boolean
  clientVisible?: boolean
}
