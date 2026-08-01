import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import {
  flagDuplicateStrings,
  itemPath,
  optionalString,
  readString,
  rejectUnknownKeys,
  requireNonEmptyString,
  validateJsonImportItems,
  type JsonImportIssue,
  type JsonImportValidationResult,
} from '@/shared/lib/jsonImportValidation'
import type { CreateRequirementPayload } from './requirements'

const ALLOWED_KEYS = new Set([
  'title',
  'code',
  'description',
  'requirementType',
  'priority',
])

/** Canonical values accepted by create / bulk APIs. */
export const REQUIREMENT_IMPORT_TYPES = [
  'FUNCTIONAL',
  'NON_FUNCTIONAL',
  'BUSINESS',
  'TECHNICAL',
  'CONSTRAINT',
] as const

export const REQUIREMENT_IMPORT_PRIORITIES = ['HIGH', 'MEDIUM', 'LOW'] as const

/**
 * Aliases agents often emit (and that the guide previously advertised).
 * Mapped to canonical enums before submit so JSON import is not blocked.
 */
const TYPE_ALIASES: Record<string, (typeof REQUIREMENT_IMPORT_TYPES)[number]> = {
  FR: 'FUNCTIONAL',
  FUNC: 'FUNCTIONAL',
  NFR: 'NON_FUNCTIONAL',
  'NON-FUNCTIONAL': 'NON_FUNCTIONAL',
  NONFUNCTIONAL: 'NON_FUNCTIONAL',
  SECURITY: 'CONSTRAINT',
  COMPLIANCE: 'CONSTRAINT',
  OTHER: 'BUSINESS',
}

const PRIORITY_ALIASES: Record<string, (typeof REQUIREMENT_IMPORT_PRIORITIES)[number]> = {
  CRITICAL: 'HIGH',
  P0: 'HIGH',
  P1: 'HIGH',
  H: 'HIGH',
  P2: 'MEDIUM',
  M: 'MEDIUM',
  P3: 'LOW',
  L: 'LOW',
}

function normalizeRequirementType(
  raw: unknown,
  path: string,
  issues: JsonImportIssue[]
): (typeof REQUIREMENT_IMPORT_TYPES)[number] | null {
  const s = readString(raw)
  if (s == null || s === '') return 'FUNCTIONAL'
  const key = s.toUpperCase().replace(/\s+/g, '_')
  const aliased = TYPE_ALIASES[key]
  if (aliased) return aliased
  if ((REQUIREMENT_IMPORT_TYPES as readonly string[]).includes(key)) {
    return key as (typeof REQUIREMENT_IMPORT_TYPES)[number]
  }
  issues.push({
    path,
    message: `requirementType must be one of: ${REQUIREMENT_IMPORT_TYPES.join(', ')} (aliases: SECURITY→CONSTRAINT, COMPLIANCE→CONSTRAINT, OTHER→BUSINESS). Got ${JSON.stringify(s)}.`,
  })
  return null
}

function normalizeRequirementPriority(
  raw: unknown,
  path: string,
  issues: JsonImportIssue[]
): (typeof REQUIREMENT_IMPORT_PRIORITIES)[number] | null {
  const s = readString(raw)
  if (s == null || s === '') return 'MEDIUM'
  const key = s.toUpperCase()
  const aliased = PRIORITY_ALIASES[key]
  if (aliased) return aliased
  if ((REQUIREMENT_IMPORT_PRIORITIES as readonly string[]).includes(key)) {
    return key as (typeof REQUIREMENT_IMPORT_PRIORITIES)[number]
  }
  issues.push({
    path,
    message: `priority must be one of: ${REQUIREMENT_IMPORT_PRIORITIES.join(', ')} (alias: CRITICAL→HIGH). Got ${JSON.stringify(s)}.`,
  })
  return null
}

export function validateRequirementJsonImport(
  rawItems: Record<string, unknown>[]
): JsonImportValidationResult<CreateRequirementPayload> {
  return validateJsonImportItems(rawItems, {
    maxItems: BULK_MAX_ITEMS,
    mapItem: (row, index, issues) => {
      rejectUnknownKeys(row, ALLOWED_KEYS, index, issues)
      const title = requireNonEmptyString(row, 'title', itemPath(index, 'title'), issues)
      const requirementType = normalizeRequirementType(
        row.requirementType,
        itemPath(index, 'requirementType'),
        issues
      )
      const priority = normalizeRequirementPriority(
        row.priority,
        itemPath(index, 'priority'),
        issues
      )
      if (!title || !requirementType || !priority) return null
      return {
        title,
        code: optionalString(row, 'code', itemPath(index, 'code'), issues),
        description: optionalString(row, 'description', itemPath(index, 'description'), issues),
        requirementType,
        priority,
      }
    },
    afterAll: (mapped, issues) => {
      flagDuplicateStrings(
        mapped
          .map((item, index) =>
            item.code ? { index, value: item.code, field: 'code' } : null
          )
          .filter((v): v is { index: number; value: string; field: string } => Boolean(v)),
        issues
      )
    },
  })
}
