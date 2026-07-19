export const EmailTemplateScope = {
  System: 'SYSTEM',
  Workspace: 'WORKSPACE',
} as const
export type EmailTemplateScope = (typeof EmailTemplateScope)[keyof typeof EmailTemplateScope]

export const EmailRecipientStrategy = {
  FixedAddress: 'FIXED_ADDRESS',
  EventPayloadField: 'EVENT_PAYLOAD_FIELD',
  WorkspaceUsersWithRight: 'WORKSPACE_USERS_WITH_RIGHT',
} as const
export type EmailRecipientStrategy =
  (typeof EmailRecipientStrategy)[keyof typeof EmailRecipientStrategy]

export const EmailDeliveryStatus = {
  Pending: 'PENDING',
  Sent: 'SENT',
  Failed: 'FAILED',
  Skipped: 'SKIPPED',
} as const
export type EmailDeliveryStatus = (typeof EmailDeliveryStatus)[keyof typeof EmailDeliveryStatus]
