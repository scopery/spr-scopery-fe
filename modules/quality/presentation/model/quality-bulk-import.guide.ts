import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'
import {
  AutomationStatus,
  TestCasePriority,
  TestCaseType,
} from '../../domain/enums/quality.enum'

/** Full Test Case JSON import (shell fields + optional steps). */
export const TEST_CASE_JSON_IMPORT_GUIDE: BulkImportFormatGuide = {
  entityLabel: 'Test Case',
  maxItems: BULK_MAX_ITEMS,
  notes: [
    'Paste into JSON Import only (not Bulk add grid).',
    'title is required per item.',
    'Use code for the business key (e.g. TC-001). Never send id — the system assigns UUID ids.',
    'Import submits one async bulk job (POST …/bulk), then the paste dialog closes immediately.',
    'Do not put Use Case / screen / component IDs here — link those afterward in the app.',
    'Optional steps[] are created by the backend after each shell — FE does not loop creates.',
    'steps[].action is required; expectedResult is optional.',
    'Enums must match exactly (UPPER_SNAKE_CASE).',
  ],
  fields: [
    {
      name: 'title',
      required: true,
      type: 'string',
      description: 'Test case title.',
    },
    {
      name: 'code',
      required: false,
      type: 'string',
      description: 'Business code (e.g. TC-001). Not the system id.',
    },
    {
      name: 'description',
      required: false,
      type: 'string',
      description: 'Longer description of what is verified.',
    },
    {
      name: 'type',
      required: false,
      type: 'enum',
      description: 'Defaults to FUNCTIONAL when omitted.',
      enumValues: Object.values(TestCaseType),
      enumNotes: 'Use FUNCTIONAL for use-case based cases. Prefer Verification Cases for NFR.',
    },
    {
      name: 'priority',
      required: false,
      type: 'enum',
      description: 'Defaults to MEDIUM when omitted.',
      enumValues: Object.values(TestCasePriority),
    },
    {
      name: 'automationStatus',
      required: false,
      type: 'enum',
      description: 'Automation readiness.',
      enumValues: Object.values(AutomationStatus),
    },
    {
      name: 'preconditions',
      required: false,
      type: 'string',
      description: 'Setup conditions before execution.',
    },
    {
      name: 'expectedResult',
      required: false,
      type: 'string',
      description: 'Overall expected outcome when the case passes.',
    },
    {
      name: 'steps[].action',
      required: true,
      type: 'string',
      description: 'Step action text.',
    },
    {
      name: 'steps[].expectedResult',
      required: false,
      type: 'string',
      description: 'Expected result for this step.',
    },
  ],
  sample: {
    items: [
      {
        title: 'Login succeeds with valid credentials',
        code: 'TC-001',
        description: 'Happy-path authentication',
        type: 'FUNCTIONAL',
        priority: 'HIGH',
        automationStatus: 'MANUAL',
        preconditions: 'User account exists and is active',
        expectedResult: 'User lands on the home workspace',
        steps: [
          {
            action: 'Open the login page',
            expectedResult: 'Login form is visible',
          },
          {
            action: 'Enter valid email and password, then submit',
            expectedResult: 'Home workspace opens',
          },
        ],
      },
    ],
  },
}

/** @deprecated Prefer TEST_CASE_JSON_IMPORT_GUIDE — kept for CaseImportFlow compatibility. */
export const TEST_CASE_BULK_IMPORT_GUIDE = TEST_CASE_JSON_IMPORT_GUIDE
