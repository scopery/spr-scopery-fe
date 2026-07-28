import type {
  FunctionalItemConflictResolution,
  FunctionalItemImportEntry,
  FunctionalItemImportExecuteRequest,
  FunctionalItemImportPreviewResponse,
  FunctionalItemImportUpdateEntry,
} from '../model/functional-item-import'
import { FunctionalItemPriority, FunctionalItemType } from '../model/functional-catalog'

/**
 * Parse pasted text into functional-item import entries.
 * Supports: JSON array of objects, or newline titles (optional "CODE | Title").
 */
export function parseFunctionalItemImportPaste(
  raw: string,
  defaults?: { workspaceId?: string }
): FunctionalItemImportEntry[] {
  const trimmed = raw.trim()
  if (!trimmed) return []

  const workspaceId = defaults?.workspaceId ?? null

  if (trimmed.startsWith('[')) {
    const parsed = JSON.parse(trimmed) as unknown
    if (!Array.isArray(parsed)) throw new Error('JSON must be an array of items')
    return parsed.map((row, index) => {
      if (!row || typeof row !== 'object') {
        throw new Error(`Item at index ${index} is invalid`)
      }
      const r = row as Record<string, unknown>
      const title = typeof r.title === 'string' ? r.title.trim() : ''
      if (!title) throw new Error(`Item at index ${index} is missing title`)

      let acceptanceCriteria: string[] | null = null
      if (Array.isArray(r.acceptanceCriteria)) {
        acceptanceCriteria = r.acceptanceCriteria
          .filter((x): x is string => typeof x === 'string')
          .map((x) => x.trim())
          .filter(Boolean)
      } else if (typeof r.acceptanceCriteria === 'string' && r.acceptanceCriteria.trim()) {
        acceptanceCriteria = r.acceptanceCriteria
          .split(/\n|;/)
          .map((s) => s.trim())
          .filter(Boolean)
      }

      return {
        code: typeof r.code === 'string' && r.code.trim() ? r.code.trim() : null,
        title,
        description: typeof r.description === 'string' ? r.description : null,
        priority:
          typeof r.priority === 'string' && r.priority.trim()
            ? r.priority.trim().toUpperCase()
            : FunctionalItemPriority.Medium,
        type:
          typeof r.type === 'string' && r.type.trim()
            ? r.type.trim().toUpperCase()
            : FunctionalItemType.Functional,
        acceptanceCriteria,
        workspaceId:
          typeof r.workspaceId === 'string' && r.workspaceId
            ? r.workspaceId
            : workspaceId,
        moduleId: typeof r.moduleId === 'string' && r.moduleId ? r.moduleId : null,
      }
    })
  }

  return trimmed
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const pipe = line.indexOf('|')
      if (pipe > 0) {
        const code = line.slice(0, pipe).trim() || null
        const title = line.slice(pipe + 1).trim()
        if (!title) throw new Error(`Line ${index + 1} is missing title`)
        return {
          code,
          title,
          description: null,
          priority: FunctionalItemPriority.Medium,
          type: FunctionalItemType.Functional,
          acceptanceCriteria: null,
          workspaceId,
          moduleId: null,
        }
      }
      return {
        code: null,
        title: line,
        description: null,
        priority: FunctionalItemPriority.Medium,
        type: FunctionalItemType.Functional,
        acceptanceCriteria: null,
        workspaceId,
        moduleId: null,
      }
    })
}

function toUpdateEntry(
  existingItemId: string,
  incoming: FunctionalItemImportEntry
): FunctionalItemImportUpdateEntry {
  return {
    existingItemId,
    code: incoming.code ?? null,
    title: incoming.title,
    description: incoming.description ?? null,
    priority: incoming.priority ?? null,
    type: incoming.type ?? null,
    acceptanceCriteria: incoming.acceptanceCriteria ?? null,
    workspaceId: incoming.workspaceId ?? null,
    moduleId: incoming.moduleId ?? null,
  }
}

export function buildFunctionalItemImportExecutePayload(
  preview: FunctionalItemImportPreviewResponse,
  conflictResolutions: FunctionalItemConflictResolution[],
  archiveUnmatched: boolean
): FunctionalItemImportExecuteRequest {
  if (conflictResolutions.length !== preview.conflicts.length) {
    throw new Error('Resolve every conflict before importing')
  }

  const toCreate: FunctionalItemImportEntry[] = [...preview.toCreate]
  const toUpdate: FunctionalItemImportUpdateEntry[] = preview.toUpdate.map((diff) =>
    toUpdateEntry(diff.existingId, diff.incoming)
  )

  preview.conflicts.forEach((conflict, index) => {
    const resolution = conflictResolutions[index]
    if (resolution.kind === 'create') {
      toCreate.push(conflict.incoming)
      return
    }
    toUpdate.push(toUpdateEntry(resolution.existingItemId, conflict.incoming))
  })

  return { toCreate, toUpdate, archiveUnmatched }
}

export function formatFunctionalImportChangeValue(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.join('; ') || '—'
  return String(value)
}
