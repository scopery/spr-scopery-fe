export interface IamUser {
  id: string
  username: string
  email: string
  fullName: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface UpdateIamUserPayload {
  fullName: string
}

export interface CreateIamUserPayload {
  username: string
  email: string
  fullName: string
  password: string
}
