export interface IamRight {
  id: string
  code: string
  name: string
  description: string | null
  module: string | null
  status: string
  createdAt: string
  updatedAt: string
}

export interface SearchRightsParams {
  keyword?: string
  module?: string
  status?: string
  page?: number
  size?: number
}
