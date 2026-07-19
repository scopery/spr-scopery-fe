import type { LayoutStatus, LayoutType } from '../enums/configuration.enum'

export interface LayoutDefinition {
  id: string
  objectTypeCode: string
  layoutType: LayoutType | string
  name: string
  status: LayoutStatus | string
  currentFlag: boolean
}

export interface CreateLayoutPayload {
  objectTypeCode: string
  layoutType: string
  name: string
  layoutJson: string
}
