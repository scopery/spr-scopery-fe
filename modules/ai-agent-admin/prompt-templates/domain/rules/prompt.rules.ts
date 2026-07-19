import { PromptContentFormat, PromptVersionStatus } from '../enums/prompt.enum'

export function isPromptVersionEditable(status: PromptVersionStatus): boolean {
  return status === PromptVersionStatus.Draft
}

export function validatePromptContent(
  contentFormat: string,
  content: string
): string | null {
  if (!content.trim()) return 'Content is required'
  if (contentFormat === PromptContentFormat.Json) {
    try {
      JSON.parse(content)
    } catch {
      return 'JSON content is invalid'
    }
  }
  return null
}

export function validateVariableSchema(schema: string | null | undefined): string | null {
  if (schema == null || schema.trim() === '') return null
  try {
    JSON.parse(schema)
    return null
  } catch {
    return 'Variable schema must be valid JSON'
  }
}
