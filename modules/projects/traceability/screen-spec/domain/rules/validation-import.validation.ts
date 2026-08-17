import {
  itemPath,
  optionalEnum,
  optionalNumberField,
  optionalString,
  rejectUnknownKeys,
  requireNonEmptyString,
  validateJsonImportItems,
  type JsonImportIssue,
  type JsonImportValidationResult,
} from '@/shared/lib/jsonImportValidation'
import { SCREEN_MODE_CODE_OPTIONS } from '../enums/screen-spec.enum'
import {
  FIELD_VALIDATION_IMPORT_MAX_ITEMS,
  type FieldValidationImportItem,
  type FieldValidationImportRefs,
  type ResolvedFieldValidationImport,
} from '../model/validation-import'

const ITEM_KEYS = new Set([
  'fieldKey',
  'ruleTypeCode',
  'modeCode',
  'ruleParamJson',
  'conditionJson',
  'errorMessage',
  'remark',
  'displayOrder',
])

function optionalJsonValue(
  row: Record<string, unknown>,
  key: string,
  path: string,
  issues: JsonImportIssue[]
): unknown {
  if (!(key in row) || row[key] == null || row[key] === '') return null
  const value = row[key]
  if (typeof value === 'object') return value
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return null
    try {
      return JSON.parse(trimmed) as unknown
    } catch {
      issues.push({ path, message: `${key} must be a JSON object or a JSON string.` })
      return null
    }
  }
  issues.push({ path, message: `${key} must be a JSON object or a JSON string.` })
  return null
}

function findByKey<T extends { id: string }>(
  items: T[],
  key: string,
  read: (item: T) => string
): T | undefined {
  const exact = items.find((item) => read(item) === key)
  if (exact) return exact
  const lower = key.toLowerCase()
  return items.find((item) => read(item).toLowerCase() === lower)
}

export function validateFieldValidationJsonImport(
  rawItems: Record<string, unknown>[]
): JsonImportValidationResult<FieldValidationImportItem> {
  return validateJsonImportItems(rawItems, {
    maxItems: FIELD_VALIDATION_IMPORT_MAX_ITEMS,
    mapItem: (row, index, issues) => {
      rejectUnknownKeys(row, ITEM_KEYS, index, issues)
      const fieldKey = requireNonEmptyString(row, 'fieldKey', itemPath(index, 'fieldKey'), issues)
      const ruleTypeCode = requireNonEmptyString(
        row,
        'ruleTypeCode',
        itemPath(index, 'ruleTypeCode'),
        issues
      )
      if (!fieldKey || !ruleTypeCode) return null
      return {
        fieldKey,
        ruleTypeCode,
        modeCode: optionalEnum(
          row,
          'modeCode',
          SCREEN_MODE_CODE_OPTIONS,
          itemPath(index, 'modeCode'),
          issues
        ),
        ruleParamJson: optionalJsonValue(
          row,
          'ruleParamJson',
          itemPath(index, 'ruleParamJson'),
          issues
        ),
        conditionJson: optionalJsonValue(
          row,
          'conditionJson',
          itemPath(index, 'conditionJson'),
          issues
        ),
        errorMessage: optionalString(row, 'errorMessage', itemPath(index, 'errorMessage'), issues),
        remark: optionalString(row, 'remark', itemPath(index, 'remark'), issues),
        displayOrder: optionalNumberField(
          row,
          'displayOrder',
          itemPath(index, 'displayOrder'),
          issues,
          { integer: true }
        ),
      }
    },
  })
}

export function resolveFieldValidationImports(
  items: FieldValidationImportItem[],
  refs: FieldValidationImportRefs
): JsonImportValidationResult<ResolvedFieldValidationImport> {
  const issues: JsonImportIssue[] = []
  const resolved: ResolvedFieldValidationImport[] = []

  items.forEach((item, index) => {
    const field = findByKey(refs.fields, item.fieldKey, (f) => f.fieldKey)
    if (!field) {
      issues.push({
        path: itemPath(index, 'fieldKey'),
        message: `No field "${item.fieldKey}" on this screen.`,
      })
    }

    const ruleType = findByKey(refs.ruleTypes, item.ruleTypeCode, (t) => t.code)
    if (!ruleType) {
      const known = refs.ruleTypes.map((t) => t.code).filter(Boolean)
      issues.push({
        path: itemPath(index, 'ruleTypeCode'),
        message: known.length
          ? `Unknown ruleTypeCode "${item.ruleTypeCode}". Available: ${known.join(', ')}.`
          : `Unknown ruleTypeCode "${item.ruleTypeCode}". Load workspace rule types first.`,
      })
    }

    let modeId: string | null = null
    if (item.modeCode) {
      const mode = findByKey(refs.modes, item.modeCode, (m) => m.modeCode)
      if (!mode) {
        issues.push({
          path: itemPath(index, 'modeCode'),
          message: `This screen has no mode "${item.modeCode}".`,
        })
      } else {
        modeId = mode.id
      }
    }

    if (!field || !ruleType) return
    if (item.modeCode && !modeId) return

    resolved.push({
      fieldKey: field.fieldKey,
      fieldId: field.id,
      body: {
        ruleTypeId: ruleType.id,
        modeId,
        ruleParamJson: item.ruleParamJson ?? null,
        conditionJson: item.conditionJson ?? null,
        errorMessage: item.errorMessage ?? null,
        remark: item.remark ?? null,
        displayOrder: item.displayOrder ?? null,
      },
    })
  })

  if (issues.length > 0) return { ok: false, issues }
  return { ok: true, items: resolved, issues: [] }
}
