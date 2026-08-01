'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as qualityApi from '../../infrastructure/api/quality.api'
import type { TestCaseStep, RunExecutionRow } from '../../domain/model/quality'

export interface RunCaseScript {
  kind: 'FUNCTIONAL' | 'NFR'
  preconditions: string | null
  expectedResult: string | null
  expectedResultJson: string | null
  steps: TestCaseStep[]
}

export type RunCaseScriptEntry = {
  script: RunCaseScript | null
  loading: boolean
  error: string | null
}

function scriptCacheKey(row: Pick<RunExecutionRow, 'kind' | 'caseId'>): string | null {
  if (!row.caseId) return null
  return `${row.kind}:${row.caseId}`
}

const scriptCache = new Map<string, RunCaseScript>()
const inflight = new Map<string, Promise<RunCaseScript>>()

async function fetchScript(
  projectId: string,
  row: Pick<RunExecutionRow, 'kind' | 'caseId'>
): Promise<RunCaseScript> {
  const key = scriptCacheKey(row)
  if (!key) throw new Error('Missing case id')

  const cached = scriptCache.get(key)
  if (cached) return cached

  const pending = inflight.get(key)
  if (pending) return pending

  const next = (async () => {
    if (row.kind === 'FUNCTIONAL') {
      const tc = await qualityApi.getTestCase(projectId, row.caseId)
      const steps =
        tc.steps?.length
          ? tc.steps
          : (
              await qualityApi.listTestCaseSteps(projectId, row.caseId).catch(() => ({
                items: [] as TestCaseStep[],
              }))
            ).items ?? []
      const script: RunCaseScript = {
        kind: 'FUNCTIONAL',
        preconditions: tc.preconditions ?? null,
        expectedResult: tc.expectedResult ?? null,
        expectedResultJson: null,
        steps: [...steps].sort((a, b) => a.sortOrder - b.sortOrder),
      }
      scriptCache.set(key, script)
      return script
    }

    const vc = await qualityApi.getVerificationCase(projectId, row.caseId)
    const script: RunCaseScript = {
      kind: 'NFR',
      preconditions: null,
      expectedResult: null,
      expectedResultJson: vc.expectedResultJson ?? null,
      steps: [],
    }
    scriptCache.set(key, script)
    return script
  })().finally(() => {
    inflight.delete(key)
  })

  inflight.set(key, next)
  return next
}

/**
 * Prefetch scripts for all executable rows so preconditions / steps / expected
 * can render inline on each line without opening a case.
 */
export function useRunCaseScripts(
  projectId: string | undefined,
  rows: RunExecutionRow[],
  opts?: { enabled?: boolean }
) {
  const enabled = opts?.enabled !== false
  const [version, setVersion] = useState(0)
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Map<string, string>>(new Map())
  const requestSeq = useRef(0)

  const targets = useMemo(() => {
    if (!enabled) return [] as Array<{ key: string; kind: RunExecutionRow['kind']; caseId: string }>
    const seen = new Set<string>()
    const list: Array<{ key: string; kind: RunExecutionRow['kind']; caseId: string }> = []
    for (const row of rows) {
      if (!row.caseId) continue
      const key = scriptCacheKey(row)
      if (!key || seen.has(key)) continue
      seen.add(key)
      list.push({ key, kind: row.kind, caseId: row.caseId })
    }
    return list
  }, [enabled, rows])

  const targetKeySignature = targets.map((t) => t.key).join('|')

  const load = useCallback(async () => {
    if (!projectId || !enabled) {
      setLoadingKeys(new Set())
      return
    }
    const seq = ++requestSeq.current
    const missing = targets.filter((t) => !scriptCache.has(t.key))
    if (missing.length === 0) {
      setLoadingKeys(new Set())
      setVersion((v) => v + 1)
      return
    }

    setLoadingKeys(new Set(missing.map((t) => t.key)))
    await Promise.all(
      missing.map(async (t) => {
        try {
          await fetchScript(projectId, t)
          if (seq !== requestSeq.current) return
          setErrors((prev) => {
            if (!prev.has(t.key)) return prev
            const next = new Map(prev)
            next.delete(t.key)
            return next
          })
        } catch (err) {
          if (seq !== requestSeq.current) return
          setErrors((prev) => {
            const next = new Map(prev)
            next.set(t.key, err instanceof Error ? err.message : 'Failed to load script')
            return next
          })
        } finally {
          if (seq === requestSeq.current) {
            setLoadingKeys((prev) => {
              const next = new Set(prev)
              next.delete(t.key)
              return next
            })
            setVersion((v) => v + 1)
          }
        }
      })
    )
  }, [enabled, projectId, targetKeySignature, targets])

  useEffect(() => {
    void load()
  }, [load])

  const getEntry = useCallback(
    (row: RunExecutionRow): RunCaseScriptEntry => {
      const key = scriptCacheKey(row)
      if (!key || !row.caseId) {
        return { script: null, loading: false, error: null }
      }
      // version forces re-read after cache fills
      void version
      return {
        script: scriptCache.get(key) ?? null,
        loading: loadingKeys.has(key),
        error: errors.get(key) ?? null,
      }
    },
    [errors, loadingKeys, version]
  )

  return { getEntry, refetch: load }
}

/** @deprecated Prefer useRunCaseScripts for inline row scripts */
export function useRunCaseScript(projectId: string | undefined, row: RunExecutionRow | null) {
  const rows = useMemo(() => (row ? [row] : []), [row])
  const { getEntry, refetch } = useRunCaseScripts(projectId, rows, {
    enabled: Boolean(row),
  })
  const entry = row ? getEntry(row) : { script: null, loading: false, error: null }
  return { ...entry, refetch }
}
