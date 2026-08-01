'use client'

import { useCallback, useEffect, useState } from 'react'
import * as qualityApi from '../../infrastructure/api/quality.api'
import type { TestCaseStep, RunExecutionRow } from '../../domain/model/quality'

export interface RunCaseScript {
  kind: 'FUNCTIONAL' | 'NFR'
  preconditions: string | null
  expectedResult: string | null
  expectedResultJson: string | null
  steps: TestCaseStep[]
}

/**
 * Lazily loads the focused run row's case script (preconditions / steps / expected)
 * so testers can execute without opening the case drawer.
 */
export function useRunCaseScript(projectId: string | undefined, row: RunExecutionRow | null) {
  const [script, setScript] = useState<RunCaseScript | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !row || row.resultId.startsWith('membership:')) {
      setScript(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      if (row.kind === 'FUNCTIONAL') {
        const [tc, stepsRes] = await Promise.all([
          qualityApi.getTestCase(projectId, row.caseId),
          qualityApi.listTestCaseSteps(projectId, row.caseId),
        ])
        const fromDetail = tc.steps?.length ? tc.steps : stepsRes.items ?? []
        setScript({
          kind: 'FUNCTIONAL',
          preconditions: tc.preconditions ?? null,
          expectedResult: tc.expectedResult ?? null,
          expectedResultJson: null,
          steps: [...fromDetail].sort((a, b) => a.sortOrder - b.sortOrder),
        })
      } else {
        const vc = await qualityApi.getVerificationCase(projectId, row.caseId)
        setScript({
          kind: 'NFR',
          preconditions: null,
          expectedResult: null,
          expectedResultJson: vc.expectedResultJson ?? null,
          steps: [],
        })
      }
    } catch (err) {
      setScript(null)
      setError(err instanceof Error ? err.message : 'Failed to load case script')
    } finally {
      setLoading(false)
    }
  }, [projectId, row])

  useEffect(() => {
    void load()
  }, [load])

  return { script, loading, error, refetch: load }
}
