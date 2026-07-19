export interface IamPageResponse<T> {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface IamSearchParams {
  keyword?: string
  status?: string
  page?: number
  size?: number
}
