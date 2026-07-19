export interface MeetingArtifactLink {
  id: string
  meetingId: string
  artifactType: string
  artifactId: string
  artifactName: string | null
  createdAt: string
}

export interface CreateArtifactLinkPayload {
  artifactType: string
  artifactId: string
  artifactName?: string | null
}
