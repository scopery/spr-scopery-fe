import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'

/** Use Case JSON import: shell fields + optional nested conditions/flows/rules/criteria. */
export const USE_CASE_BULK_IMPORT_GUIDE: BulkImportFormatGuide = {
  entityLabel: 'Use Case',
  maxItems: BULK_MAX_ITEMS,
  notes: [
    'Paste into JSON Import only (not Bulk add grid).',
    'Each item is submitted in one POST …/bulk job (shell + optional nested).',
    'Optional conditions / flows / businessRules / acceptanceCriteria are created by the backend after the shell — FE does not loop creates.',
    'Do not put Function IDs or other link IDs here — link Functions afterward in the app.',
    'Link Test Cases afterward via Quality → Test Case links (not in this JSON).',
    'key must be unique within the project.',
    'Enums must match exactly (UPPER_SNAKE_CASE).',
  ],
  fields: [
    {
      name: 'key',
      required: true,
      type: 'string',
      description: 'Stable use-case key (e.g. UC-LOGIN-01). Unique per project.',
    },
    {
      name: 'name',
      required: true,
      type: 'string',
      description: 'Display name.',
    },
    {
      name: 'goal',
      required: false,
      type: 'string',
      description: 'What the actor wants to achieve.',
    },
    {
      name: 'primaryActorName',
      required: false,
      type: 'string',
      description: 'Primary actor label (e.g. End User, Admin).',
    },
    {
      name: 'triggerText',
      required: false,
      type: 'string',
      description: 'What starts this use case (event or user intent).',
    },
    {
      name: 'conditions[].conditionType',
      required: false,
      type: 'enum',
      description: 'Optional condition classification.',
      enumValues: [
        'PRECONDITION',
        'ASSUMPTION',
        'SUCCESS_POSTCONDITION',
        'FAILURE_POSTCONDITION',
      ],
    },
    {
      name: 'conditions[].content',
      required: false,
      type: 'string',
      description: 'Condition statement text (required when a condition object is present).',
    },
    {
      name: 'flows[].flowType',
      required: false,
      type: 'enum',
      description: 'Optional flow kind. At most one MAIN flow per item.',
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
      required: false,
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
      name: 'businessRules[].ruleCode',
      required: false,
      type: 'string',
      description: 'Stable rule code (e.g. BR-01).',
    },
    {
      name: 'businessRules[].description',
      required: false,
      type: 'string',
      description: 'Business rule description.',
    },
    {
      name: 'acceptanceCriteria[].title',
      required: false,
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
        key: 'UC-LOGIN-01',
        name: 'User logs in',
        goal: 'Authenticate and open the home workspace',
        primaryActorName: 'End User',
        triggerText: 'User opens the login page',
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
        flows: [
          {
            flowType: 'MAIN',
            name: 'Happy path',
            steps: [
              {
                stepType: 'USER_ACTION',
                content: 'User enters email and password',
              },
              {
                stepType: 'SYSTEM_ACTION',
                content: 'System validates credentials',
              },
              {
                stepType: 'RESULT',
                content: 'User lands on the home workspace',
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
              },
            ],
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
      {
        key: 'UC-LOGOUT-01',
        name: 'User logs out',
        primaryActorName: 'End User',
      },
    ],
  },
}
