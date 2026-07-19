export interface MeetingNote {
  id: string
  meetingId: string
  content: string
  convertedTo: { type: string; entityId: string } | null
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface CreateNotePayload {
  content: string
}

export interface UpdateNotePayload {
  content: string
}
