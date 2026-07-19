export const MeetingStatus = {
  Scheduled: 'SCHEDULED',
  InProgress: 'IN_PROGRESS',
  Completed: 'COMPLETED',
  Cancelled: 'CANCELLED',
  Archived: 'ARCHIVED',
} as const
export type MeetingStatus = (typeof MeetingStatus)[keyof typeof MeetingStatus]

export const MeetingMinutesStatus = {
  Draft: 'DRAFT',
  InReview: 'IN_REVIEW',
  Approved: 'APPROVED',
  Rejected: 'REJECTED',
} as const
export type MeetingMinutesStatus = (typeof MeetingMinutesStatus)[keyof typeof MeetingMinutesStatus]

export const MeetingActionItemStatus = {
  Open: 'OPEN',
  Completed: 'COMPLETED',
  Archived: 'ARCHIVED',
} as const
export type MeetingActionItemStatus =
  (typeof MeetingActionItemStatus)[keyof typeof MeetingActionItemStatus]

export const MeetingParticipantRole = {
  Organizer: 'ORGANIZER',
  Attendee: 'ATTENDEE',
  Optional: 'OPTIONAL',
  Presenter: 'PRESENTER',
} as const
export type MeetingParticipantRole =
  (typeof MeetingParticipantRole)[keyof typeof MeetingParticipantRole]

export const MeetingAttendanceStatus = {
  Invited: 'INVITED',
  Accepted: 'ACCEPTED',
  Declined: 'DECLINED',
  Attended: 'ATTENDED',
  Absent: 'ABSENT',
} as const
export type MeetingAttendanceStatus =
  (typeof MeetingAttendanceStatus)[keyof typeof MeetingAttendanceStatus]
