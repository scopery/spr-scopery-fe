import {
  asRecord,
  flagDuplicateStrings,
  itemPath,
  optionalNumberField,
  optionalString,
  rejectUnknownKeys,
  requireNonEmptyString,
  validateJsonImportItems,
  type JsonImportIssue,
  type JsonImportValidationResult,
} from '@/shared/lib/jsonImportValidation'
import type { ComponentImportFieldItem, ComponentImportItem } from '../model/component-import'
import { COMPONENT_IMPORT_FULL_MAX_ITEMS } from '../model/component-import'

const COMPONENT_KEYS = new Set(['code', 'name', 'componentType', 'description', 'fields'])
const FIELD_KEYS = new Set([
  'fieldKey',
  'label',
  'fieldType',
  'required',
  'maxLength',
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
): ComponentImportFieldItem | null {
  rejectUnknownKeysAt(row, FIELD_KEYS, pathPrefix, issues)
  const fieldKey = requireNonEmptyString(row, 'fieldKey', `${pathPrefix}.fieldKey`, issues)
  const label = requireNonEmptyString(row, 'label', `${pathPrefix}.label`, issues)
  const fieldType = requireNonEmptyString(row, 'fieldType', `${pathPrefix}.fieldType`, issues)
  if (!fieldKey || !label || !fieldType) return null
  return {
    fieldKey,
    label,
    fieldType,
    required: optionalBool(row, 'required', `${pathPrefix}.required`, issues),
    maxLength: optionalNumberField(row, 'maxLength', `${pathPrefix}.maxLength`, issues, {
      integer: true,
      min: 0,
    }),
    remark: optionalString(row, 'remark', `${pathPrefix}.remark`, issues),
    displayOrder: optionalNumberField(row, 'displayOrder', `${pathPrefix}.displayOrder`, issues, {
      integer: true,
    }),
  }
}

export function validateComponentFullSpecJsonImport(
  rawItems: Record<string, unknown>[]
): JsonImportValidationResult<ComponentImportItem> {
  return validateJsonImportItems(rawItems, {
    maxItems: COMPONENT_IMPORT_FULL_MAX_ITEMS,
    mapItem: (row, index, issues) => {
      rejectUnknownKeys(row, COMPONENT_KEYS, index, issues)
      const code = requireNonEmptyString(row, 'code', itemPath(index, 'code'), issues)
      const name = requireNonEmptyString(row, 'name', itemPath(index, 'name'), issues)
      if (!code || !name) return null

      let fields: ComponentImportFieldItem[] | undefined
      if ('fields' in row && row.fields != null && row.fields !== '') {
        if (!Array.isArray(row.fields)) {
          issues.push({
            path: itemPath(index, 'fields'),
            message: 'fields must be an array.',
          })
        } else {
          const mapped: ComponentImportFieldItem[] = []
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
            const key = field.fieldKey.toLowerCase()
            if (seenKeys.has(key)) {
              issues.push({
                path: `${itemPath(index, 'fields')}[${fieldIndex}].fieldKey`,
                message: `Duplicate fieldKey "${field.fieldKey}".`,
              })
            }
            seenKeys.add(key)
          })
          fields = mapped
        }
      }

      return {
        code,
        name,
        componentType: optionalString(row, 'componentType', itemPath(index, 'componentType'), issues),
        description: optionalString(row, 'description', itemPath(index, 'description'), issues),
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
