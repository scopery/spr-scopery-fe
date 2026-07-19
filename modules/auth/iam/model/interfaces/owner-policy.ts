export interface IamOwnerPolicy {
  id: string
  resourceType: string
  name: string
  description: string | null
  status: string
  canDelegate: boolean
  version: number
  createdAt: string
  updatedAt: string
}

export interface CreateOwnerPolicyPayload {
  resourceType: string
  name: string
  description?: string
  canDelegate?: boolean
}

export interface SearchOwnerPoliciesParams {
  page?: number
  size?: number
  status?: string
}
