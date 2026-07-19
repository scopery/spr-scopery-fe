export interface CustomFormDefinition {
  id: string
  formCode: string
  name: string
  objectTypeCode: string
  formType: string | null
  status: string
  currentVersionId: string | null
}

export interface CreateFormPayload {
  formCode: string
  name: string
  objectTypeCode: string
  formType?: string
  projectId?: string
}
