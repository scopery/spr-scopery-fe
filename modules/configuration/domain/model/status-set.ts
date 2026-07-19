import type { StatusSetStatus } from '../enums/configuration.enum'

export interface StatusSet {
  id: string
  objectTypeCode: string
  setCode: string
  name: string
  status: StatusSetStatus | string
}

export interface StatusValue {
  id: string
  statusSetId: string
  valueCode: string
  label: string
  domainCategory: string
}

export interface CreateStatusSetPayload {
  objectTypeCode: string
  setCode: string
  name: string
}

export interface CreateStatusValuePayload {
  valueCode: string
  label: string
  domainCategory: string
  sortOrder?: number
}
