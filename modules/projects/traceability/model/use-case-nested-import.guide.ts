import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'

/**
 * Nested-only payload shape (legacy detail Import). Prefer embedding these arrays
 * on each item in Use Case JSON import (`USE_CASE_BULK_IMPORT_GUIDE`).
 */
export const USE_CASE_NESTED_IMPORT_GUIDE: BulkImportFormatGuide = {
  entityLabel: 'Use Case Nested Parts',
  maxItems: BULK_MAX_ITEMS,
  notes: [
    'Prefer Use Case JSON import with shell + nested arrays on the same item.',
    'Top-level keys are optional arrays: flows, conditions, businessRules, acceptanceCriteria.',
    'Flows are created first; each flow may include a steps array (created in order).',
    'step.content is plain text describing the step.',
    'Do not put Function IDs or other link fields here — link supporting Functions in the app afterward.',
    'Enums must match exactly (UPPER_SNAKE_CASE).',
  ],
  fields: [
    {
      name: 'flows[].flowType',
      required: true,
      type: 'enum',
      description: 'Flow kind. Only one MAIN flow is typical.',
      enumValues: ['MAIN', 'ALTERNATIVE', 'EXCEPTION'],
    },
    {
      name: 'flows[].name',
      required: false,
      type: 'string',
      description: 'Optional flow display name.',
    },
    {
      name: 'flows[].conditionText',
      required: false,
      type: 'string',
      description: 'When this alternative/exception flow applies.',
    },
    {
      name: 'flows[].steps[].stepType',
      required: true,
      type: 'enum',
      description: 'Step kind inside the flow.',
      enumValues: [
        'USER_ACTION',
        'SYSTEM_ACTION',
        'CONDITION',
        'NAVIGATION',
        'RESULT',
        'ERROR',
      ],
    },
    {
      name: 'flows[].steps[].content',
      required: false,
      type: 'string',
      description: 'Step text content.',
    },
    {
      name: 'flows[].steps[].displayOrder',
      required: false,
      type: 'number',
      description: 'Optional order; otherwise insertion order is used.',
    },
    {
      name: 'conditions[].conditionType',
      required: true,
      type: 'enum',
      description: 'Condition classification.',
      enumValues: [
        'PRECONDITION',
        'ASSUMPTION',
        'SUCCESS_POSTCONDITION',
        'FAILURE_POSTCONDITION',
      ],
    },
    {
      name: 'conditions[].content',
      required: true,
      type: 'string',
      description: 'Condition statement text.',
    },
    {
      name: 'businessRules[].ruleCode',
      required: true,
      type: 'string',
      description: 'Stable rule code (e.g. BR-01).',
    },
    {
      name: 'businessRules[].description',
      required: true,
      type: 'string',
      description: 'Business rule description.',
    },
    {
      name: 'acceptanceCriteria[].title',
      required: true,
      type: 'string',
      description: 'Criterion title.',
    },
    {
      name: 'acceptanceCriteria[].givenText',
      required: false,
      type: 'string',
      description: 'Given clause.',
    },
    {
      name: 'acceptanceCriteria[].whenText',
      required: false,
      type: 'string',
      description: 'When clause.',
    },
    {
      name: 'acceptanceCriteria[].thenText',
      required: false,
      type: 'string',
      description: 'Then clause.',
    },
  ],
  sample: {
    items: [
      {
        flows: [
          {
            flowType: 'MAIN',
            name: 'Happy path',
            steps: [
              {
                stepType: 'USER_ACTION',
                content: 'User enters email and password',
                displayOrder: 0,
              },
              {
                stepType: 'SYSTEM_ACTION',
                content: 'System validates credentials',
                displayOrder: 1,
              },
              {
                stepType: 'RESULT',
                content: 'User lands on the home workspace',
                displayOrder: 2,
              },
            ],
          },
          {
            flowType: 'EXCEPTION',
            name: 'Invalid credentials',
            conditionText: 'Credentials are invalid',
            steps: [
              {
                stepType: 'ERROR',
                content: 'Show invalid credentials message',
                displayOrder: 0,
              },
            ],
          },
        ],
        conditions: [
          {
            conditionType: 'PRECONDITION',
            content: 'User account exists and is active',
          },
          {
            conditionType: 'SUCCESS_POSTCONDITION',
            content: 'Authenticated session is established',
          },
        ],
        businessRules: [
          {
            ruleCode: 'BR-AUTH-01',
            description: 'Password must meet complexity policy',
          },
        ],
        acceptanceCriteria: [
          {
            title: 'Valid login succeeds',
            givenText: 'A valid user account',
            whenText: 'User submits correct credentials',
            thenText: 'Home workspace opens',
          },
        ],
      },
    ],
  },
}
