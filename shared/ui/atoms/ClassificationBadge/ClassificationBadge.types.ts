export const ClassificationLevel = {
  Public: 'PUBLIC',
  Internal: 'INTERNAL',
  Confidential: 'CONFIDENTIAL',
  Restricted: 'RESTRICTED',
} as const

export type ClassificationLevel =
  (typeof ClassificationLevel)[keyof typeof ClassificationLevel]

export interface ClassificationBadgeProps {
  level: ClassificationLevel | string
  size?: 'sm' | 'md'
  className?: string
}
