/** GET /api/organizations/{id} — matches BE OrganizationResponse */
export interface OrganizationDetail {
  id: string
  code: string
  name: string
  description: string | null
  ownerUserId: string
  status: string
  createdAt: string
  updatedAt: string
}
