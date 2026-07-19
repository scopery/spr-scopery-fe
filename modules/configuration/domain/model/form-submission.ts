export interface FormSubmission {
  id: string
  formDefinitionId: string
  formVersionId: string
  validationStatus: string
  status: string
}

export interface SubmitFormPayload {
  formVersionId: string
  objectTypeCode?: string
  targetId?: string
  projectId?: string
  payloadJson: string
}
