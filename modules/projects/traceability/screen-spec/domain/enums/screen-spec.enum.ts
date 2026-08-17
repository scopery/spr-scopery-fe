export const ScreenModeCode = {
  Create: 'CREATE',
  View: 'VIEW',
  Edit: 'EDIT',
  Search: 'SEARCH',
  Dialog: 'DIALOG',
} as const
export type ScreenModeCode = (typeof ScreenModeCode)[keyof typeof ScreenModeCode]

export const SCREEN_MODE_CODE_OPTIONS: ScreenModeCode[] = [
  ScreenModeCode.Create,
  ScreenModeCode.View,
  ScreenModeCode.Edit,
  ScreenModeCode.Search,
  ScreenModeCode.Dialog,
]

export const OptionSourceType = {
  None: 'NONE',
  Static: 'STATIC',
  Dynamic: 'DYNAMIC',
} as const
export type OptionSourceType = (typeof OptionSourceType)[keyof typeof OptionSourceType]

export const OPTION_SOURCE_TYPE_OPTIONS: OptionSourceType[] = [
  OptionSourceType.None,
  OptionSourceType.Static,
  OptionSourceType.Dynamic,
]

export const DataEntityDataType = {
  Varchar: 'VARCHAR',
  Integer: 'INTEGER',
  Boolean: 'BOOLEAN',
  Date: 'DATE',
  Timestamp: 'TIMESTAMP',
  Text: 'TEXT',
  Uuid: 'UUID',
  Decimal: 'DECIMAL',
} as const
export type DataEntityDataType = (typeof DataEntityDataType)[keyof typeof DataEntityDataType]

export const DATA_ENTITY_DATA_TYPE_OPTIONS: DataEntityDataType[] = [
  DataEntityDataType.Varchar,
  DataEntityDataType.Integer,
  DataEntityDataType.Boolean,
  DataEntityDataType.Date,
  DataEntityDataType.Timestamp,
  DataEntityDataType.Text,
  DataEntityDataType.Uuid,
  DataEntityDataType.Decimal,
]

export const TriggerActionCode = {
  Click: 'CLICK',
  Change: 'CHANGE',
  Blur: 'BLUR',
  Focus: 'FOCUS',
  Submit: 'SUBMIT',
  Load: 'LOAD',
} as const
export type TriggerActionCode = (typeof TriggerActionCode)[keyof typeof TriggerActionCode]

export const TRIGGER_ACTION_CODE_OPTIONS: TriggerActionCode[] = [
  TriggerActionCode.Click,
  TriggerActionCode.Change,
  TriggerActionCode.Blur,
  TriggerActionCode.Focus,
  TriggerActionCode.Submit,
  TriggerActionCode.Load,
]

export const RequiredOverride = {
  Inherit: 'inherit',
  Required: 'required',
  Optional: 'optional',
} as const
export type RequiredOverride = (typeof RequiredOverride)[keyof typeof RequiredOverride]

export const ScreenFieldType = {
  Input: 'INPUT',
  Text: 'TEXT',
  Textarea: 'TEXTAREA',
  Number: 'NUMBER',
  Date: 'DATE',
  Datepicker: 'DATEPICKER',
  Boolean: 'BOOLEAN',
  Checkbox: 'CHECKBOX',
  Radio: 'RADIO',
  Select: 'SELECT',
  Dropdown: 'DROPDOWN',
  MultiSelect: 'MULTI_SELECT',
  Button: 'BUTTON',
  Label: 'LABEL',
  Hidden: 'HIDDEN',
  Url: 'URL',
  Password: 'PASSWORD',
} as const
export type ScreenFieldType = (typeof ScreenFieldType)[keyof typeof ScreenFieldType]

export const SCREEN_FIELD_TYPE_OPTIONS: ScreenFieldType[] = [
  ScreenFieldType.Input,
  ScreenFieldType.Text,
  ScreenFieldType.Textarea,
  ScreenFieldType.Number,
  ScreenFieldType.Date,
  ScreenFieldType.Datepicker,
  ScreenFieldType.Boolean,
  ScreenFieldType.Checkbox,
  ScreenFieldType.Radio,
  ScreenFieldType.Select,
  ScreenFieldType.Dropdown,
  ScreenFieldType.MultiSelect,
  ScreenFieldType.Button,
  ScreenFieldType.Label,
  ScreenFieldType.Hidden,
  ScreenFieldType.Url,
  ScreenFieldType.Password,
]

export const ComponentApiRole = {
  FetchOptions: 'FETCH_OPTIONS',
  Submit: 'SUBMIT',
  Validate: 'VALIDATE',
  LoadData: 'LOAD_DATA',
  Autocomplete: 'AUTOCOMPLETE',
} as const
export type ComponentApiRole = (typeof ComponentApiRole)[keyof typeof ComponentApiRole]

export const COMPONENT_API_ROLE_OPTIONS: ComponentApiRole[] = [
  ComponentApiRole.FetchOptions,
  ComponentApiRole.Submit,
  ComponentApiRole.Validate,
  ComponentApiRole.LoadData,
  ComponentApiRole.Autocomplete,
]

export const COMPONENT_API_ROLE_SELECT_OPTIONS: Array<{ value: ComponentApiRole; label: string }> = [
  { value: ComponentApiRole.FetchOptions, label: 'Fetch options' },
  { value: ComponentApiRole.Submit, label: 'Submit' },
  { value: ComponentApiRole.Validate, label: 'Validate' },
  { value: ComponentApiRole.LoadData, label: 'Load data' },
  { value: ComponentApiRole.Autocomplete, label: 'Autocomplete' },
]
