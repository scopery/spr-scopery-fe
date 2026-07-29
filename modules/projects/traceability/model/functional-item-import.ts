/** Incoming row for functional-item import preview/execute. */
export interface FunctionalItemImportEntry {
  code?: string | null
  title: string
  description?: string | null
  priority?: string | null
  type?: string | null
  acceptanceCriteria?: string[] | null
  workspaceId?: string | null
  moduleId?: string | null
}

export interface FunctionalItemImportPreviewRequest {
  items: FunctionalItemImportEntry[]
}

export interface FunctionalItemImportCandidate {
  existingId: string
  existingCode: string | null
  existingTitle: string
  similarity: number
}

export interface FunctionalItemImportDiff {
  existingId: string
  existingCode: string | null
  existingTitle: string
  incoming: FunctionalItemImportEntry
  /** field → [old, new] */
  changes: Record<string, [unknown, unknown] | unknown[]>
}

export interface FunctionalItemImportConflict {
  incoming: FunctionalItemImportEntry
  candidates: FunctionalItemImportCandidate[]
}

export interface FunctionalItemImportPreviewResponse {
  toCreate: FunctionalItemImportEntry[]
  toUpdate: FunctionalItemImportDiff[]
  conflicts: FunctionalItemImportConflict[]
}

export interface FunctionalItemImportUpdateEntry {
  existingItemId: string
  code?: string | null
  title?: string | null
  description?: string | null
  priority?: string | null
  status?: string | null
  type?: string | null
  acceptanceCriteria?: string[] | null
  workspaceId?: string | null
  moduleId?: string | null
}

export interface FunctionalItemImportExecuteRequest {
  toCreate: FunctionalItemImportEntry[]
  toUpdate: FunctionalItemImportUpdateEntry[]
  archiveUnmatched: boolean
}

export interface FunctionalItemImportExecuteResult {
  created: number
  updated: number
  archived: number
}

export type FunctionalItemConflictResolution =
  | { kind: 'create' }
  | { kind: 'match'; existingItemId: string }
  | { kind: 'skip' }
