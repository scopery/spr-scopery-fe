export const InboxItemStatus = {
  Unread: 'UNREAD',
  Read: 'READ',
  Snoozed: 'SNOOZED',
} as const
export type InboxItemStatus = (typeof InboxItemStatus)[keyof typeof InboxItemStatus]

export const SearchResultKind = {
  Document: 'DOCUMENT',
  Project: 'PROJECT',
  Requirement: 'REQUIREMENT',
  Defect: 'DEFECT',
  SupportCase: 'SUPPORT_CASE',
  Person: 'PERSON',
  Other: 'OTHER',
} as const
export type SearchResultKind = (typeof SearchResultKind)[keyof typeof SearchResultKind]
