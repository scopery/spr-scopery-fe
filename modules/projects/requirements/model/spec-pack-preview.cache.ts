import type { SpecPack } from './spec-pack'
import type { SpecPackPreviewDocument } from './spec-pack-preview'
import type { SpecPackPreviewItem } from './spec-pack-preview'

const DOC_TTL_MS = 5 * 60 * 1000
const ENTITY_TTL_MS = 3 * 60 * 1000
const LABEL_TTL_MS = 5 * 60 * 1000
const INDEX_TTL_MS = 3 * 60 * 1000

type TimedEntry<T> = {
  value: T
  expiresAt: number
}

type DocEntry = {
  key: string
  doc: SpecPackPreviewDocument
  expiresAt: number
}

const docCache = new Map<string, DocEntry>()
const entityCache = new Map<string, TimedEntry<unknown>>()
const inflight = new Map<string, Promise<unknown>>()

export type LabelMapsSnapshot = {
  screens: Map<string, SpecPackPreviewItem>
  apis: Map<string, SpecPackPreviewItem>
  communications: Map<string, SpecPackPreviewItem>
}

function packCacheKey(pack: SpecPack): string {
  return `${pack.projectId}:${pack.id}:${pack.updatedAt}`
}

function isFresh(expiresAt: number): boolean {
  return expiresAt > Date.now()
}

/**
 * Shared TTL + in-flight dedupe across Spec Pack hydrate runs
 * (survives switching packs within the same project).
 */
export function cachedFetch<T>(
  key: string,
  ttlMs: number,
  factory: () => Promise<T>,
  opts?: { force?: boolean }
): Promise<T> {
  if (!opts?.force) {
    const hit = entityCache.get(key)
    if (hit && isFresh(hit.expiresAt)) {
      return Promise.resolve(hit.value as T)
    }
    const pending = inflight.get(key)
    if (pending) return pending as Promise<T>
  } else {
    inflight.delete(key)
  }

  const next = factory()
    .then((value) => {
      entityCache.set(key, { value, expiresAt: Date.now() + ttlMs })
      inflight.delete(key)
      return value
    })
    .catch((err) => {
      inflight.delete(key)
      throw err
    })

  inflight.set(key, next)
  return next
}

export const SpecPackCacheKeys = {
  useCase: (projectId: string, id: string) => `uc:${projectId}:${id}`,
  functionalItem: (projectId: string, id: string) => `fi:${projectId}:${id}`,
  useCasesByFunction: (projectId: string, id: string) => `uc-by-fn:${projectId}:${id}`,
  functionReqs: (projectId: string, id: string) => `fn-reqs:${projectId}:${id}`,
  functionScreens: (projectId: string, id: string) => `fn-scr:${projectId}:${id}`,
  functionApis: (projectId: string, id: string) => `fn-api:${projectId}:${id}`,
  functionComms: (projectId: string, id: string) => `fn-comm:${projectId}:${id}`,
  trace: (projectId: string, requirementId: string) => `trace:${projectId}:${requirementId}`,
  requirements: (workspaceId: string, projectId: string) =>
    `requirements:${workspaceId}:${projectId}`,
  functionalItems: (projectId: string) => `fi-list:${projectId}`,
  labels: (workspaceId: string) => `labels:${workspaceId}`,
  reqFnIndex: (projectId: string) => `req-fn-index:${projectId}`,
} as const

export const SpecPackCacheTtl = {
  entity: ENTITY_TTL_MS,
  label: LABEL_TTL_MS,
  index: INDEX_TTL_MS,
  doc: DOC_TTL_MS,
} as const

export function getCachedSpecPackPreview(pack: SpecPack): {
  doc: SpecPackPreviewDocument
  stale: boolean
} | null {
  const key = packCacheKey(pack)
  const hit = docCache.get(pack.id)
  if (!hit || hit.key !== key) return null
  return {
    doc: hit.doc,
    stale: !isFresh(hit.expiresAt),
  }
}

export function setCachedSpecPackPreview(
  pack: SpecPack,
  doc: SpecPackPreviewDocument
): void {
  docCache.set(pack.id, {
    key: packCacheKey(pack),
    doc,
    expiresAt: Date.now() + DOC_TTL_MS,
  })
}

export function invalidateSpecPackPreviewCache(packId?: string): void {
  if (packId) docCache.delete(packId)
  else docCache.clear()
}

/** Drop entity/catalog caches for a project (or everything). */
export function invalidateSpecPackEntityCache(projectId?: string): void {
  if (!projectId) {
    entityCache.clear()
    inflight.clear()
    return
  }
  const needle = `:${projectId}:`
  const prefix = `:${projectId}`
  for (const key of [...entityCache.keys()]) {
    if (key.includes(needle) || key.endsWith(prefix) || key.includes(`:${projectId}`)) {
      entityCache.delete(key)
    }
  }
  for (const key of [...inflight.keys()]) {
    if (key.includes(needle) || key.endsWith(prefix) || key.includes(`:${projectId}`)) {
      inflight.delete(key)
    }
  }
}

export function invalidateAllSpecPackCaches(projectId?: string): void {
  if (projectId) {
    for (const [id, entry] of docCache) {
      if (entry.key.startsWith(`${projectId}:`)) docCache.delete(id)
    }
    invalidateSpecPackEntityCache(projectId)
  } else {
    docCache.clear()
    invalidateSpecPackEntityCache()
  }
}

/** @deprecated keep for one-shot local dedupe if needed */
export function createPromiseCache() {
  const store = new Map<string, Promise<unknown>>()
  return {
    get<T>(key: string, factory: () => Promise<T>): Promise<T> {
      const existing = store.get(key)
      if (existing) return existing as Promise<T>
      const pending = factory().catch((err) => {
        store.delete(key)
        throw err
      })
      store.set(key, pending)
      return pending
    },
  }
}

export type PromiseCache = ReturnType<typeof createPromiseCache>
