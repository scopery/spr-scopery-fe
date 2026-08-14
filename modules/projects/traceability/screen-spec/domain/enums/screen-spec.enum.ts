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
