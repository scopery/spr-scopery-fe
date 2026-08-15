export const ScreenSpecMessages = {
  ADD_MODE_FIRST: 'Add a screen mode before configuring visibility.',
  STATIC_OPTIONS_ONLY: 'Static options are only available when the source type is STATIC.',
  COLUMN_EXISTS: 'This column name already exists on the entity.',
  MODE_CODE_EXISTS: 'This mode already exists on the screen.',
  RULE_PARAM_INVALID: 'Rule parameters do not match the selected rule type.',
  DOC_CODE_EXISTS: 'A spec document with this code already exists.',
  SCREEN_ALREADY_IN_DOC: 'This screen is already in the document.',
  COMPONENT_FIELD_EXISTS: 'This field key already exists on the component.',
  COMPONENT_ALREADY_BOUND: 'This component is already bound to the screen.',
  COMPONENT_API_DUPLICATE: 'This API is already linked to the component with that role.',
  API_ENDPOINT_NOT_IN_WORKSPACE: 'That API does not belong to this workspace.',
} as const
