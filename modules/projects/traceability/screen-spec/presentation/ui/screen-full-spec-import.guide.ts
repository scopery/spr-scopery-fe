import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'
import { SCREEN_MODE_CODE_OPTIONS, TRIGGER_ACTION_CODE_OPTIONS } from '../../domain/enums/screen-spec.enum'
import { SCREEN_IMPORT_FULL_MAX_ITEMS } from '../../domain/model/screen-spec-import'

const MODE_CODES = [...SCREEN_MODE_CODE_OPTIONS]
const TRIGGERS = [...TRIGGER_ACTION_CODE_OPTIONS]

const FIELD_TYPES = [
  'INPUT',
  'TEXT',
  'TEXTAREA',
  'NUMBER',
  'DATE',
  'DATEPICKER',
  'BOOLEAN',
  'CHECKBOX',
  'RADIO',
  'SELECT',
  'DROPDOWN',
  'BUTTON',
  'LABEL',
  'HIDDEN',
  'URL',
  'PASSWORD',
] as const

export const SCREEN_FULL_SPEC_IMPORT_GUIDE: BulkImportFormatGuide = {
  entityLabel: 'Screen full spec',
  maxItems: SCREEN_IMPORT_FULL_MAX_ITEMS,
  notes: [
    'Payload shape: { "items": [ Screen, ... ] }. A bare array is also accepted. Each Screen is one catalog screen plus nested spec objects listed below.',
    'How to import: (1) Create components (fields / API links) on Browse first if fields use componentCode. (2) Select a project, or set projectId on every Screen. (3) Paste JSON. (4) Submit — 202 job; this page polls per-screen success/failure.',
    'Max 200 screens per job. Duplicate screen code in the same file is rejected on the client.',
    'Do not send UUIDs for fields, modes, processes, or events. Keys are codes and fieldKey strings. There is no sections array — only fields[].',
    'Do not send componentFieldId. Bind a component to a section on Browse to copy fields; the API sets that id. componentCode only links an existing catalog component. Component → API roles are not in this payload.',
    'Excel on this tab only creates empty screens (code, name, routePath) via …/screens/bulk. This JSON is the full spec: modes, fields, modeConfigs, validations, processes, events.',
    'Unknown keys on any object are rejected. ruleParamJson / conditionJson may be a JSON string or an object (objects are stringified).',
  ],
  fields: [
    {
      name: 'projectId',
      required: true,
      type: 'uuid',
      description: 'Project that owns the screen. Omit only if a project is selected on this page.',
    },
    {
      name: 'code',
      required: true,
      type: 'string',
      description: 'Screen code, unique in the application (max 50). Referenced by eventItems[].targetScreenCode.',
    },
    {
      name: 'name',
      required: true,
      type: 'string',
      description: 'Screen display name (max 255).',
    },
    {
      name: 'routePath',
      required: false,
      type: 'string',
      description: 'Client route, e.g. /login.',
    },
    {
      name: 'modes',
      required: false,
      type: 'Mode[]',
      description: 'Screen modes (CREATE / VIEW / EDIT / …). Nested entity: Mode.',
    },
    {
      name: 'fields',
      required: false,
      type: 'Field[]',
      description: 'Controls on the screen. Nested entity: Field (contains ModeConfig[] and Validation[]).',
    },
    {
      name: 'processItems',
      required: false,
      type: 'Process[]',
      description: 'Init / data-load steps. Nested entity: Process. content is required on each item.',
    },
    {
      name: 'eventItems',
      required: false,
      type: 'Event[]',
      description: 'User/system events. Nested entity: Event. content is required on each item.',
    },
  ],
  entities: [
    {
      name: 'Mode',
      path: 'items[].modes[]',
      description:
        'One screen mode. Typical set: CREATE, VIEW, EDIT. Add SEARCH or DIALOG when needed. Missing modes leave empty 〇 columns on Defines.',
      fields: [
        {
          name: 'modeCode',
          required: true,
          type: 'enum',
          enumValues: MODE_CODES,
          description: 'Mode identity. Must match modeConfigs / validations / process / event modeCode values.',
        },
        {
          name: 'name',
          required: true,
          type: 'string',
          description: 'Label shown in the UI (Create, View, Edit, …).',
        },
        {
          name: 'displayOrder',
          required: false,
          type: 'integer',
          description: 'Sort order. If omitted, insertion order is used.',
        },
      ],
    },
    {
      name: 'Field',
      path: 'items[].fields[]',
      description:
        'One control. fieldKey is the stable id used by processItems.targetFieldKey and eventItems.triggerFieldKey. Nested: modeConfigs[], validations[].',
      fields: [
        {
          name: 'fieldKey',
          required: true,
          type: 'string',
          description: 'Stable key, e.g. email. Not a UUID. Unique per screen.',
        },
        { name: 'label', required: true, type: 'string', description: 'Label on Defines (Field column).' },
        {
          name: 'fieldType',
          required: true,
          type: 'enum',
          enumValues: FIELD_TYPES,
          enumNotes:
            'Free string is accepted by the API; these are the usual control types. Prefer matching the component’s componentType when componentCode is set.',
          description: 'Control type stored on the field.',
        },
        { name: 'description', required: false, type: 'string', description: 'Help text / hint.' },
        {
          name: 'required',
          required: false,
          type: 'boolean',
          description: 'Default required when a mode has no modeConfig.isRequired.',
        },
        {
          name: 'maxLength',
          required: false,
          type: 'integer',
          description: 'Goes to Defines Length. Also used with MAX_LENGTH validations.',
        },
        { name: 'remark', required: false, type: 'string', description: 'Optional remark.' },
        {
          name: 'displayOrder',
          required: false,
          type: 'integer',
          description: 'Field order on the screen / Defines.',
        },
        {
          name: 'componentCode',
          required: false,
          type: 'string',
          description:
            'Existing application component code (not a UUID). Create the component on Browse first. This links the field; it does not copy component fields or set componentFieldId. Bind on a section to copy.',
        },
        {
          name: 'modeConfigs',
          required: false,
          type: 'ModeConfig[]',
          description: 'Per-mode visible / required / readonly. Nested entity: ModeConfig.',
        },
        {
          name: 'validations',
          required: false,
          type: 'Validation[]',
          description:
            'Extra rules beyond required/maxLength (those two also live on Defines). Nested entity: Validation.',
        },
      ],
    },
    {
      name: 'ModeConfig',
      path: 'items[].fields[].modeConfigs[]',
      description:
        'Per-field, per-mode matrix row. isVisible true → 〇 on Defines for that mode column.',
      fields: [
        {
          name: 'modeCode',
          required: true,
          type: 'enum',
          enumValues: MODE_CODES,
          description: 'Must match a Mode.modeCode on the same screen.',
        },
        {
          name: 'isVisible',
          required: false,
          type: 'boolean',
          description: 'Show the field in this mode. true → 〇 on Defines.',
        },
        {
          name: 'isRequired',
          required: false,
          type: 'boolean',
          description: 'Required in this mode (overrides Field.required).',
        },
        {
          name: 'isReadonly',
          required: false,
          type: 'boolean',
          description: 'Read-only in this mode.',
        },
        {
          name: 'defaultValue',
          required: false,
          type: 'string',
          description: 'Default value shown on Defines.',
        },
        {
          name: 'displayOrder',
          required: false,
          type: 'integer',
          description: 'Optional order among configs.',
        },
      ],
    },
    {
      name: 'Validation',
      path: 'items[].fields[].validations[]',
      description:
        'Rule on a field. REQUIRED and MAX_LENGTH also map to Defines; EMAIL, REGEX, etc. go to the Validation sheet.',
      fields: [
        {
          name: 'ruleTypeCode',
          required: true,
          type: 'string',
          description:
            'Workspace validation-rule-type code, e.g. REQUIRED, MAX_LENGTH, EMAIL, REGEX, MIN_LENGTH. Must already exist in the workspace.',
        },
        {
          name: 'modeCode',
          required: false,
          type: 'enum',
          enumValues: MODE_CODES,
          description: 'Limit the rule to one mode. Omit to apply on all modes.',
        },
        {
          name: 'ruleParamJson',
          required: false,
          type: 'string | object',
          description: 'Rule params, e.g. {"maxLength":255} or {"pattern":"^\\\\d+$"}.',
        },
        {
          name: 'conditionJson',
          required: false,
          type: 'string | object',
          description: 'Optional condition for when the rule runs.',
        },
        {
          name: 'errorMessage',
          required: false,
          type: 'string',
          description: 'Message shown on the Validation sheet / UI.',
        },
        { name: 'remark', required: false, type: 'string', description: 'Optional remark.' },
        {
          name: 'displayOrder',
          required: false,
          type: 'integer',
          description: 'Rule order on the field.',
        },
      ],
    },
    {
      name: 'Process',
      path: 'items[].processItems[]',
      description:
        'Init / load outline. Excel: title = heading, content = Get (required), sourceTable = Table, conditionNote = Condition.',
      fields: [
        {
          name: 'content',
          required: true,
          type: 'string',
          description: 'What happens (Excel Get). Required by the API.',
        },
        {
          name: 'title',
          required: false,
          type: 'string',
          description: 'Outline heading, e.g. 1. Init.',
        },
        {
          name: 'modeCode',
          required: false,
          type: 'enum',
          enumValues: MODE_CODES,
          description: 'Limit this step to one mode.',
        },
        {
          name: 'targetFieldKey',
          required: false,
          type: 'string',
          description: 'Related Field.fieldKey on this screen.',
        },
        {
          name: 'sourceTable',
          required: false,
          type: 'string',
          description: 'Source table / entity name (Excel Table, Database sheet).',
        },
        {
          name: 'conditionNote',
          required: false,
          type: 'string',
          description: 'Excel Condition.',
        },
        {
          name: 'displayOrder',
          required: false,
          type: 'integer',
          description: 'Step order.',
        },
      ],
    },
    {
      name: 'Event',
      path: 'items[].eventItems[]',
      description:
        'User or system action. Excel Event sheet: title = heading, content = Get (required), trigger / navigate as outline rows.',
      fields: [
        {
          name: 'content',
          required: true,
          type: 'string',
          description: 'What the event does (Excel Get). Required by the API.',
        },
        {
          name: 'title',
          required: false,
          type: 'string',
          description: 'Outline heading, e.g. Submit.',
        },
        {
          name: 'triggerActionCode',
          required: false,
          type: 'enum',
          enumValues: TRIGGERS,
          description: 'How the event fires.',
        },
        {
          name: 'triggerFieldKey',
          required: false,
          type: 'string',
          description: 'Field that fires the event — must be a Field.fieldKey on this screen.',
        },
        {
          name: 'modeCode',
          required: false,
          type: 'enum',
          enumValues: MODE_CODES,
          description: 'Limit this event to one mode.',
        },
        {
          name: 'conditionNote',
          required: false,
          type: 'string',
          description: 'Excel Condition.',
        },
        {
          name: 'targetScreenCode',
          required: false,
          type: 'string',
          description: 'Navigate to this screen code (may be another item in the same payload).',
        },
        {
          name: 'targetModeCode',
          required: false,
          type: 'enum',
          enumValues: MODE_CODES,
          description: 'Target mode after navigate.',
        },
        {
          name: 'displayOrder',
          required: false,
          type: 'integer',
          description: 'Event order.',
        },
      ],
    },
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
            description: 'User email',
            required: true,
            maxLength: 255,
            displayOrder: 0,
            componentCode: 'TXT-EMAIL',
            modeConfigs: [
              {
                modeCode: 'CREATE',
                isVisible: true,
                isRequired: true,
                isReadonly: false,
                defaultValue: null,
                displayOrder: 0,
              },
              {
                modeCode: 'VIEW',
                isVisible: true,
                isRequired: false,
                isReadonly: true,
                displayOrder: 1,
              },
            ],
            validations: [
              {
                ruleTypeCode: 'EMAIL',
                errorMessage: 'Invalid email',
                ruleParamJson: null,
                conditionJson: null,
                displayOrder: 0,
              },
            ],
          },
        ],
        processItems: [
          {
            title: '1. Init',
            content: 'Load login form',
            sourceTable: 'users',
            conditionNote: 'status = active',
            targetFieldKey: 'email',
            displayOrder: 0,
          },
        ],
        eventItems: [
          {
            title: 'Submit',
            content: 'POST /api/login',
            triggerActionCode: 'CLICK',
            triggerFieldKey: 'email',
            targetScreenCode: 'HOME',
            targetModeCode: 'VIEW',
            conditionNote: null,
            displayOrder: 0,
          },
        ],
      },
    ],
  },
}
