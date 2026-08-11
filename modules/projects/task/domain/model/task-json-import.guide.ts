import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'

export const TASK_BULK_IMPORT_GUIDE: BulkImportFormatGuide = {
  entityLabel: 'Work Item (Task)',
  maxItems: BULK_MAX_ITEMS,
  notes: [
    'code, title, projectPhaseId, and estimateHours are required.',
    'priority: LOW | MEDIUM (default) | HIGH | CRITICAL.',
    'plannedStartDate / dueDate use ISO date strings (YYYY-MM-DD).',
    'Copy projectPhaseId from the Phase list or from "Copy id" in the phase editor.',
  ],
  fields: [
    {
      name: 'code',
      required: true,
      type: 'string',
      description: 'Unique task code within the project (e.g. TASK-001).',
    },
    {
      name: 'title',
      required: true,
      type: 'string',
      description: 'Task title.',
    },
    {
      name: 'projectPhaseId',
      required: true,
      type: 'string',
      description: 'UUID of the project phase this task belongs to.',
    },
    {
      name: 'estimateHours',
      required: true,
      type: 'number',
      description: 'Estimated effort in hours (must be ≥ 0.01).',
    },
    {
      name: 'description',
      required: false,
      type: 'string',
      description: 'Optional task description.',
    },
    {
      name: 'priority',
      required: false,
      type: 'string',
      description: 'Task priority: LOW | MEDIUM | HIGH | CRITICAL. Defaults to MEDIUM.',
    },
    {
      name: 'plannedStartDate',
      required: false,
      type: 'date',
      description: 'Planned start date (YYYY-MM-DD).',
    },
    {
      name: 'dueDate',
      required: false,
      type: 'date',
      description: 'Due date (YYYY-MM-DD).',
    },
  ],
  sample: {
    items: [
      {
        code: 'TASK-001',
        title: 'Gather requirements',
        projectPhaseId: '<phase-uuid>',
        estimateHours: 8,
        description: 'Collect and document all requirements',
        priority: 'HIGH',
        plannedStartDate: '2026-08-01',
        dueDate: '2026-08-05',
      },
      {
        code: 'TASK-002',
        title: 'Design system architecture',
        projectPhaseId: '<phase-uuid>',
        estimateHours: 16,
      },
    ],
  },
}
