'use client'

import { useEffect, useRef, useState } from 'react'
import * as elicitationApi from '../../infrastructure/api/elicitation.api'

const POLL_INTERVAL_MS = 30_000

interface ScopeLockState {
  isLocked: boolean
  lockingSessionId: string | null
}

export function useElicitationScopeLock(projectId: string): ScopeLockState {
  const [state, setState] = useState<ScopeLockState>({
    isLocked: false,
    lockingSessionId: null,
  })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const check = async () => {
    try {
      const sessions = await elicitationApi.listSessions(projectId)
      const active = sessions.find((s) => s.status === 'ACTIVE')
      setState({
        isLocked: !!active,
        lockingSessionId: active?.id ?? null,
      })
    } catch {
      // fail silently — lock check is best-effort
    }
  }

  useEffect(() => {
    if (!projectId) return
    void check()
    timerRef.current = setInterval(() => void check(), POLL_INTERVAL_MS)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  return state
}
