export interface CustomFormSection {
  id: string
  formVersionId: string
  title: string
  sortOrder: number
}

export interface CreateFormSectionPayload {
  title: string
  sortOrder?: number
}
