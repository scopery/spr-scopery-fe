'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  TIMELINE_LEFT_DEFAULT,
  TIMELINE_LEFT_MAX_RATIO,
  TIMELINE_LEFT_MIN,
} from '../../domain/model/timeline-layout'

const STORAGE_KEY = 'scopery.timeline.leftPaneWidth'

export function clampTimelineLeftWidth(width: number, viewportWidth: number): number {
  const max = Math.max(TIMELINE_LEFT_MIN, Math.floor(viewportWidth * TIMELINE_LEFT_MAX_RATIO))
  return Math.min(max, Math.max(TIMELINE_LEFT_MIN, Math.round(width)))
}

export function useTimelineLeftWidth(projectId: string | null) {
  const storageKey = projectId ? `${STORAGE_KEY}.${projectId}` : STORAGE_KEY

  const [leftWidth, setLeftWidthState] = useState(TIMELINE_LEFT_DEFAULT)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const n = Number(raw)
      if (Number.isFinite(n)) {
        setLeftWidthState(
          clampTimelineLeftWidth(n, typeof window !== 'undefined' ? window.innerWidth : 1440)
        )
      }
    } catch {
      /* ignore */
    }
  }, [storageKey])

  const setLeftWidth = useCallback(
    (next: number | ((prev: number) => number)) => {
      setLeftWidthState((prev) => {
        const viewport = typeof window !== 'undefined' ? window.innerWidth : 1440
        const resolved = typeof next === 'function' ? next(prev) : next
        const clamped = clampTimelineLeftWidth(resolved, viewport)
        try {
          localStorage.setItem(storageKey, String(clamped))
        } catch {
          /* ignore */
        }
        return clamped
      })
    },
    [storageKey]
  )

  const autoFitToLabels = useCallback(
    (labels: string[]) => {
      const longest = labels.reduce((m, s) => Math.max(m, s.length), 0)
      const estimate = Math.round(longest * 7.2 + 220)
      setLeftWidth(estimate)
    },
    [setLeftWidth]
  )

  return { leftWidth, setLeftWidth, autoFitToLabels }
}
