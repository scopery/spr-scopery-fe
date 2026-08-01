import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import {
  flagDuplicateStrings,
  itemPath,
  optionalString,
  rejectUnknownKeys,
  requireEnum,
  requireNonEmptyString,
  validateJsonImportItems,
  type JsonImportValidationResult,
} from '@/shared/lib/jsonImportValidation'
import type { ArchitectureNodeType } from './architecture-workbench'

export type CatalogJsonImportKind = ArchitectureNodeType

export interface CatalogJsonImportItem {
  code: string
  name: string
  extra?: string
}

const MODULE_KEYS = new Set(['code', 'name', 'description'])
const SCREEN_KEYS = new Set(['code', 'name', 'routePath'])
const API_KEYS = new Set(['method', 'pathPattern', 'name'])
const COMPONENT_KEYS = new Set(['code', 'name', 'componentType'])
const DATA_KEYS = new Set(['code', 'name', 'tableName'])
const COMM_KEYS = new Set(['code', 'name', 'triggerKey'])

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

      return {
        code,
        name,
        extra: optionalString(row, extraKey, itemPath(index, extraKey), issues) ?? undefined,
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
