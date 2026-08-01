import type { CreateSpecPackInput, SpecPack } from '../model/spec-pack'
import { SpecPackStatus } from '../model/spec-pack'

const STORAGE_PREFIX = 'scopery.spec-packs.v1'

function storageKey(projectId: string): string {
  return `${STORAGE_PREFIX}:${projectId}`
}

function readAll(projectId: string): SpecPack[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(storageKey(projectId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as SpecPack[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(projectId: string, packs: SpecPack[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(storageKey(projectId), JSON.stringify(packs))
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `sp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
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
    const pack: SpecPack = {
      id: newId(),
      workspaceId,
      projectId,
      title: input.title.trim() || 'Untitled Spec Pack',
      note: input.note?.trim() || null,
      status: SpecPackStatus.Ready,
      requirements: input.requirements,
      createdAt: now,
      updatedAt: now,
      exportedAt: null,
    }
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

  remove(projectId: string, packId: string): void {
    writeAll(
      projectId,
      readAll(projectId).filter((p) => p.id !== packId)
    )
  },
}
