import type { MappingRelationType as MappingRelationTypeValue } from './mapping-suggestions'
import type { MappingRelationSource } from './mapping-automap.rules'

const SETTINGS_KEY = 'scopery.ai-mapping.automap.settings.v1'
const AUDIT_KEY = 'scopery.ai-mapping.automap.audit.v1'
const MAX_AUDIT = 100

export interface AutoMapProjectSettings {
  projectId: string
  enabled: boolean
  updatedAt: string
}

export interface AutoMapAuditEntry {
  id: string
  projectId: string
  runId: string
  relationType: MappingRelationTypeValue | string
  suggestionId: string
  sourceId: string
  targetId: string
  relationSource: MappingRelationSource
  at: string
  undone?: boolean
}

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota
  }
}

export function getAutoMapEnabled(projectId: string): boolean {
  const all = readJson<AutoMapProjectSettings[]>(SETTINGS_KEY, [])
  return all.find((s) => s.projectId === projectId)?.enabled === true
}

export function setAutoMapEnabled(projectId: string, enabled: boolean): AutoMapProjectSettings {
  const all = readJson<AutoMapProjectSettings[]>(SETTINGS_KEY, [])
  const nextEntry: AutoMapProjectSettings = {
    projectId,
    enabled,
    updatedAt: new Date().toISOString(),
  }
  const next = [nextEntry, ...all.filter((s) => s.projectId !== projectId)]
  writeJson(SETTINGS_KEY, next)
  return nextEntry
}

export function listAutoMapAudit(projectId: string): AutoMapAuditEntry[] {
  return readJson<AutoMapAuditEntry[]>(AUDIT_KEY, [])
    .filter((e) => e.projectId === projectId)
    .sort((a, b) => b.at.localeCompare(a.at))
}

export function appendAutoMapAudit(entries: AutoMapAuditEntry[]) {
  if (entries.length === 0) return
  const all = readJson<AutoMapAuditEntry[]>(AUDIT_KEY, [])
  writeJson(AUDIT_KEY, [...entries, ...all].slice(0, MAX_AUDIT))
}

export function markAutoMapAuditUndone(projectId: string, suggestionIds: string[]) {
  const set = new Set(suggestionIds)
  const all = readJson<AutoMapAuditEntry[]>(AUDIT_KEY, [])
  writeJson(
    AUDIT_KEY,
    all.map((e) =>
      e.projectId === projectId && set.has(e.suggestionId) ? { ...e, undone: true } : e
    )
  )
}
