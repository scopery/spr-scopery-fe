import type { CreateSpecPackInput, SpecPack, SpecPackGroup } from '../model/spec-pack'
import {
  SpecPackStatus,
  defaultSpecPackGroup,
  flattenSpecPackRequirements,
  normalizeSpecPack,
} from '../model/spec-pack'

const STORAGE_PREFIX = 'scopery.spec-packs.v2'

function storageKey(projectId: string): string {
  return `${STORAGE_PREFIX}:${projectId}`
}

/** Migrate once from v1 key if present. */
function legacyStorageKey(projectId: string): string {
  return `scopery.spec-packs.v1:${projectId}`
}

function readAll(projectId: string): SpecPack[] {
  if (typeof window === 'undefined') return []
  try {
    let raw = window.localStorage.getItem(storageKey(projectId))
    if (!raw) {
      const legacy = window.localStorage.getItem(legacyStorageKey(projectId))
      if (legacy) {
        raw = legacy
        window.localStorage.setItem(storageKey(projectId), legacy)
      }
    }
    if (!raw) return []
    const parsed = JSON.parse(raw) as SpecPack[]
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeSpecPack)
  } catch {
    return []
  }
}

function writeAll(projectId: string, packs: SpecPack[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(
    storageKey(projectId),
    JSON.stringify(packs.map(normalizeSpecPack))
  )
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `sp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function resolveGroups(input: CreateSpecPackInput): SpecPackGroup[] {
  if (input.groups && input.groups.length > 0) {
    return input.groups.map((g) => ({
      id: g.id,
      name: g.name.trim() || 'Untitled group',
      description: g.description?.trim() || null,
      requirements: g.requirements,
    }))
  }
  return [defaultSpecPackGroup(input.requirements ?? [])]
}

function touchStatus(current: SpecPackStatus): SpecPackStatus {
  return current === SpecPackStatus.Exported ? SpecPackStatus.Ready : current
}

/** Phase 1 persistence — swap for API later without changing hooks/UI. */
export const specPackLocalStore = {
  list(projectId: string): SpecPack[] {
    return readAll(projectId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },

  get(projectId: string, packId: string): SpecPack | null {
    return readAll(projectId).find((p) => p.id === packId) ?? null
  },

  create(
    workspaceId: string,
    projectId: string,
    input: CreateSpecPackInput
  ): SpecPack {
    const now = new Date().toISOString()
    const groups = resolveGroups(input)
    const pack = normalizeSpecPack({
      id: newId(),
      workspaceId,
      projectId,
      title: input.title.trim() || 'Untitled Spec Pack',
      note: input.note?.trim() || null,
      status: SpecPackStatus.Ready,
      groups,
      requirements: flattenSpecPackRequirements(groups),
      createdAt: now,
      updatedAt: now,
      exportedAt: null,
    })
    const next = [pack, ...readAll(projectId)]
    writeAll(projectId, next)
    return pack
  },

  markExported(projectId: string, packId: string): SpecPack | null {
    const packs = readAll(projectId)
    const idx = packs.findIndex((p) => p.id === packId)
    if (idx < 0) return null
    const now = new Date().toISOString()
    const updated: SpecPack = {
      ...packs[idx],
      status: SpecPackStatus.Exported,
      exportedAt: now,
      updatedAt: now,
    }
    packs[idx] = updated
    writeAll(projectId, packs)
    return updated
  },

  /** Replace full group structure (order of groups + reqs inside). */
  updateGroups(
    projectId: string,
    packId: string,
    groups: SpecPackGroup[]
  ): SpecPack | null {
    const packs = readAll(projectId)
    const idx = packs.findIndex((p) => p.id === packId)
    if (idx < 0) return null
    if (!groups.length) return null
    const current = packs[idx]
    const now = new Date().toISOString()
    const updated = normalizeSpecPack({
      ...current,
      groups,
      requirements: flattenSpecPackRequirements(groups),
      updatedAt: now,
      status: touchStatus(current.status),
    })
    packs[idx] = updated
    writeAll(projectId, packs)
    return updated
  },

  /**
   * @deprecated Prefer updateGroups — kept for simple flat reorder of all reqs
   * while preserving group membership by rebuilding within existing group ids.
   */
  reorderRequirements(
    projectId: string,
    packId: string,
    orderedIds: string[]
  ): SpecPack | null {
    const packs = readAll(projectId)
    const idx = packs.findIndex((p) => p.id === packId)
    if (idx < 0) return null
    const current = packs[idx]
    const byId = new Map(current.requirements.map((r) => [r.id, r]))
    if (orderedIds.length !== current.requirements.length) return null
    if (orderedIds.some((id) => !byId.has(id))) return null

    // Place all into a single ordered group if multi-group structure can't map 1:1.
    const groups: SpecPackGroup[] =
      current.groups.length === 1
        ? [
            {
              ...current.groups[0],
              requirements: orderedIds.map((id) => byId.get(id)!),
            },
          ]
        : [
            {
              ...current.groups[0],
              name: current.groups[0]?.name || 'General',
              requirements: orderedIds.map((id) => byId.get(id)!),
            },
          ]

    return this.updateGroups(projectId, packId, groups)
  },

  remove(projectId: string, packId: string): void {
    writeAll(
      projectId,
      readAll(projectId).filter((p) => p.id !== packId)
    )
  },
}
