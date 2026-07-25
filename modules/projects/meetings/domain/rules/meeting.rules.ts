import { MeetingActionItemStatus, MeetingMinutesStatus, MeetingStatus } from '../enums/meeting.enum'
import type { Meeting } from '../model/meeting'

/** Meeting is "upcoming" when its scheduled start is in the future and it hasn't been cancelled/archived. */
export function isUpcomingMeeting(meeting: Meeting, now: Date = new Date()): boolean {
  if (meeting.status === MeetingStatus.Cancelled || meeting.status === MeetingStatus.Archived) {
    return false
  }
  const start = new Date(meeting.startAt)
  if (Number.isNaN(start.getTime())) return false
  return start.getTime() >= now.getTime()
}

/** Meeting is "past" when its scheduled start has already passed, or it completed/cancelled/archived. */
export function isPastMeeting(meeting: Meeting, now: Date = new Date()): boolean {
  return !isUpcomingMeeting(meeting, now)
}

export function meetingStatusLabel(status: string): string {
  switch (status) {
    case MeetingStatus.Scheduled:
      return 'Scheduled'
    case MeetingStatus.InProgress:
      return 'In progress'
    case MeetingStatus.Completed:
      return 'Completed'
    case MeetingStatus.Cancelled:
      return 'Cancelled'
    case MeetingStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

export function meetingStatusTone(
  status: string
): 'neutral' | 'success' | 'warning' | 'error' | 'secondary' {
  switch (status) {
    case MeetingStatus.InProgress:
      return 'warning'
    case MeetingStatus.Completed:
      return 'success'
    case MeetingStatus.Cancelled:
    case MeetingStatus.Archived:
      return 'error'
    default:
      return 'neutral'
  }
}

export type MeetingLifecycleAction = 'start' | 'complete' | 'cancel' | 'archive'

const ALLOWED: Record<string, MeetingLifecycleAction[]> = {
  [MeetingStatus.Scheduled]: ['start', 'cancel', 'archive'],
  [MeetingStatus.InProgress]: ['complete', 'cancel', 'archive'],
  [MeetingStatus.Completed]: ['archive'],
  [MeetingStatus.Cancelled]: ['archive'],
  [MeetingStatus.Archived]: [],
}

export function allowedMeetingLifecycleActions(status: string): MeetingLifecycleAction[] {
  return ALLOWED[status] ?? []
}

export function minutesStatusLabel(status: string): string {
  switch (status) {
    case MeetingMinutesStatus.Draft:
      return 'Draft'
    case MeetingMinutesStatus.InReview:
      return 'In review'
    case MeetingMinutesStatus.Approved:
      return 'Approved'
    case MeetingMinutesStatus.Rejected:
      return 'Rejected'
    default:
      return status
  }
}

export function minutesStatusTone(status: string): 'neutral' | 'success' | 'warning' | 'error' {
  switch (status) {
    case MeetingMinutesStatus.InReview:
      return 'warning'
    case MeetingMinutesStatus.Approved:
      return 'success'
    case MeetingMinutesStatus.Rejected:
      return 'error'
    default:
      return 'neutral'
  }
}

export function actionItemStatusLabel(status: string): string {
  switch (status) {
    case MeetingActionItemStatus.Open:
      return 'Open'
    case MeetingActionItemStatus.Completed:
      return 'Completed'
    case MeetingActionItemStatus.Archived:
      return 'Archived'
    default:
      return status
  }
}

/**
 * Meeting workspace view phase (UI only — does NOT change meeting status).
 * - `pre` — Prepare
 * - `during` — Live meeting
 * - `post` — Follow-up
 */
export type MeetingWorkspaceMode = 'pre' | 'during' | 'post'

export const MEETING_WORKSPACE_MODE_LABEL: Record<MeetingWorkspaceMode, string> = {
  pre: 'Prepare',
  during: 'Live meeting',
  post: 'Follow-up',
}

/** Ordered steps for the lifecycle stepper. */
export const MEETING_WORKSPACE_STEPS: MeetingWorkspaceMode[] = ['pre', 'during', 'post']

export function meetingWorkspaceStepIndex(mode: MeetingWorkspaceMode): number {
  return MEETING_WORKSPACE_STEPS.indexOf(mode)
}

export function defaultMeetingWorkspaceMode(status: string): MeetingWorkspaceMode {
  switch (status) {
    case MeetingStatus.InProgress:
      return 'during'
    case MeetingStatus.Completed:
    case MeetingStatus.Cancelled:
    case MeetingStatus.Archived:
      return 'post'
    case MeetingStatus.Scheduled:
    default:
      return 'pre'
  }
}

export function isActionItemOverdue(item: { status: string; dueDate: string | null }): boolean {
  if (!item.dueDate) return false
  if (item.status !== MeetingActionItemStatus.Open) return false
  const due = new Date(item.dueDate)
  if (Number.isNaN(due.getTime())) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return due < today
}
