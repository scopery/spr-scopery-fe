/** My Work window presets — matches BE `MyWorkWindow`. */
export const MyWorkWindow = {
  ThisWeek: 'THIS_WEEK',
  Overdue: 'OVERDUE',
  Upcoming: 'UPCOMING',
  AllOpen: 'ALL_OPEN',
  Custom: 'CUSTOM',
} as const

export type MyWorkWindow = (typeof MyWorkWindow)[keyof typeof MyWorkWindow]
