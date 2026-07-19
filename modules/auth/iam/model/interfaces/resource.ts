export interface IamResource {
  id: string
  code: string
  resourceType: string
  name: string
  description: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface CreateResourcePayload {
  code: string
  resourceType: string
  name: string
  description?: string
}

export interface UpdateResourcePayload {
  name: string
  description?: string
}

export interface SearchResourcesParams {
  keyword?: string
  resourceType?: string
  status?: string
  page?: number
  size?: number
}
