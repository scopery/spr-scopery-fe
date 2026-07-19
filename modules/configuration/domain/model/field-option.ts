import type { FieldOptionStatus } from '../enums/configuration.enum'

export interface CustomFieldOption {
  id: string
  customFieldDefinitionId: string
  optionCode: string
  label: string
  sortOrder: number
  status: FieldOptionStatus | string
}

export interface CreateFieldOptionPayload {
  optionCode: string
  label: string
  sortOrder?: number
}
