import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import {
  flagDuplicateStrings,
  itemPath,
  optionalIsoDateField,
  optionalNumberField,
  optionalString,
  rejectUnknownKeys,
  requireNonEmptyString,
  validateJsonImportItems,
  type JsonImportIssue,
  type JsonImportValidationResult,
} from '@/shared/lib/jsonImportValidation'
import type { CreateProjectPhasePayload } from './phase'

const ALLOWED_KEYS = new Set([
  'code',
  'name',
  'description',
  'displayOrder',
  'plannedStartDate',
  'plannedEndDate',
])

export function validatePhaseJsonImport(
  rawItems: Record<string, unknown>[],
  nextDisplayOrder: number
): JsonImportValidationResult<CreateProjectPhasePayload> {
  return validateJsonImportItems(rawItems, {
    maxItems: BULK_MAX_ITEMS,
    mapItem: (row, index, issues) => {
      rejectUnknownKeys(row, ALLOWED_KEYS, index, issues)
      const code = requireNonEmptyString(row, 'code', itemPath(index, 'code'), issues)
      const name = requireNonEmptyString(row, 'name', itemPath(index, 'name'), issues)
      const description = optionalString(row, 'description', itemPath(index, 'description'), issues)
      const displayOrder = optionalNumberField(
        row,
        'displayOrder',
        itemPath(index, 'displayOrder'),
        issues,
        { integer: true, min: 1 }
      )
      const plannedStartDate = optionalIsoDateField(
        row,
        'plannedStartDate',
        itemPath(index, 'plannedStartDate'),
        issues
      )
      const plannedEndDate = optionalIsoDateField(
        row,
        'plannedEndDate',
        itemPath(index, 'plannedEndDate'),
        issues
      )
      if (
        plannedStartDate &&
        plannedEndDate &&
        plannedEndDate < plannedStartDate
      ) {
        issues.push({
          path: itemPath(index, 'plannedEndDate'),
          message: 'plannedEndDate must be on or after plannedStartDate.',
        })
      }
      if (!code || !name) return null
      return {
        code,
        name,
        description,
        displayOrder: displayOrder ?? undefined,
        plannedStartDate,
        plannedEndDate,
      }
    },
    afterAll: (mapped, issues) => {
      flagDuplicateStrings(
        mapped.map((item, index) => ({ index, value: item.code, field: 'code' })),
        issues
      )
      assignOrders(mapped, nextDisplayOrder, issues)
    },
  })
}

function assignOrders(
  mapped: CreateProjectPhasePayload[],
  nextDisplayOrder: number,
  issues: JsonImportIssue[]
): void {
  const used = new Set<number>()
  let auto = nextDisplayOrder
  mapped.forEach((item, index) => {
    if (item.displayOrder != null) {
      if (used.has(item.displayOrder)) {
        issues.push({
          path: itemPath(index, 'displayOrder'),
          message: `Duplicate displayOrder ${item.displayOrder} in this batch.`,
        })
      } else {
        used.add(item.displayOrder)
      }
      return
    }
    while (used.has(auto)) auto += 1
    item.displayOrder = auto
    used.add(auto)
    auto += 1
  })
}
