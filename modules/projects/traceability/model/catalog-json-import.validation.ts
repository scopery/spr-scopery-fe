import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import {
  asRecord,
  flagDuplicateStrings,
  itemPath,
  optionalString,
  rejectUnknownKeys,
  requireEnum,
  requireNonEmptyString,
  validateJsonImportItems,
  type JsonImportIssue,
  type JsonImportValidationResult,
} from '@/shared/lib/jsonImportValidation'
import {
  API_PARAM_LOCATION_OPTIONS,
  type ApiRequestParam,
} from './application-registry'
import type { ArchitectureNodeType } from './architecture-workbench'

export type CatalogJsonImportKind = ArchitectureNodeType

export interface CatalogJsonImportItem {
  code: string
  name: string
  extra?: string
  description?: string | null
  requestParams?: ApiRequestParam[] | null
  responseSchemaJson?: string | null
}

const MODULE_KEYS = new Set(['code', 'name', 'description'])
const SCREEN_KEYS = new Set(['code', 'name', 'routePath'])
const API_KEYS = new Set([
  'method',
  'pathPattern',
  'name',
  'description',
  'requestParams',
  'responseSchemaJson',
])
const COMPONENT_KEYS = new Set(['code', 'name', 'componentType', 'description'])
const DATA_KEYS = new Set(['code', 'name', 'tableName', 'description'])
const COMM_KEYS = new Set(['code', 'name', 'triggerKey'])
const API_PARAM_KEYS = new Set(['name', 'in', 'type', 'required', 'description', 'example'])

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const

function keysFor(kind: CatalogJsonImportKind): Set<string> {
  switch (kind) {
    case 'MODULE':
      return MODULE_KEYS
    case 'SCREEN':
      return SCREEN_KEYS
    case 'API_ENDPOINT':
      return API_KEYS
    case 'COMPONENT':
      return COMPONENT_KEYS
    case 'DATA_ENTITY':
      return DATA_KEYS
    case 'COMMUNICATION':
      return COMM_KEYS
  }
}

function parseResponseSchemaJson(
  row: Record<string, unknown>,
  index: number,
  issues: JsonImportIssue[]
): string | null {
  if (!('responseSchemaJson' in row) || row.responseSchemaJson == null || row.responseSchemaJson === '') {
    return null
  }
  const value = row.responseSchemaJson
  if (typeof value === 'string') return value.trim() || null
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      issues.push({
        path: itemPath(index, 'responseSchemaJson'),
        message: 'responseSchemaJson must be a JSON string or object.',
      })
      return null
    }
  }
  issues.push({
    path: itemPath(index, 'responseSchemaJson'),
    message: 'responseSchemaJson must be a JSON string or object.',
  })
  return null
}

function parseRequestParams(
  row: Record<string, unknown>,
  index: number,
  issues: JsonImportIssue[]
): ApiRequestParam[] | null {
  if (!('requestParams' in row) || row.requestParams == null || row.requestParams === '') {
    return null
  }
  let list: unknown = row.requestParams
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list) as unknown
    } catch {
      issues.push({
        path: itemPath(index, 'requestParams'),
        message: 'requestParams must be an array or a JSON array string.',
      })
      return null
    }
  }
  if (!Array.isArray(list)) {
    issues.push({
      path: itemPath(index, 'requestParams'),
      message: 'requestParams must be an array.',
    })
    return null
  }

  const params: ApiRequestParam[] = []
  list.forEach((entry, paramIndex) => {
    const rec = asRecord(entry)
    const path = `${itemPath(index, 'requestParams')}[${paramIndex}]`
    if (!rec) {
      issues.push({ path, message: 'Each requestParam must be an object.' })
      return
    }
    for (const key of Object.keys(rec)) {
      if (!API_PARAM_KEYS.has(key)) {
        issues.push({
          path: `${path}.${key}`,
          message: `Unknown field "${key}". Allowed: ${[...API_PARAM_KEYS].join(', ')}.`,
        })
      }
    }
    const name = requireNonEmptyString(rec, 'name', `${path}.name`, issues)
    const loc = requireEnum(rec, 'in', API_PARAM_LOCATION_OPTIONS, `${path}.in`, issues, 'in')
    if (!name || !loc) return
    let required: boolean | undefined
    if ('required' in rec && rec.required != null && rec.required !== '') {
      if (typeof rec.required === 'boolean') required = rec.required
      else if (rec.required === 'true' || rec.required === 'false') required = rec.required === 'true'
      else {
        issues.push({ path: `${path}.required`, message: 'required must be a boolean.' })
      }
    }
    params.push({
      name,
      in: loc as ApiRequestParam['in'],
      type: optionalString(rec, 'type', `${path}.type`, issues) || 'string',
      required,
      description: optionalString(rec, 'description', `${path}.description`, issues),
      example: optionalString(rec, 'example', `${path}.example`, issues),
    })
  })
  return params
}

export function validateCatalogJsonImport(
  kind: CatalogJsonImportKind,
  rawItems: Record<string, unknown>[]
): JsonImportValidationResult<CatalogJsonImportItem> {
  return validateJsonImportItems(rawItems, {
    maxItems: BULK_MAX_ITEMS,
    mapItem: (row, index, issues) => {
      rejectUnknownKeys(row, keysFor(kind), index, issues)

      if (kind === 'API_ENDPOINT') {
        const code = requireEnum(
          row,
          'method',
          HTTP_METHODS,
          itemPath(index, 'method'),
          issues,
          'method'
        )
        const name = requireNonEmptyString(
          row,
          'pathPattern',
          itemPath(index, 'pathPattern'),
          issues,
          'pathPattern'
        )
        if (!code || !name) return null
        if (!name.startsWith('/')) {
          issues.push({
            path: itemPath(index, 'pathPattern'),
            message: 'pathPattern should start with "/".',
          })
        }
        return {
          code,
          name,
          extra: optionalString(row, 'name', itemPath(index, 'name'), issues) ?? undefined,
          description: optionalString(row, 'description', itemPath(index, 'description'), issues),
          requestParams: parseRequestParams(row, index, issues),
          responseSchemaJson: parseResponseSchemaJson(row, index, issues),
        }
      }

      const code = requireNonEmptyString(row, 'code', itemPath(index, 'code'), issues)
      const name = requireNonEmptyString(row, 'name', itemPath(index, 'name'), issues)
      if (!code || !name) return null

      const extraKey =
        kind === 'MODULE'
          ? 'description'
          : kind === 'SCREEN'
            ? 'routePath'
            : kind === 'COMPONENT'
              ? 'componentType'
              : kind === 'COMMUNICATION'
                ? 'triggerKey'
                : 'tableName'

      const description =
        kind === 'COMPONENT' || kind === 'DATA_ENTITY'
          ? optionalString(row, 'description', itemPath(index, 'description'), issues)
          : kind === 'MODULE'
            ? optionalString(row, 'description', itemPath(index, 'description'), issues)
            : null

      return {
        code,
        name,
        extra: optionalString(row, extraKey, itemPath(index, extraKey), issues) ?? undefined,
        description,
      }
    },
    afterAll: (mapped, issues) => {
      flagDuplicateStrings(
        mapped.map((item, index) => ({
          index,
          value: kind === 'API_ENDPOINT' ? `${item.code} ${item.name}` : item.code,
          field: kind === 'API_ENDPOINT' ? 'pathPattern' : 'code',
        })),
        issues
      )
    },
  })
}
