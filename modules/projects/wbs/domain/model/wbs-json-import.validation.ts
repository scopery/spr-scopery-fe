import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import {
  flagDuplicateStrings,
  itemPath,
  optionalNumberField,
  optionalString,
  rejectUnknownKeys,
  requireNonEmptyString,
  validateJsonImportItems,
  type JsonImportValidationResult,
} from '@/shared/lib/jsonImportValidation'
import { WbsNodeType } from '../enums/wbs.enum'
import type { CreateWbsNodePayload } from './wbs'

const ALLOWED_KEYS = new Set([
  'code',
  'title',
  'description',
  'phaseId',
  'parentId',
  'nodeType',
  'sortOrder',
])

const ALLOWED_NODE_TYPES = new Set<string>([
  WbsNodeType.WorkPackage,
  WbsNodeType.TaskGroup,
  WbsNodeType.Milestone,
])

function optionalUuidOrNull(
  row: Record<string, unknown>,
  field: string,
  path: string,
  issues: { path: string; message: string }[]
): string | null | undefined {
  if (!(field in row) || row[field] === undefined) return undefined
  if (row[field] === null || row[field] === '') return null
  if (typeof row[field] !== 'string') {
    issues.push({ path, message: `${field} must be a UUID string or null.` })
    return undefined
  }
  const value = row[field].trim()
  if (!value) return null
  const uuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  if (!uuid.test(value)) {
    issues.push({ path, message: `${field} must be a valid UUID.` })
    return undefined
  }
  return value
}

export function validateWbsJsonImport(
  rawItems: Record<string, unknown>[]
): JsonImportValidationResult<CreateWbsNodePayload> {
  return validateJsonImportItems(rawItems, {
    maxItems: BULK_MAX_ITEMS,
    mapItem: (row, index, issues) => {
      rejectUnknownKeys(row, ALLOWED_KEYS, index, issues)
      const code = requireNonEmptyString(row, 'code', itemPath(index, 'code'), issues)
      const title = requireNonEmptyString(row, 'title', itemPath(index, 'title'), issues)
      const phaseId = requireNonEmptyString(row, 'phaseId', itemPath(index, 'phaseId'), issues)
      const description = optionalString(row, 'description', itemPath(index, 'description'), issues)
      const parentId = optionalUuidOrNull(row, 'parentId', itemPath(index, 'parentId'), issues)
      const nodeTypeRaw = requireNonEmptyString(
        row,
        'nodeType',
        itemPath(index, 'nodeType'),
        issues
      )
      const nodeType = nodeTypeRaw?.toUpperCase().replace(/\s+/g, '_') ?? ''
      if (nodeType && !ALLOWED_NODE_TYPES.has(nodeType)) {
        issues.push({
          path: itemPath(index, 'nodeType'),
          message: `nodeType must be one of: ${[...ALLOWED_NODE_TYPES].join(', ')}.`,
        })
      }
      const sortOrder = optionalNumberField(
        row,
        'sortOrder',
        itemPath(index, 'sortOrder'),
        issues,
        { integer: true, min: 0 }
      )

      if (phaseId) {
        const uuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        if (!uuid.test(phaseId)) {
          issues.push({
            path: itemPath(index, 'phaseId'),
            message: 'phaseId must be a valid UUID.',
          })
        }
      }

      if (!code || !title || !phaseId || !nodeType || !ALLOWED_NODE_TYPES.has(nodeType)) {
        return null
      }

      return {
        code: code.toUpperCase(),
        title,
        description: description ?? null,
        phaseId,
        parentId: parentId === undefined ? null : parentId,
        nodeType,
        sortOrder: sortOrder ?? 1,
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
