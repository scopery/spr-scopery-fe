'use client'

import { useEffect, useMemo, useState } from 'react'
import * as traceabilityApi from '@/modules/projects/traceability/api/traceability.api'
import { getFunctionalItem } from '@/modules/projects/traceability/api/functional-catalog.api'
import { TraceLinkType } from '@/modules/quality/domain/enums/quality.enum'
import {
  buildCoversReqFunctionIndex,
  type CoversFunctionRef,
} from '../model/requirement-covers-links.rules'

const INDEX_TTL_MS = 3 * 60 * 1000

type TimedIndex = {
  value: Map<string, CoversFunctionRef[]>
  expiresAt: number
}

const indexCache = new Map<string, TimedIndex>()
const indexInflight = new Map<string, Promise<Map<string, CoversFunctionRef[]>>>()
const functionCache = new Map<string, CoversFunctionRef>()
const functionInflight = new Map<string, Promise<CoversFunctionRef | null>>()

function isFresh(expiresAt: number): boolean {
  return expiresAt > Date.now()
}

async function loadCoversIndex(projectId: string): Promise<Map<string, CoversFunctionRef[]>> {
  const hit = indexCache.get(projectId)
  if (hit && isFresh(hit.expiresAt)) return hit.value

  const pending = indexInflight.get(projectId)
  if (pending) return pending

  const next = traceabilityApi
    .listTraceLinks(projectId, {
      linkType: TraceLinkType.Covers,
      sourceType: 'REQUIREMENT',
      targetType: 'FUNCTIONAL_ITEM',
      limit: 500,
    })
    .then((res) => {
      const value = buildCoversReqFunctionIndex(res.items)
      indexCache.set(projectId, { value, expiresAt: Date.now() + INDEX_TTL_MS })
      indexInflight.delete(projectId)
      return value
    })
    .catch((err) => {
      indexInflight.delete(projectId)
      throw err
    })

  indexInflight.set(projectId, next)
  return next
}

function functionCacheKey(projectId: string, functionId: string): string {
  return `${projectId}:${functionId}`
}

async function loadFunctionalItem(
  projectId: string,
  functionId: string
): Promise<CoversFunctionRef | null> {
  const key = functionCacheKey(projectId, functionId)
  const hit = functionCache.get(key)
  if (hit) return hit

  const pending = functionInflight.get(key)
  if (pending) return pending

  const next = getFunctionalItem(projectId, functionId)
    .then((item) => {
      const ref: CoversFunctionRef = {
        id: item.id,
        code: item.code ?? '',
        title: item.title || item.code || item.id,
      }
      functionCache.set(key, ref)
      functionInflight.delete(key)
      return ref
    })
    .catch(() => {
      functionInflight.delete(key)
      return null
    })

  functionInflight.set(key, next)
  return next
}

export function invalidateRequirementCoversIndex(projectId?: string): void {
  if (!projectId) {
    indexCache.clear()
    indexInflight.clear()
    return
  }
  indexCache.delete(projectId)
  indexInflight.delete(projectId)
}

/** Linked functions for one requirement. Project COVERS index is cached (TTL + in-flight). */
export function useRequirementLinkedFunctions(
  projectId: string | null,
  requirementId: string | null,
  fallbackFunctionalItemId?: string | null
) {
  const [index, setIndex] = useState<Map<string, CoversFunctionRef[]> | null>(null)
  const [fallback, setFallback] = useState<CoversFunctionRef | null>(null)

  useEffect(() => {
    if (!projectId) {
      setIndex(null)
      return
    }
    let cancelled = false
    void loadCoversIndex(projectId)
      .then((next) => {
        if (!cancelled) setIndex(next)
      })
      .catch(() => {
        if (!cancelled) setIndex(new Map())
      })
    return () => {
      cancelled = true
    }
  }, [projectId])

  const linkedFromIndex = useMemo(() => {
    if (!requirementId || !index) return []
    return index.get(requirementId) ?? []
  }, [index, requirementId])

  useEffect(() => {
    setFallback(null)
    if (linkedFromIndex.length > 0) return
    if (!projectId || !fallbackFunctionalItemId) return
    let cancelled = false
    void loadFunctionalItem(projectId, fallbackFunctionalItemId).then((ref) => {
      if (!cancelled) setFallback(ref)
    })
    return () => {
      cancelled = true
    }
  }, [projectId, fallbackFunctionalItemId, linkedFromIndex.length])

  const linkedFunctions = linkedFromIndex.length > 0 ? linkedFromIndex : fallback ? [fallback] : []

  return {
    linkedFunctions,
    primary: linkedFunctions[0] ?? null,
  }
}
