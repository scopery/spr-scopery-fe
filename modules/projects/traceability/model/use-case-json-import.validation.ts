import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import {
  flagDuplicateStrings,
  itemPath,
  optionalString,
  rejectUnknownKeys,
  requireNonEmptyString,
  validateJsonImportItems,
  type JsonImportValidationResult,
} from '@/shared/lib/jsonImportValidation'
import type { CreateUseCaseBody } from './use-case'
import type { UseCaseNestedImportPayload } from './use-case-nested-import'
import { mapOptionalNestedPartsFromItem } from './use-case-nested-json-import.validation'

const ALLOWED_KEYS = new Set([
  'key',
  'name',
  'goal',
  'primaryActorName',
  'triggerText',
  'flows',
  'conditions',
  'businessRules',
  'acceptanceCriteria',
])

/** One JSON import row: Use Case shell plus optional nested parts. */
export interface UseCaseJsonImportItem {
  shell: CreateUseCaseBody
  nested?: UseCaseNestedImportPayload
}

export function validateUseCaseJsonImport(
  rawItems: Record<string, unknown>[]
): JsonImportValidationResult<UseCaseJsonImportItem> {
  return validateJsonImportItems(rawItems, {
    maxItems: BULK_MAX_ITEMS,
    mapItem: (row, index, issues) => {
      rejectUnknownKeys(row, ALLOWED_KEYS, index, issues)
      const key = requireNonEmptyString(row, 'key', itemPath(index, 'key'), issues)
      const name = requireNonEmptyString(row, 'name', itemPath(index, 'name'), issues)
      if (!key || !name) return null

      const nested = mapOptionalNestedPartsFromItem(row, index, issues)

      return {
        shell: {
          key,
          name,
          goal: optionalString(row, 'goal', itemPath(index, 'goal'), issues),
          primaryActorName: optionalString(
            row,
            'primaryActorName',
            itemPath(index, 'primaryActorName'),
            issues
          ),
          triggerText: optionalString(row, 'triggerText', itemPath(index, 'triggerText'), issues),
        },
        nested,
      }
    },
    afterAll: (mapped, issues) => {
      flagDuplicateStrings(
        mapped.map((item, index) => ({ index, value: item.shell.key, field: 'key' })),
        issues
      )
    },
  })
}

/** @deprecated Use validateUseCaseJsonImport — kept as alias for older call sites. */
export const validateUseCaseShellJsonImport = validateUseCaseJsonImport
