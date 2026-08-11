import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import {
  flagDuplicateStrings,
  itemPath,
  optionalEnum,
  optionalIsoDateField,
  optionalNumberField,
  optionalString,
  rejectUnknownKeys,
  requireNonEmptyString,
  requireUuid,
  validateJsonImportItems,
  type JsonImportValidationResult,
} from '@/shared/lib/jsonImportValidation'
import { TaskPriority } from '../../../project/domain/enums/project.enum'
import type { CreateTaskPayload } from './task'

const ALLOWED_KEYS = new Set([
  'code',
  'title',
  'projectPhaseId',
  'estimateHours',
  'description',
  'priority',
  'plannedStartDate',
  'dueDate',
])

const PRIORITY_VALUES = [
  TaskPriority.Low,
  TaskPriority.Medium,
  TaskPriority.High,
  TaskPriority.Critical,
] as const

export function validateTaskJsonImport(
  rawItems: Record<string, unknown>[]
): JsonImportValidationResult<CreateTaskPayload> {
  return validateJsonImportItems(rawItems, {
    maxItems: BULK_MAX_ITEMS,
    mapItem: (row, index, issues) => {
      rejectUnknownKeys(row, ALLOWED_KEYS, index, issues)

      const code = requireNonEmptyString(row, 'code', itemPath(index, 'code'), issues)
      const title = requireNonEmptyString(row, 'title', itemPath(index, 'title'), issues)
      const projectPhaseId = requireUuid(
        row,
        'projectPhaseId',
        itemPath(index, 'projectPhaseId'),
        issues,
        'projectPhaseId'
      )
      const estimateHours = optionalNumberField(
        row,
        'estimateHours',
        itemPath(index, 'estimateHours'),
        issues,
        { min: 0.01, label: 'estimateHours' }
      )

      if (!row['estimateHours'] && row['estimateHours'] !== 0) {
        // field missing — treat as required
        issues.push({
          path: itemPath(index, 'estimateHours'),
          message: 'estimateHours is required and must be ≥ 0.01.',
        })
      }

      const description = optionalString(row, 'description', itemPath(index, 'description'), issues)
      const priority = optionalEnum(
        row,
        'priority',
        PRIORITY_VALUES,
        itemPath(index, 'priority'),
        issues
      )
      const plannedStartDate = optionalIsoDateField(
        row,
        'plannedStartDate',
        itemPath(index, 'plannedStartDate'),
        issues
      )
      const dueDate = optionalIsoDateField(row, 'dueDate', itemPath(index, 'dueDate'), issues)

      if (plannedStartDate && dueDate && dueDate < plannedStartDate) {
        issues.push({
          path: itemPath(index, 'dueDate'),
          message: 'dueDate must be on or after plannedStartDate.',
        })
      }

      if (!code || !title || !projectPhaseId || estimateHours == null || estimateHours < 0.01) {
        return null
      }

      return {
        code,
        title,
        projectPhaseId,
        estimateHours,
        description,
        priority: priority ?? TaskPriority.Medium,
        plannedStartDate,
        dueDate,
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
