/** POST …/applications/{appId}/components/import-full */

export const COMPONENT_IMPORT_FULL_MAX_ITEMS = 200

export interface ComponentImportFieldItem {
  fieldKey: string
  label: string
  fieldType: string
  required?: boolean | null
  maxLength?: number | null
  remark?: string | null
  displayOrder?: number | null
}

export interface ComponentImportItem {
  code: string
  name: string
  componentType?: string | null
  description?: string | null
  fields?: ComponentImportFieldItem[]
}
