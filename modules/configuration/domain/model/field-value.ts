export interface CustomFieldValue {
  id: string
  customFieldDefinitionId: string
  valueText: string | null
  valueLongText: string | null
  valueNumber: number | null
  valueDecimal: number | null
  valueBoolean: boolean | null
  valueDate: string | null
  valueDatetime: string | null
  valueJson: string | null
  valueOptionIds: string | null
}

export interface CustomFieldValueInput {
  fieldId: string
  valueText?: string | null
  valueLongText?: string | null
  valueNumber?: number | null
  valueDecimal?: number | null
  valueBoolean?: boolean | null
  valueDate?: string | null
  valueDatetime?: string | null
  valueJson?: string | null
  valueOptionIds?: string | null
}

export interface UpsertFieldValuesPayload {
  objectType: string
  targetId: string
  values: CustomFieldValueInput[]
}

export interface GetFieldValuesParams {
  objectType: string
  targetId: string
}
