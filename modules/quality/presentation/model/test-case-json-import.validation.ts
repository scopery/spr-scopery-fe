import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import {
  flagDuplicateStrings,
  itemPath,
  optionalEnum,
  optionalString,
  rejectUnknownKeys,
  requireNonEmptyString,
  validateJsonImportItems,
  type JsonImportIssue,
  type JsonImportValidationResult,
} from '@/shared/lib/jsonImportValidation'
import {
  AutomationStatus,
  TestCasePriority,
  TestCaseType,
} from '../../domain/enums/quality.enum'
import type {
  CreateTestCasePayload,
  CreateTestCaseStepPayload,
} from '../../domain/model/quality'

const ALLOWED_KEYS = new Set([
  'title',
  'code',
  'description',
  'type',
  'priority',
  'automationStatus',
  'preconditions',
  'expectedResult',
  'steps',
])

const STEP_KEYS = new Set(['action', 'expectedResult'])

export interface ValidatedTestCaseImportItem {
  payload: CreateTestCasePayload
  steps: CreateTestCaseStepPayload[]
}

function mapSteps(
  raw: unknown,
  itemIndex: number,
  issues: JsonImportIssue[]
): CreateTestCaseStepPayload[] | null {
  if (raw == null) return []
  if (!Array.isArray(raw)) {
    issues.push({
      path: itemPath(itemIndex, 'steps'),
      message: 'steps must be an array when provided.',
    })
    return null
  }

  const steps: CreateTestCaseStepPayload[] = []
  raw.forEach((entry, stepIndex) => {
    const path = `items[${itemIndex}].steps[${stepIndex}]`
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      issues.push({ path, message: 'Each step must be an object.' })
      return
    }
    const row = entry as Record<string, unknown>
    for (const key of Object.keys(row)) {
      if (!STEP_KEYS.has(key)) {
        issues.push({
          path: `${path}.${key}`,
          message: `Unknown step field "${key}". Allowed: ${[...STEP_KEYS].join(', ')}.`,
        })
      }
    }
    const action = requireNonEmptyString(row, 'action', `${path}.action`, issues, 'action')
    if (!action) return
    const expectedResult = optionalString(
      row,
      'expectedResult',
      `${path}.expectedResult`,
      issues
    )
    steps.push({
      action,
      expectedResult,
    })
  })
  return steps
}

export function validateTestCaseJsonImport(
  rawItems: Record<string, unknown>[]
): JsonImportValidationResult<ValidatedTestCaseImportItem> {
  return validateJsonImportItems(rawItems, {
    maxItems: BULK_MAX_ITEMS,
    mapItem: (row, index, issues) => {
      const keys = { ...row }
      if (Object.prototype.hasOwnProperty.call(keys, 'id')) {
        issues.push({
          path: itemPath(index, 'id'),
          message:
            'Do not send id — it is assigned by the system. Use code for the business key instead.',
        })
        delete keys.id
      }
      rejectUnknownKeys(keys, ALLOWED_KEYS, index, issues)

      const title = requireNonEmptyString(keys, 'title', itemPath(index, 'title'), issues)
      const code = optionalString(keys, 'code', itemPath(index, 'code'), issues)
      const description = optionalString(keys, 'description', itemPath(index, 'description'), issues)
      const preconditions = optionalString(
        keys,
        'preconditions',
        itemPath(index, 'preconditions'),
        issues
      )
      const expectedResult = optionalString(
        keys,
        'expectedResult',
        itemPath(index, 'expectedResult'),
        issues
      )

      const type =
        optionalEnum(
          keys,
          'type',
          Object.values(TestCaseType),
          itemPath(index, 'type'),
          issues
        ) ?? TestCaseType.Functional

      if (type === TestCaseType.NonFunctional) {
        issues.push({
          path: itemPath(index, 'type'),
          message: 'NON_FUNCTIONAL is not allowed here. Use Verification Cases instead.',
        })
      }

      const priority =
        optionalEnum(
          keys,
          'priority',
          Object.values(TestCasePriority),
          itemPath(index, 'priority'),
          issues
        ) ?? TestCasePriority.Medium

      const automationStatus = optionalEnum(
        keys,
        'automationStatus',
        Object.values(AutomationStatus),
        itemPath(index, 'automationStatus'),
        issues
      )

      const steps = mapSteps(keys.steps, index, issues)
      if (title == null || steps == null) return null

      return {
        payload: {
          title,
          code,
          description,
          type,
          priority,
          automationStatus: automationStatus ?? undefined,
          preconditions,
          expectedResult,
        },
        steps,
      }
    },
    afterAll: (mapped, issues) => {
      flagDuplicateStrings(
        mapped
          .map((item, index) =>
            item.payload.code
              ? { index, value: item.payload.code, field: 'code' }
              : null
          )
          .filter((v): v is { index: number; value: string; field: string } => Boolean(v)),
        issues
      )
    },
  })
}
