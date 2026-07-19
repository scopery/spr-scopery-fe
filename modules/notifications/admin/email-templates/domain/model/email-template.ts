export interface EmailTemplate {
  id: string
  name: string
  code: string
  status: string
  category: string | null
  variables: string[]
  createdAt: string
}

export interface EmailTemplateVersion {
  id: string
  templateId: string
  versionNumber: number
  status: string
  subject: string
  htmlBody: string
  textBody: string | null
}

export interface CreateEmailTemplatePayload {
  name: string
  code: string
  category?: string | null
}

export interface UpdateEmailTemplatePayload {
  name?: string
  category?: string | null
}

export interface CreateTemplateVersionPayload {
  subject: string
  htmlBody: string
  textBody?: string | null
}
