import type { BulkImportFormatGuide } from '@/shared/lib/bulkImportFormat'
import { SCREEN_MODE_CODE_OPTIONS } from '../../domain/enums/screen-spec.enum'
import { FIELD_VALIDATION_IMPORT_MAX_ITEMS } from '../../domain/model/validation-import'

const MODE_CODES = [...SCREEN_MODE_CODE_OPTIONS]

const SYSTEM_RULE_CODES = [
  'REGEX',
  'MAX_LENGTH',
  'IN_LIST',
  'FILE_SIZE',
  'FILE_TYPE',
  'DATE_FORMAT',
  'URL',
  'HALF_WIDTH',
  'EMAIL_FORMAT',
  'POSTAL_CODE_JP',
  'PHONE_NUMBER_JP',
  'MATCHING',
  'REQUIRED',
  'UNIQUE',
] as const

export function buildFieldValidationImportGuide(live?: {
  fieldKeys?: string[]
  ruleTypeCodes?: string[]
  modeCodes?: string[]
}): BulkImportFormatGuide {
  const fieldKeys = (live?.fieldKeys ?? []).filter(Boolean)
  const ruleTypeCodes = (live?.ruleTypeCodes ?? []).filter(Boolean)
  const modeCodes = (live?.modeCodes ?? []).filter(Boolean)
  const modeEnum = modeCodes.length > 0 ? modeCodes : MODE_CODES

  return {
    entityLabel: 'Field validation',
    maxItems: FIELD_VALIDATION_IMPORT_MAX_ITEMS,
    notes: [
      'Payload shape: { "items": [ Rule, ... ] }. A bare array is also accepted. Each item is one rule on one existing field of this screen.',
      'How to import: (1) Fields and modes must already exist on this screen. (2) ruleTypeCode must already exist in the workspace (see Rule types under the paste box, or Admin). (3) Paste JSON. (4) Submit — FE POSTs one create per item. Failed items are listed; successful ones stay.',
      'Do not send UUIDs (fieldId, ruleTypeId, modeId). Keys are fieldKey, ruleTypeCode, and optional modeCode.',
      'There is no screen-level validations array. Repeat fieldKey for several rules on the same field.',
      'Existing rules are not deleted or updated — this only creates new ones. Duplicate EMAIL_FORMAT on the same field is allowed if the API accepts it.',
      fieldKeys.length
        ? `fieldKey on this screen: ${fieldKeys.join(', ')}.`
        : 'fieldKey must match a field on this screen. The dialog lists current keys.',
      ruleTypeCodes.length
        ? `ruleTypeCode in this workspace: ${ruleTypeCodes.join(', ')}.`
        : 'ruleTypeCode must match a workspace validation-rule-type. System-seeded codes are listed on Rule type below.',
      modeCodes.length
        ? `modeCode on this screen: ${modeCodes.join(', ')}. Omit modeCode to apply on all modes.`
        : 'modeCode is optional. If set, it must be a mode on this screen.',
      'REQUIRED and MAX_LENGTH also fill Defines on Excel export. EMAIL_FORMAT, REGEX, and other extra rules go to the Validation sheet.',
      'Unknown keys are rejected. ruleParamJson / conditionJson may be a JSON object or a JSON string.',
    ],
    fields: [
      {
        name: 'fieldKey',
        required: true,
        type: 'string',
        enumValues: fieldKeys.length ? fieldKeys : undefined,
        enumNotes: fieldKeys.length ? 'Must be a field on this screen.' : undefined,
        description: 'Existing field on this screen, e.g. email. Not a UUID.',
      },
      {
        name: 'ruleTypeCode',
        required: true,
        type: 'string',
        enumValues: ruleTypeCodes.length ? ruleTypeCodes : [...SYSTEM_RULE_CODES],
        enumNotes: ruleTypeCodes.length
          ? 'Codes in this workspace. Use one of these exactly.'
          : 'System-seeded codes. Custom workspace codes are also accepted if they exist.',
        description:
          'Workspace validation-rule-type code. Common system codes: EMAIL_FORMAT (not EMAIL), MAX_LENGTH, REGEX, REQUIRED, UNIQUE. Must already exist — unknown codes fail before any POST.',
      },
      {
        name: 'modeCode',
        required: false,
        type: 'enum',
        enumValues: modeEnum,
        description: 'Limit the rule to one mode on this screen. Omit to apply on all modes.',
      },
      {
        name: 'ruleParamJson',
        required: false,
        type: 'object | string',
        description:
          'Params required by the rule type’s schema. See Rule parameters below. Types with no schema (URL, EMAIL_FORMAT, HALF_WIDTH, UNIQUE, simple REQUIRED) must omit this or send null.',
      },
      {
        name: 'conditionJson',
        required: false,
        type: 'object | string',
        description:
          'When the rule runs (Apply when). Nested object: Condition. Omit to always apply.',
      },
      {
        name: 'errorMessage',
        required: false,
        type: 'string',
        description: 'Message shown in the UI and on the Validation Excel sheet.',
      },
      { name: 'remark', required: false, type: 'string', description: 'Optional remark.' },
      {
        name: 'displayOrder',
        required: false,
        type: 'integer',
        description: 'Rule order on the field.',
      },
    ],
    entities: [
      {
        name: 'Rule parameters',
        path: 'items[].ruleParamJson',
        description:
          'Object keyed by the rule type’s param schema. Wrong or missing keys fail that POST (FIELD_VALIDATION_RULE_PARAM_INVALID). Arrays stay arrays (do not send a comma-separated string).',
        fields: [
          {
            name: 'REGEX',
            required: false,
            type: 'object',
            description: '{ "pattern": "^[0-9]+$" } — Java regex, checked on save.',
          },
          {
            name: 'MAX_LENGTH',
            required: false,
            type: 'object',
            description: '{ "maxLength": 255 }',
          },
          {
            name: 'IN_LIST',
            required: false,
            type: 'object',
            description: '{ "values": ["0", "1", "2"] }',
          },
          {
            name: 'FILE_SIZE',
            required: false,
            type: 'object',
            description: '{ "maxBytes": 5242880 }',
          },
          {
            name: 'FILE_TYPE',
            required: false,
            type: 'object',
            description: '{ "mimeTypes": ["image/png", "image/jpeg"] }',
          },
          {
            name: 'DATE_FORMAT',
            required: false,
            type: 'object',
            description: '{ "format": "yyyy-MM-dd" }',
          },
          {
            name: 'MATCHING',
            required: false,
            type: 'object',
            description: '{ "targetFieldKey": "passwordConfirm" } — other fieldKey on this screen.',
          },
          {
            name: 'REQUIRED (conditional)',
            required: false,
            type: 'object',
            description: '{ "condition": { "fieldKey": "type", "op": "EQUALS" } }',
          },
          {
            name: 'No params',
            required: false,
            type: 'null',
            description: 'URL, EMAIL_FORMAT, HALF_WIDTH, POSTAL_CODE_JP, PHONE_NUMBER_JP, UNIQUE, simple REQUIRED — omit ruleParamJson.',
          },
        ],
      },
      {
        name: 'Condition',
        path: 'items[].conditionJson',
        description:
          'Apply when another field matches. Same shape as the Validations form. Omit the whole object to always apply.',
        fields: [
          {
            name: 'fieldKey',
            required: true,
            type: 'string',
            description: 'Other field on this screen that gates the rule.',
          },
          {
            name: 'op',
            required: true,
            type: 'string',
            description: 'Operator, e.g. EQUALS, IS_NOT_EMPTY, IS_NULL, IN.',
          },
          {
            name: 'value',
            required: false,
            type: 'string',
            description: 'Compared value. Omit for IS_NOT_EMPTY / IS_NULL.',
          },
        ],
      },
    ],
    sample: {
      items: [
        {
          fieldKey: 'email',
          ruleTypeCode: 'EMAIL_FORMAT',
          errorMessage: 'Invalid email',
        },
        {
          fieldKey: 'email',
          ruleTypeCode: 'MAX_LENGTH',
          ruleParamJson: { maxLength: 255 },
          errorMessage: 'Email is too long',
        },
        {
          fieldKey: 'password',
          ruleTypeCode: 'REGEX',
          modeCode: 'CREATE',
          ruleParamJson: { pattern: '^.{8,}$' },
          errorMessage: 'Password is too short',
        },
        {
          fieldKey: 'status',
          ruleTypeCode: 'IN_LIST',
          ruleParamJson: { values: ['NEW', 'ACTIVE'] },
          conditionJson: { fieldKey: 'agreeTerms', op: 'IS_NOT_EMPTY' },
          errorMessage: 'Pick a valid status',
        },
      ],
    },
  }
}

export const FIELD_VALIDATION_IMPORT_GUIDE = buildFieldValidationImportGuide()
