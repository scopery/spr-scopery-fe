export interface TrustDashboardSummary {
  workspaceId: string
  openPrivacyRequests: number
  activeLegalHolds: number
  pendingAccessReviews: number
}

export interface PrivacyRequest {
  id: string
  subjectLabel: string
  status: string
  type: string
  createdAt: string
}
