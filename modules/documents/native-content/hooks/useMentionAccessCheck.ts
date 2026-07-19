'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Value } from 'platejs'
import * as mentionApi from '../api/resource-mention.api'
import {
  extractMentionsFromPlateValue,
  mentionsToRefs,
} from '../model/mention-tokens'
import type { ResolvedResource } from '../model/intelligence'

const DEBOUNCE_MS = 800

export function useMentionAccessCheck(plateValue: Value) {
  const [resolved, setResolved] = useState<ResolvedResource[]>([])
  const [checking, setChecking] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const run = useCallback(async (value: Value) => {
    const mentions = extractMentionsFromPlateValue(value)
    if (!mentions.length) {
      setResolved([])
      return
    }
    setChecking(true)
    try {
      const res = await mentionApi.batchResolveResources(mentionsToRefs(mentions))
      setResolved(res.items)
    } catch {
      // Soft-fail — global interceptor may toast; keep prior state
    } finally {
      setChecking(false)
    }
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      void run(plateValue)
    }, DEBOUNCE_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [plateValue, run])

  const revoked = resolved.filter(
    (r) => r.status === 'ACCESS_REVOKED' || r.status === 'NOT_FOUND'
  )
  const accessible = resolved.filter((r) => r.status === 'RESOLVED')

  return { resolved, revoked, accessible, checking, mentionCount: resolved.length }
}
