import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'

export const REQUIREMENT_BULK_IMPORT_GUIDE: BulkImportFormatGuide = {
  entityLabel: 'Requirement',
  maxItems: BULK_MAX_ITEMS,
  notes: [
    'Paste into JSON Import only (not Bulk add grid).',
    'Wrap all rows in an "items" array.',
    'If code is omitted, one may be auto-generated from the title.',
    'Do not put Application / Function / NFR IDs here — link those afterward in the app.',
    'Do not send more than 500 items in one request.',
    'Aliases accepted on import: CRITICAL→HIGH; SECURITY|COMPLIANCE→CONSTRAINT; OTHER→BUSINESS.',
  ],
  fields: [
    {
      name: 'title',
      required: true,
      type: 'string',
      description: 'Short requirement title shown in catalogs and matrices.',
    },
    {
      name: 'code',
      required: false,
      type: 'string',
      description: 'Stable business code (e.g. REQ-AUTH-01). Unique within the project when provided.',
    },
    {
      name: 'description',
      required: false,
      type: 'string',
      description: 'Longer explanation, acceptance context, or notes.',
    },
    {
      name: 'requirementType',
      required: false,
      type: 'enum',
      description:
        'Requirement classification. Defaults to FUNCTIONAL when omitted. SECURITY/COMPLIANCE are accepted aliases and map to CONSTRAINT.',
      enumValues: [
        'FUNCTIONAL',
        'NON_FUNCTIONAL',
        'BUSINESS',
        'TECHNICAL',
        'CONSTRAINT',
      ],
      enumNotes: 'Prefer FUNCTIONAL for product behavior; NON_FUNCTIONAL for quality attributes.',
    },
    {
      name: 'priority',
      required: false,
      type: 'enum',
      description:
        'Relative priority. Defaults to MEDIUM when omitted. CRITICAL is accepted and mapped to HIGH.',
      enumValues: ['HIGH', 'MEDIUM', 'LOW'],
    },
  ],
  sample: {
    items: [
      {
        title: 'User must be able to login via email',
        code: 'REQ-001',
        description: 'Authenticated users can sign in with email and password.',
        requirementType: 'FUNCTIONAL',
        priority: 'HIGH',
      },
      {
        title: 'System response time under load',
        code: 'REQ-002',
        description: 'p95 API latency stays under 2s at peak load.',
        requirementType: 'TECHNICAL',
        priority: 'MEDIUM',
      },
    ],
  },
}
