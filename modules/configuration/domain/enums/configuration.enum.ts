export const CustomFieldType = {
  Text: 'TEXT',
  LongText: 'LONG_TEXT',
  Number: 'NUMBER',
  Decimal: 'DECIMAL',
  Currency: 'CURRENCY',
  Date: 'DATE',
  DateTime: 'DATETIME',
  Boolean: 'BOOLEAN',
  Select: 'SELECT',
  MultiSelect: 'MULTI_SELECT',
  User: 'USER',
  Team: 'TEAM',
  ExternalContact: 'EXTERNAL_CONTACT',
  ExternalOrganization: 'EXTERNAL_ORGANIZATION',
  Project: 'PROJECT',
  Task: 'TASK',
  Document: 'DOCUMENT',
  Url: 'URL',
  Email: 'EMAIL',
  Phone: 'PHONE',
  Percentage: 'PERCENTAGE',
} as const
export type CustomFieldType = (typeof CustomFieldType)[keyof typeof CustomFieldType]

export const CustomFieldStatus = {
  Draft: 'DRAFT',
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const
export type CustomFieldStatus = (typeof CustomFieldStatus)[keyof typeof CustomFieldStatus]

export const FieldOptionStatus = {
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const
export type FieldOptionStatus = (typeof FieldOptionStatus)[keyof typeof FieldOptionStatus]

export const FormVersionStatus = {
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
  Archived: 'ARCHIVED',
} as const
export type FormVersionStatus = (typeof FormVersionStatus)[keyof typeof FormVersionStatus]

export const FormFieldSource = {
  CoreField: 'CORE_FIELD',
  CustomField: 'CUSTOM_FIELD',
  ReadonlyDisplay: 'READONLY_DISPLAY',
  InstructionText: 'INSTRUCTION_TEXT',
  Separator: 'SEPARATOR',
} as const
export type FormFieldSource = (typeof FormFieldSource)[keyof typeof FormFieldSource]

export const LayoutType = {
  Detail: 'DETAIL',
  CreateForm: 'CREATE_FORM',
  EditForm: 'EDIT_FORM',
  PortalDetail: 'PORTAL_DETAIL',
  ListColumns: 'LIST_COLUMNS',
  BoardCard: 'BOARD_CARD',
} as const
export type LayoutType = (typeof LayoutType)[keyof typeof LayoutType]

export const LayoutStatus = {
  Draft: 'DRAFT',
  Published: 'PUBLISHED',
  Archived: 'ARCHIVED',
} as const
export type LayoutStatus = (typeof LayoutStatus)[keyof typeof LayoutStatus]

export const StatusSetStatus = {
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const
export type StatusSetStatus = (typeof StatusSetStatus)[keyof typeof StatusSetStatus]

export const TagStatus = {
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const
export type TagStatus = (typeof TagStatus)[keyof typeof TagStatus]

export const TaxonomyStatus = {
  Active: 'ACTIVE',
  Archived: 'ARCHIVED',
} as const
export type TaxonomyStatus = (typeof TaxonomyStatus)[keyof typeof TaxonomyStatus]

export const ValidationRuleType = {
  MinLength: 'MIN_LENGTH',
  MaxLength: 'MAX_LENGTH',
  MinValue: 'MIN_VALUE',
  MaxValue: 'MAX_VALUE',
  Regex: 'REGEX',
  Required: 'REQUIRED',
  Unique: 'UNIQUE',
  AllowedValues: 'ALLOWED_VALUES',
  DateRange: 'DATE_RANGE',
} as const
export type ValidationRuleType = (typeof ValidationRuleType)[keyof typeof ValidationRuleType]
