import {
  asRecord,
  flagDuplicateStrings,
  itemPath,
  optionalEnum,
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
import { SCREEN_MODE_CODE_OPTIONS, TRIGGER_ACTION_CODE_OPTIONS } from '../enums/screen-spec.enum'
import type {
  ScreenImportEventItem,
  ScreenImportFieldItem,
  ScreenImportItem,
  ScreenImportModeConfigItem,
  ScreenImportModeItem,
  ScreenImportProcessItem,
  ScreenImportValidationItem,
} from '../model/screen-spec-import'
import { SCREEN_IMPORT_FULL_MAX_ITEMS } from '../model/screen-spec-import'

const SCREEN_KEYS = new Set([
  'projectId',
  'code',
  'name',
  'routePath',
  'modes',
  'fields',
  'processItems',
  'eventItems',
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

function jsonAsString(
  row: Record<string, unknown>,
  key: string,
  path: string,
  issues: JsonImportIssue[]
): string | null {
  if (!(key in row) || row[key] == null || row[key] === '') return null
  const value = row[key]
  if (typeof value === 'string') return value
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      issues.push({ path, message: `${key} must be a JSON string or object.` })
      return null
    }
  }
  return String(value)
}

function mapObjectArray<T>(
  row: Record<string, unknown>,
  key: string,
  path: string,
  issues: JsonImportIssue[],
  mapOne: (entry: Record<string, unknown>, index: number) => T | null
): T[] | undefined {
  if (!(key in row) || row[key] == null) return undefined
  if (!Array.isArray(row[key])) {
    issues.push({ path, message: `${key} must be an array.` })
    return undefined
  }
  const out: T[] = []
  ;(row[key] as unknown[]).forEach((entry, i) => {
    const rec = asRecord(entry)
    if (!rec) {
      issues.push({ path: `${path}[${i}]`, message: `${key} entries must be objects.` })
      return
    }
    const mapped = mapOne(rec, i)
    if (mapped) out.push(mapped)
  })
  return out
}

function mapMode(row: Record<string, unknown>, pathPrefix: string, issues: JsonImportIssue[]): ScreenImportModeItem | null {
  const modeCode = requireEnum(row, 'modeCode', SCREEN_MODE_CODE_OPTIONS, `${pathPrefix}.modeCode`, issues)
  const name = requireNonEmptyString(row, 'name', `${pathPrefix}.name`, issues)
  if (!modeCode || !name) return null
  return {
    modeCode,
    name,
    displayOrder: optionalNumberField(row, 'displayOrder', `${pathPrefix}.displayOrder`, issues, {
      integer: true,
    }),
  }
}

function mapModeConfig(
  row: Record<string, unknown>,
  pathPrefix: string,
  issues: JsonImportIssue[]
): ScreenImportModeConfigItem | null {
  const modeCode = requireEnum(row, 'modeCode', SCREEN_MODE_CODE_OPTIONS, `${pathPrefix}.modeCode`, issues)
  if (!modeCode) return null
  return {
    modeCode,
    isVisible: optionalBool(row, 'isVisible', `${pathPrefix}.isVisible`, issues) ?? undefined,
    isRequired: optionalBool(row, 'isRequired', `${pathPrefix}.isRequired`, issues) ?? undefined,
    isReadonly: optionalBool(row, 'isReadonly', `${pathPrefix}.isReadonly`, issues) ?? undefined,
    defaultValue: optionalString(row, 'defaultValue', `${pathPrefix}.defaultValue`, issues),
    displayOrder: optionalNumberField(row, 'displayOrder', `${pathPrefix}.displayOrder`, issues, {
      integer: true,
    }),
  }
}

function mapValidation(
  row: Record<string, unknown>,
  pathPrefix: string,
  issues: JsonImportIssue[]
): ScreenImportValidationItem | null {
  const ruleTypeCode = requireNonEmptyString(row, 'ruleTypeCode', `${pathPrefix}.ruleTypeCode`, issues)
  if (!ruleTypeCode) return null
  const modeCode = optionalEnum(
    row,
    'modeCode',
    SCREEN_MODE_CODE_OPTIONS,
    `${pathPrefix}.modeCode`,
    issues
  )
  return {
    ruleTypeCode,
    modeCode,
    ruleParamJson: jsonAsString(row, 'ruleParamJson', `${pathPrefix}.ruleParamJson`, issues),
    conditionJson: jsonAsString(row, 'conditionJson', `${pathPrefix}.conditionJson`, issues),
    errorMessage: optionalString(row, 'errorMessage', `${pathPrefix}.errorMessage`, issues),
    remark: optionalString(row, 'remark', `${pathPrefix}.remark`, issues),
    displayOrder: optionalNumberField(row, 'displayOrder', `${pathPrefix}.displayOrder`, issues, {
      integer: true,
    }),
  }
}

function mapField(row: Record<string, unknown>, pathPrefix: string, issues: JsonImportIssue[]): ScreenImportFieldItem | null {
  const fieldKey = requireNonEmptyString(row, 'fieldKey', `${pathPrefix}.fieldKey`, issues)
  const label = requireNonEmptyString(row, 'label', `${pathPrefix}.label`, issues)
  const fieldType = requireNonEmptyString(row, 'fieldType', `${pathPrefix}.fieldType`, issues)
  if (!fieldKey || !label || !fieldType) return null
  return {
    fieldKey,
    label,
    fieldType,
    description: optionalString(row, 'description', `${pathPrefix}.description`, issues),
    required: optionalBool(row, 'required', `${pathPrefix}.required`, issues),
    displayOrder: optionalNumberField(row, 'displayOrder', `${pathPrefix}.displayOrder`, issues, {
      integer: true,
    }),
    maxLength: optionalNumberField(row, 'maxLength', `${pathPrefix}.maxLength`, issues, {
      integer: true,
      min: 0,
    }),
    remark: optionalString(row, 'remark', `${pathPrefix}.remark`, issues),
    componentCode: optionalString(row, 'componentCode', `${pathPrefix}.componentCode`, issues),
    modeConfigs: mapObjectArray(row, 'modeConfigs', `${pathPrefix}.modeConfigs`, issues, (entry, i) =>
      mapModeConfig(entry, `${pathPrefix}.modeConfigs[${i}]`, issues)
    ),
    validations: mapObjectArray(row, 'validations', `${pathPrefix}.validations`, issues, (entry, i) =>
      mapValidation(entry, `${pathPrefix}.validations[${i}]`, issues)
    ),
  }
}

function mapProcess(
  row: Record<string, unknown>,
  pathPrefix: string,
  issues: JsonImportIssue[]
): ScreenImportProcessItem | null {
  const content = requireNonEmptyString(row, 'content', `${pathPrefix}.content`, issues)
  if (!content) return null
  return {
    content,
    title: optionalString(row, 'title', `${pathPrefix}.title`, issues),
    modeCode: optionalEnum(row, 'modeCode', SCREEN_MODE_CODE_OPTIONS, `${pathPrefix}.modeCode`, issues),
    targetFieldKey: optionalString(row, 'targetFieldKey', `${pathPrefix}.targetFieldKey`, issues),
    sourceTable: optionalString(row, 'sourceTable', `${pathPrefix}.sourceTable`, issues),
    conditionNote: optionalString(row, 'conditionNote', `${pathPrefix}.conditionNote`, issues),
    displayOrder: optionalNumberField(row, 'displayOrder', `${pathPrefix}.displayOrder`, issues, {
      integer: true,
    }),
  }
}

function mapEvent(
  row: Record<string, unknown>,
  pathPrefix: string,
  issues: JsonImportIssue[]
): ScreenImportEventItem | null {
  const content = requireNonEmptyString(row, 'content', `${pathPrefix}.content`, issues)
  if (!content) return null
  return {
    content,
    title: optionalString(row, 'title', `${pathPrefix}.title`, issues),
    modeCode: optionalEnum(row, 'modeCode', SCREEN_MODE_CODE_OPTIONS, `${pathPrefix}.modeCode`, issues),
    triggerFieldKey: optionalString(row, 'triggerFieldKey', `${pathPrefix}.triggerFieldKey`, issues),
    triggerActionCode: optionalEnum(
      row,
      'triggerActionCode',
      TRIGGER_ACTION_CODE_OPTIONS,
      `${pathPrefix}.triggerActionCode`,
      issues
    ),
    conditionNote: optionalString(row, 'conditionNote', `${pathPrefix}.conditionNote`, issues),
    targetScreenCode: optionalString(row, 'targetScreenCode', `${pathPrefix}.targetScreenCode`, issues),
    targetModeCode: optionalEnum(
      row,
      'targetModeCode',
      SCREEN_MODE_CODE_OPTIONS,
      `${pathPrefix}.targetModeCode`,
      issues
    ),
    displayOrder: optionalNumberField(row, 'displayOrder', `${pathPrefix}.displayOrder`, issues, {
      integer: true,
    }),
  }
}

export function validateScreenFullSpecJsonImport(
  rawItems: Record<string, unknown>[],
  defaultProjectId?: string | null
): JsonImportValidationResult<ScreenImportItem> {
  return validateJsonImportItems(rawItems, {
    maxItems: SCREEN_IMPORT_FULL_MAX_ITEMS,
    mapItem: (row, index, issues) => {
      rejectUnknownKeys(row, SCREEN_KEYS, index, issues)
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

      const modes = mapObjectArray(row, 'modes', itemPath(index, 'modes'), issues, (entry, i) =>
        mapMode(entry, `${itemPath(index, 'modes')}[${i}]`, issues)
      )
      const fields = mapObjectArray(row, 'fields', itemPath(index, 'fields'), issues, (entry, i) =>
        mapField(entry, `${itemPath(index, 'fields')}[${i}]`, issues)
      )
      const processItems = mapObjectArray(
        row,
        'processItems',
        itemPath(index, 'processItems'),
        issues,
        (entry, i) => mapProcess(entry, `${itemPath(index, 'processItems')}[${i}]`, issues)
      )
      const eventItems = mapObjectArray(
        row,
        'eventItems',
        itemPath(index, 'eventItems'),
        issues,
        (entry, i) => mapEvent(entry, `${itemPath(index, 'eventItems')}[${i}]`, issues)
      )

      return {
        projectId,
        code,
        name,
        routePath: optionalString(row, 'routePath', itemPath(index, 'routePath'), issues),
        modes,
        fields,
        processItems,
        eventItems,
      }
    },
    afterAll: (mapped, issues) => {
      flagDuplicateStrings(
        mapped.map((item, index) => ({ index, value: item.code, field: 'code' })),
        issues
      )
    },
  })
}
