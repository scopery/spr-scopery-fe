import { BULK_MAX_ITEMS } from '@/shared/lib/bulkJobs'
import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'
import { WbsNodeType } from '../enums/wbs.enum'

export interface WbsPhaseGuideOption {
  value: string
  label: string
}

export const WBS_BULK_IMPORT_GUIDE: BulkImportFormatGuide = {
  entityLabel: 'Planning Element',
  maxItems: BULK_MAX_ITEMS,
  notes: [
    'code, title, phaseId, and nodeType are required.',
    'phaseId must be an existing project phase UUID (copy from Plan Structure → JSON import / Bulk add).',
    'parentId is optional — omit (or null) for a root element under the phase.',
    'sortOrder is optional; defaults to 1 when omitted.',
    'Paste Excel/TSV in Bulk add, or use JSON Import with the sample below (Copy guide / Copy sample).',
  ],
  fields: [
    {
      name: 'code',
      required: true,
      type: 'string',
      description: 'Element code (e.g. PE-AUTH). Unique within the project.',
    },
    {
      name: 'title',
      required: true,
      type: 'string',
      description: 'Element display title.',
    },
    {
      name: 'description',
      required: false,
      type: 'string',
      description: 'Optional description.',
    },
    {
      name: 'phaseId',
      required: true,
      type: 'string (UUID)',
      description: 'Project phase id that owns this element.',
    },
    {
      name: 'parentId',
      required: false,
      type: 'string (UUID) | null',
      description: 'Parent planning element id, or null/omit for a top-level element.',
    },
    {
      name: 'nodeType',
      required: true,
      type: 'enum',
      enumValues: [
        WbsNodeType.WorkPackage,
        WbsNodeType.TaskGroup,
        WbsNodeType.Milestone,
      ],
      enumNotes: 'Must match BE WbsNodeType. Prefer WORK_PACKAGE for packages; MILESTONE for checkpoints.',
      description: 'Structural type of the element.',
    },
    {
      name: 'sortOrder',
      required: false,
      type: 'number',
      description: 'Sibling sort order (integer ≥ 0).',
    },
  ],
  sample: {
    items: [
      {
        code: 'PE-AUTH',
        title: 'Authentication package',
        description: 'Login and session work',
        phaseId: '<phase-uuid>',
        parentId: null,
        nodeType: 'WORK_PACKAGE',
        sortOrder: 1,
      },
      {
        code: 'PE-AUTH-LOGIN',
        title: 'Login screen',
        phaseId: '<phase-uuid>',
        parentId: '<parent-element-uuid-or-null>',
        nodeType: 'MILESTONE',
        sortOrder: 2,
      },
    ],
  },
}

/** Fill sample + notes with real project phase UUIDs when available. */
export function buildWbsBulkImportGuide(
  phases: WbsPhaseGuideOption[]
): BulkImportFormatGuide {
  const firstId = phases[0]?.value ?? '<phase-uuid>'
  const phaseNotes =
    phases.length === 0
      ? 'No phases in this project — create a phase before importing planning elements.'
      : `Project phase ids: ${phases
          .map((p) => `${p.label} → ${p.value}`)
          .join(' | ')}`

  const baseItems = WBS_BULK_IMPORT_GUIDE.sample.items as Array<Record<string, unknown>>

  return {
    ...WBS_BULK_IMPORT_GUIDE,
    notes: [...WBS_BULK_IMPORT_GUIDE.notes, phaseNotes],
    sample: {
      items: baseItems.map((item, index) => ({
        ...item,
        phaseId: firstId,
        ...(index === 1 ? { parentId: '<parent-element-uuid-or-null>' } : {}),
      })),
    },
  }
}
