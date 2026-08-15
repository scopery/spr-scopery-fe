import { describe, expect, it } from 'vitest'
import {
  formatBulkImportGuideForAgent,
  formatBulkImportSampleJson,
  type BulkImportFormatGuide,
} from './bulkImportFormat'

const GUIDE: BulkImportFormatGuide = {
  entityLabel: 'Requirement',
  maxItems: 500,
  notes: ['Wrap rows in an items array.'],
  fields: [
    {
      name: 'title',
      required: true,
      type: 'string',
      description: 'Requirement title.',
    },
    {
      name: 'priority',
      required: false,
      type: 'enum',
      description: 'Relative priority.',
      enumValues: ['HIGH', 'MEDIUM', 'LOW'],
      enumNotes: 'Defaults to MEDIUM.',
    },
  ],
  sample: {
    items: [{ title: 'Login', priority: 'HIGH' }],
  },
}

describe('formatBulkImportGuideForAgent', () => {
  it('includes instructions, fields, enums, and sample JSON', () => {
    const text = formatBulkImportGuideForAgent(GUIDE)
    expect(text).toContain('Requirement — JSON bulk import format')
    expect(text).toContain('Maximum items per request: 500')
    expect(text).toContain('Wrap rows in an items array.')
    expect(text).toContain('`title` (REQUIRED, string)')
    expect(text).toContain('`priority` (optional, enum)')
    expect(text).toContain('Enum values: HIGH | MEDIUM | LOW')
    expect(text).toContain('Enum note: Defaults to MEDIUM.')
    expect(text).toContain(formatBulkImportSampleJson(GUIDE))
  })

  it('documents nested entities and their attributes', () => {
    const text = formatBulkImportGuideForAgent({
      ...GUIDE,
      entities: [
        {
          name: 'Mode',
          path: 'items[].modes[]',
          description: 'Screen mode object.',
          fields: [
            {
              name: 'modeCode',
              required: true,
              type: 'enum',
              description: 'Mode identity.',
              enumValues: ['CREATE', 'VIEW'],
            },
          ],
        },
      ],
    })
    expect(text).toContain('## Nested entities')
    expect(text).toContain('### Mode (`items[].modes[]`)')
    expect(text).toContain('`modeCode` (REQUIRED, enum)')
    expect(text).toContain('Enum values: CREATE | VIEW')
  })
})
