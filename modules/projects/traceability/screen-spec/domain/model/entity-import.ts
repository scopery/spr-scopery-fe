/** POST …/applications/{appId}/data-entities/import-full */

export const ENTITY_IMPORT_FULL_MAX_ITEMS = 200

/** Matches BE `DataEntityFieldDataType`. */
export const ENTITY_IMPORT_DATA_TYPES = [
  'VARCHAR',
  'TEXT',
  'UUID',
  'INTEGER',
  'BIGINT',
  'SMALLINT',
  'DECIMAL',
  'FLOAT',
  'DOUBLE',
  'BOOLEAN',
  'DATE',
  'TIMESTAMP',
  'TIMESTAMPTZ',
  'JSONB',
  'ARRAY',
] as const

export type EntityImportDataType = (typeof ENTITY_IMPORT_DATA_TYPES)[number]

export interface EntityImportFieldItem {
  columnName: string
  dataType: EntityImportDataType
  maxLength?: number | null
  isNullable: boolean
  isUnique: boolean
  isPrimaryKey: boolean
  defaultValue?: string | null
  precision?: number | null
  scale?: number | null
  remark?: string | null
  displayOrder: number
}

export interface EntityImportItem {
  projectId: string
  code: string
  name: string
  description?: string | null
  tableName?: string | null
  moduleId?: string | null
  fields?: EntityImportFieldItem[]
}
