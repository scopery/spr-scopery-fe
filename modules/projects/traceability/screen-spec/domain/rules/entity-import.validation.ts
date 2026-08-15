import {
  asRecord,
  flagDuplicateStrings,
  itemPath,
  optionalNumberField,
  optionalString,
  optionalUuid,
  rejectUnknownKeys,
  requireEnum,
  requireNonEmptyString,
  requireUuid,
  validateJsonImportItems,
  type JsonImportIssue,
  type JsonImportValidationResult,
} from '@/shared/lib/jsonImportValidation'
import {
  ENTITY_IMPORT_DATA_TYPES,
  ENTITY_IMPORT_FULL_MAX_ITEMS,
  type EntityImportFieldItem,
  type EntityImportItem,
} from '../model/entity-import'

const ENTITY_KEYS = new Set([
  'projectId',
  'code',
  'name',
  'description',
  'tableName',
  'moduleId',
  'fields',
])
const FIELD_KEYS = new Set([
  'columnName',
  'dataType',
  'maxLength',
  'isNullable',
  'isUnique',
  'isPrimaryKey',
  'defaultValue',
  'precision',
  'scale',
  'remark',
  'displayOrder',
])

function optionalBool(
  row: Record<string, unknown>,
  key: string,
  path: string,
  issues: JsonImportIssue[]
): boolean | null {
  if (!(key in row) || row[key] == null || row[key] === '') return null
  if (typeof row[key] === 'boolean') return row[key]
  if (row[key] === 'true') return true
  if (row[key] === 'false') return false
  issues.push({ path, message: `${key} must be a boolean.` })
  return null
}

function rejectUnknownKeysAt(
  row: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  pathPrefix: string,
  issues: JsonImportIssue[]
): void {
  for (const key of Object.keys(row)) {
    if (allowed.has(key)) continue
    issues.push({
      path: `${pathPrefix}.${key}`,
      message: `Unknown field "${key}". Allowed: ${[...allowed].join(', ')}.`,
    })
  }
}

function mapField(
  row: Record<string, unknown>,
  pathPrefix: string,
  issues: JsonImportIssue[]
): EntityImportFieldItem | null {
  rejectUnknownKeysAt(row, FIELD_KEYS, pathPrefix, issues)
  const columnName = requireNonEmptyString(row, 'columnName', `${pathPrefix}.columnName`, issues)
  const dataType = requireEnum(
    row,
    'dataType',
    ENTITY_IMPORT_DATA_TYPES,
    `${pathPrefix}.dataType`,
    issues
  )
  if (!columnName || !dataType) return null
  return {
    columnName,
    dataType: dataType as EntityImportFieldItem['dataType'],
    maxLength: optionalNumberField(row, 'maxLength', `${pathPrefix}.maxLength`, issues, {
      integer: true,
      min: 0,
    }),
    isNullable: optionalBool(row, 'isNullable', `${pathPrefix}.isNullable`, issues) ?? false,
    isUnique: optionalBool(row, 'isUnique', `${pathPrefix}.isUnique`, issues) ?? false,
    isPrimaryKey: optionalBool(row, 'isPrimaryKey', `${pathPrefix}.isPrimaryKey`, issues) ?? false,
    defaultValue: optionalString(row, 'defaultValue', `${pathPrefix}.defaultValue`, issues),
    precision: optionalNumberField(row, 'precision', `${pathPrefix}.precision`, issues, {
      integer: true,
      min: 0,
    }),
    scale: optionalNumberField(row, 'scale', `${pathPrefix}.scale`, issues, {
      integer: true,
      min: 0,
    }),
    remark: optionalString(row, 'remark', `${pathPrefix}.remark`, issues),
    displayOrder:
      optionalNumberField(row, 'displayOrder', `${pathPrefix}.displayOrder`, issues, {
        integer: true,
      }) ?? 0,
  }
}

export function validateEntityFullSpecJsonImport(
  rawItems: Record<string, unknown>[],
  defaultProjectId?: string | null
): JsonImportValidationResult<EntityImportItem> {
  return validateJsonImportItems(rawItems, {
    maxItems: ENTITY_IMPORT_FULL_MAX_ITEMS,
    mapItem: (row, index, issues) => {
      rejectUnknownKeys(row, ENTITY_KEYS, index, issues)
      const projectId =
        optionalUuid(row, 'projectId', itemPath(index, 'projectId'), issues) ??
        (defaultProjectId?.trim() || null)
      if (!projectId) {
        requireUuid(row, 'projectId', itemPath(index, 'projectId'), issues)
        return null
      }
      const code = requireNonEmptyString(row, 'code', itemPath(index, 'code'), issues)
      const name = requireNonEmptyString(row, 'name', itemPath(index, 'name'), issues)
      if (!code || !name) return null

      let fields: EntityImportFieldItem[] | undefined
      if ('fields' in row && row.fields != null && row.fields !== '') {
        if (!Array.isArray(row.fields)) {
          issues.push({
            path: itemPath(index, 'fields'),
            message: 'fields must be an array.',
          })
        } else {
          const mapped: EntityImportFieldItem[] = []
          row.fields.forEach((entry, fieldIndex) => {
            const rec = asRecord(entry)
            const path = `${itemPath(index, 'fields')}[${fieldIndex}]`
            if (!rec) {
              issues.push({ path, message: 'Each field must be an object.' })
              return
            }
            const field = mapField(rec, path, issues)
            if (field) mapped.push(field)
          })
          const seenKeys = new Set<string>()
          mapped.forEach((field, fieldIndex) => {
            const key = field.columnName.toLowerCase()
            if (seenKeys.has(key)) {
              issues.push({
                path: `${itemPath(index, 'fields')}[${fieldIndex}].columnName`,
                message: `Duplicate columnName "${field.columnName}".`,
              })
            }
            seenKeys.add(key)
          })
          fields = mapped
        }
      }

      return {
        projectId,
        code,
        name,
        description: optionalString(row, 'description', itemPath(index, 'description'), issues),
        tableName: optionalString(row, 'tableName', itemPath(index, 'tableName'), issues),
        moduleId: optionalUuid(row, 'moduleId', itemPath(index, 'moduleId'), issues),
        fields,
      }
    },
    afterAll: (mapped, issues) => {
      flagDuplicateStrings(
        mapped.map((item, index) => ({
          index,
          value: item.code,
          field: 'code',
        })),
        issues
      )
    },
  })
}
