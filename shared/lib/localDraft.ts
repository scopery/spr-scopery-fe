/**
 * FE-only draft persistence (localStorage) with debounce.
 * Survives navigation / refresh without hitting BE.
 */

export interface LocalDraftEnvelope<T> {
  updatedAt: string
  data: T
}

export function readLocalDraft<T>(key: string): LocalDraftEnvelope<T> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LocalDraftEnvelope<T>
    if (!parsed || typeof parsed !== 'object' || !('data' in parsed)) return null
    return parsed
  } catch {
    return null
  }
}

export function writeLocalDraft<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return
  try {
    const envelope: LocalDraftEnvelope<T> = {
      updatedAt: new Date().toISOString(),
      data,
    }
    window.localStorage.setItem(key, JSON.stringify(envelope))
  } catch {
    /* quota / private mode */
  }
}

export function clearLocalDraft(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export function requirementDraftKey(
  projectId: string,
  requirementId: string | 'new'
): string {
  return `scopery.req-draft.v1:${projectId}:${requirementId}`
}

export function functionalItemDraftKey(projectId: string, itemId: string): string {
  return `scopery.fn-draft.v1:${projectId}:${itemId}`
}
