import type { MeetingActionItemStatus } from '../enums/meeting.enum'

export interface MeetingActionItem {
  id: string
  meetingId: string
  title: string
  description: string | null
  ownerTargetType: string | null
  ownerTargetId: string | null
  dueDate: string | null
  status: MeetingActionItemStatus | string
  linkedTaskId: string | null
  completedAt: string | null
  clientVisible: boolean
}

export interface CreateActionItemPayload {
  agendaItemId?: string | null
  title: string
  description?: string | null
  ownerTargetType?: string | null
  ownerTargetId?: string | null
  dueDate?: string | null
  clientVisible?: boolean
}

export interface UpdateActionItemPayload {
  title?: string
  description?: string | null
  ownerTargetType?: string | null
  ownerTargetId?: string | null
  dueDate?: string | null
  clientVisible?: boolean
}

export interface CompleteActionItemPayload {
  completionNote?: string | null
}
