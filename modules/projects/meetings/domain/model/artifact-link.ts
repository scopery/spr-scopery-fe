export interface MeetingArtifactLink {
  id: string
  meetingId: string
  targetType: string
  targetId: string
  linkType: string
  createdAt: string
}

export interface CreateArtifactLinkPayload {
  targetType: string
  targetId: string
  linkType: string
  agendaItemId?: string | null
  noteId?: string | null
  actionItemId?: string | null
}
