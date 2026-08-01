import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'

export const FUNCTIONAL_ITEM_BULK_IMPORT_GUIDE: BulkImportFormatGuide = {
  entityLabel: 'Functional Item',
  maxItems: BULK_MAX_ITEMS,
  notes: [
    'code and title are required. Prefer stable codes such as FR-001.',
    'acceptanceCriteria is an optional list of plain strings.',
    'businessRules is an optional list of objects (code, title, severity required). Created together with the FR.',
    'Do not put link IDs in this JSON — link modules and other relations in the app afterward.',
    'Rule codes must be unique within each Functional Item. Max 50 rules per item.',
  ],
  fields: [
    {
      name: 'code',
      required: true,
      type: 'string',
      description: 'Stable FR code unique within the project.',
    },
    {
      name: 'title',
      required: true,
      type: 'string',
      description: 'Short functional item title.',
    },
    {
      name: 'description',
      required: false,
      type: 'string',
      description: 'Detailed behavior description.',
    },
    {
      name: 'priority',
      required: false,
      type: 'enum',
      description: 'Relative priority. Defaults to MEDIUM when omitted.',
      enumValues: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    },
    {
      name: 'type',
      required: false,
      type: 'enum',
      description: 'Functional item shape. Defaults to FUNCTIONAL when omitted.',
      enumValues: ['FUNCTIONAL', 'USER_STORY', 'USE_CASE'],
    },
    {
      name: 'acceptanceCriteria',
      required: false,
      type: 'string[]',
      description: 'List of acceptance criterion statements.',
    },
    {
      name: 'businessRules[].code',
      required: true,
      type: 'string',
      description: 'Stable rule code unique within this FR (e.g. BR-01).',
    },
    {
      name: 'businessRules[].title',
      required: true,
      type: 'string',
      description: 'Short rule title.',
    },
    {
      name: 'businessRules[].severity',
      required: true,
      type: 'enum',
      description: 'Rule severity.',
      enumValues: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    },
    {
      name: 'businessRules[].description',
      required: false,
      type: 'string',
      description: 'Optional longer rule text.',
    },
  ],
  sample: {
    items: [
      {
        code: 'FR-001',
        title: 'Login',
        description: 'Email/password authentication for end users.',
        priority: 'HIGH',
        type: 'FUNCTIONAL',
        acceptanceCriteria: [
          'User can submit valid credentials',
          'Invalid credentials show an error',
        ],
        businessRules: [
          {
            code: 'BR-LOGIN-LOCKOUT',
            title: 'Lock account after 5 failed attempts',
            severity: 'HIGH',
            description: 'Reset lock after 15 minutes or admin unlock',
          },
          {
            code: 'BR-LOGIN-SESSION',
            title: 'Session expires after 8 hours idle',
            severity: 'MEDIUM',
          },
        ],
      },
    ],
  },
}

export const NON_FUNCTIONAL_ITEM_BULK_IMPORT_GUIDE: BulkImportFormatGuide = {
  entityLabel: 'Non-Functional Item',
  maxItems: BULK_MAX_ITEMS,
  notes: [
    'code and title are required.',
    'Use category to classify the quality attribute; scopeType describes what the NFR applies to.',
    'Do not put link IDs in this JSON. Narrow scope (module/feature) later in the app if needed.',
  ],
  fields: [
    {
      name: 'code',
      required: true,
      type: 'string',
      description: 'Stable NFR code unique within the project.',
    },
    {
      name: 'title',
      required: true,
      type: 'string',
      description: 'Short NFR title (often includes the target metric).',
    },
    {
      name: 'description',
      required: false,
      type: 'string',
      description: 'Detailed quality requirement text.',
    },
    {
      name: 'category',
      required: false,
      type: 'enum',
      description: 'Quality attribute category. Defaults to OTHER when omitted.',
      enumValues: [
        'PERFORMANCE',
        'SECURITY',
        'USABILITY',
        'RELIABILITY',
        'MAINTAINABILITY',
        'SCALABILITY',
        'COMPATIBILITY',
        'OTHER',
      ],
    },
    {
      name: 'priority',
      required: false,
      type: 'enum',
      description: 'Relative priority. Defaults to MEDIUM when omitted.',
      enumValues: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    },
    {
      name: 'scopeType',
      required: false,
      type: 'enum',
      description: 'Where the NFR applies. Defaults to SYSTEM when omitted.',
      enumValues: ['SYSTEM', 'MODULE', 'FEATURE'],
    },
    {
      name: 'targetMetric',
      required: false,
      type: 'string',
      description: 'Measurable target (e.g. p95 < 200ms).',
    },
  ],
  sample: {
    items: [
      {
        code: 'NFR-001',
        title: 'API p95 latency under 200ms',
        description: 'Measured on staging under peak load.',
        category: 'PERFORMANCE',
        priority: 'HIGH',
        scopeType: 'SYSTEM',
        targetMetric: 'p95 < 200ms',
      },
    ],
  },
}
