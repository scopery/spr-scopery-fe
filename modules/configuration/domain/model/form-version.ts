import type { FormVersionStatus } from '../enums/configuration.enum'

export interface CustomFormVersion {
  id: string
  formDefinitionId: string
  versionNumber: number
  status: FormVersionStatus | string
  currentFlag: boolean
  publishedAt: string | null
}
