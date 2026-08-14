import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'
import { SCREEN_IMPORT_FULL_MAX_ITEMS } from '../../domain/model/screen-spec-import'

export const SCREEN_FULL_SPEC_IMPORT_GUIDE: BulkImportFormatGuide = {
  entityLabel: 'Screen full spec',
  maxItems: SCREEN_IMPORT_FULL_MAX_ITEMS,
  notes: [
    'POST /workspaces/{workspaceId}/applications/{applicationId}/screens/import-full — 202 then poll GET /bulk-jobs/{id}.',
    'Each item is one screen: shell + modes, fields (with modeConfigs and validations), processItems, eventItems.',
    'projectId is required on every item (or set a default project on this page). code and name are required.',
    'componentCode must match an existing component in this application. Create components first if you bind fields.',
    'modeCode: CREATE | VIEW | EDIT | SEARCH | DIALOG. Process/event items require content.',
    'This is not the catalog Excel import (code/name/route only). That still uses …/screens/bulk.',
  ],
  fields: [
    { name: 'projectId', required: true, type: 'uuid', description: 'Project this screen belongs to.' },
    { name: 'code', required: true, type: 'string', description: 'Screen code (unique in the app).' },
    { name: 'name', required: true, type: 'string', description: 'Screen display name.' },
    { name: 'routePath', required: false, type: 'string', description: 'Optional route, e.g. /login.' },
    {
      name: 'modes[].modeCode',
      required: true,
      type: 'enum',
      enumValues: ['CREATE', 'VIEW', 'EDIT', 'SEARCH', 'DIALOG'],
      description: 'Screen mode.',
    },
    { name: 'modes[].name', required: true, type: 'string', description: 'Mode label (Create, View, …).' },
    { name: 'fields[].fieldKey', required: true, type: 'string', description: 'Stable field key.' },
    { name: 'fields[].label', required: true, type: 'string', description: 'Field label.' },
    { name: 'fields[].fieldType', required: true, type: 'string', description: 'e.g. INPUT, TEXT, DATE.' },
    { name: 'fields[].componentCode', required: false, type: 'string', description: 'Existing component code.' },
    {
      name: 'fields[].modeConfigs[].modeCode',
      required: true,
      type: 'enum',
      enumValues: ['CREATE', 'VIEW', 'EDIT', 'SEARCH', 'DIALOG'],
      description: 'Visibility / required / readonly for that mode.',
    },
    {
      name: 'fields[].validations[].ruleTypeCode',
      required: true,
      type: 'string',
      description: 'Catalog rule type, e.g. EMAIL, MAX_LENGTH.',
    },
    { name: 'processItems[].content', required: true, type: 'string', description: 'Process outline body.' },
    { name: 'eventItems[].content', required: true, type: 'string', description: 'Event outline body.' },
  ],
  sample: {
    items: [
      {
        projectId: '00000000-0000-0000-0000-000000000001',
        code: 'LOGIN',
        name: 'Login',
        routePath: '/login',
        modes: [
          { modeCode: 'CREATE', name: 'Create', displayOrder: 0 },
          { modeCode: 'VIEW', name: 'View', displayOrder: 1 },
        ],
        fields: [
          {
            fieldKey: 'email',
            label: 'Email',
            fieldType: 'INPUT',
            required: true,
            maxLength: 255,
            componentCode: 'TXT-EMAIL',
            modeConfigs: [
              { modeCode: 'CREATE', isVisible: true, isRequired: true, isReadonly: false },
              { modeCode: 'VIEW', isVisible: true, isRequired: false, isReadonly: true },
            ],
            validations: [{ ruleTypeCode: 'EMAIL', errorMessage: 'Invalid email' }],
          },
        ],
        processItems: [
          {
            title: '1. Init',
            content: 'Load login form',
            sourceTable: 'users',
            conditionNote: 'status = active',
          },
        ],
        eventItems: [
          {
            title: 'Submit',
            content: 'POST /api/login',
            triggerActionCode: 'CLICK',
            targetScreenCode: 'HOME',
            targetModeCode: 'VIEW',
          },
        ],
      },
    ],
  },
}
