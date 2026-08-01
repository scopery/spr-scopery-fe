import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'

export const PHASE_BULK_IMPORT_GUIDE: BulkImportFormatGuide = {
  entityLabel: 'Project Phase',
  maxItems: BULK_MAX_ITEMS,
  notes: [
    'code and name are required.',
    'displayOrder is optional; sequential order may be assigned when omitted.',
    'plannedStartDate / plannedEndDate use ISO date strings (YYYY-MM-DD).',
  ],
  fields: [
    {
      name: 'code',
      required: true,
      type: 'string',
      description: 'Phase code (e.g. DISC). Unique within the project.',
    },
    {
      name: 'name',
      required: true,
      type: 'string',
      description: 'Phase display name (e.g. Discovery).',
    },
    {
      name: 'description',
      required: false,
      type: 'string',
      description: 'Optional phase description.',
    },
    {
      name: 'displayOrder',
      required: false,
      type: 'number',
      description: 'Sort order among phases (integer).',
    },
    {
      name: 'plannedStartDate',
      required: false,
      type: 'date',
      description: 'Planned start date (YYYY-MM-DD).',
    },
    {
      name: 'plannedEndDate',
      required: false,
      type: 'date',
      description: 'Planned end date (YYYY-MM-DD).',
    },
  ],
  sample: {
    items: [
      {
        code: 'DISC',
        name: 'Discovery',
        description: 'Discovery and scoping',
        displayOrder: 1,
        plannedStartDate: '2026-08-01',
        plannedEndDate: '2026-08-15',
      },
    ],
  },
}
