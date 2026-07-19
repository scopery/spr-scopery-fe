import { ToolMutationType } from '../enums/tool.enum'
import type { ToolMutationType as MutationType } from '../enums/tool.enum'

/** WRITE / READ_WRITE need stronger confirm even for stub execute (W5-GAP-13). */
export function isWriteLikeMutation(mutationType: MutationType | null | undefined): boolean {
  return (
    mutationType === ToolMutationType.Write || mutationType === ToolMutationType.ReadWrite
  )
}

export function normalizePermissionCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '_')
}

export function validatePermissionCode(raw: string): string | null {
  const code = normalizePermissionCode(raw)
  if (!code) return 'Permission code is required'
  if (!/^[A-Z][A-Z0-9_]*$/.test(code)) {
    return 'Use a controlled permission code (e.g. AI_TOOL_EXECUTE)'
  }
  return null
}
