import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'
import { COMPONENT_IMPORT_FULL_MAX_ITEMS } from '../../domain/model/component-import'

export const COMPONENT_FULL_SPEC_IMPORT_GUIDE: BulkImportFormatGuide = {
  entityLabel: 'Component full spec',
  maxItems: COMPONENT_IMPORT_FULL_MAX_ITEMS,
  notes: [
    'Payload shape: { "items": [ Component, ... ] }. A bare array is also accepted.',
    'POST …/applications/{appId}/components/import-full — one async job creates each component, then its fields.',
    'fields[] is optional. Omit it to create a shell only. Do not send options or API links — add those on Browse after import.',
    'Excel / Bulk add still create the catalog shell only (code, name, componentType, description).',
    'Unknown keys are rejected. Duplicate component code or fieldKey in the same file is rejected on the client.',
  ],
  fields: [
    { name: 'code', required: true, type: 'string', description: 'Component code (e.g. DROPDOWN_USER).' },
    { name: 'name', required: true, type: 'string', description: 'Component display name.' },
    {
      name: 'componentType',
      required: false,
      type: 'string',
      description: 'Optional type label (DROPDOWN, BUTTON, INPUT, …).',
    },
    { name: 'description', required: false, type: 'string', description: 'Optional description.' },
    {
      name: 'fields',
      required: false,
      type: 'ComponentField[]',
      description: 'Template fields copied onto a screen when you bind this component to a section.',
    },
  ],
  entities: [
    {
      name: 'ComponentField',
      path: 'items[].fields[]',
      description: 'One field on the component template.',
      fields: [
        { name: 'fieldKey', required: true, type: 'string', description: 'Stable key (e.g. value).' },
        { name: 'label', required: true, type: 'string', description: 'Display label.' },
        {
          name: 'fieldType',
          required: true,
          type: 'string',
          description: 'Control type (TEXT, INPUT, NUMBER, DATE, BOOLEAN, PASSWORD, …).',
        },
        { name: 'required', required: false, type: 'boolean', description: 'Whether the field is required.' },
        { name: 'maxLength', required: false, type: 'integer', description: 'Optional max length.' },
        { name: 'remark', required: false, type: 'string', description: 'Optional note.' },
        { name: 'displayOrder', required: false, type: 'integer', description: 'Sort order. 0-based.' },
      ],
    },
  ],
  sample: {
    items: [
      {
        code: 'DROPDOWN_USER',
        name: 'User Dropdown',
        componentType: 'DROPDOWN',
        fields: [
          { fieldKey: 'value', label: 'Value', fieldType: 'TEXT', displayOrder: 0 },
          { fieldKey: 'label', label: 'Label', fieldType: 'TEXT', displayOrder: 1 },
        ],
      },
    ],
  },
}
