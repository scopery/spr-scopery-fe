'use client'

import { useCallback, useState } from 'react'
import type { TimelineDraftPatch } from '../../domain/model/timeline'

type DraftMap = Map<string, { startDate: string; endDate: string; sourceTaskId: string }>

export function useTimelineDraft() {
  const [draft, setDraft] = useState<DraftMap>(() => new Map())
  const [undoStack, setUndoStack] = useState<DraftMap[]>([])

  const snapshot = useCallback((current: DraftMap) => {
    setUndoStack((stack) => [...stack.slice(-49), new Map(current)])
  }, [])

  const setSchedule = useCallback(
    (itemId: string, sourceTaskId: string, startDate: string, endDate: string) => {
      setDraft((prev) => {
        snapshot(prev)
        const next = new Map(prev)
        next.set(itemId, { startDate, endDate, sourceTaskId })
        return next
      })
    },
    [snapshot]
  )

  const setSchedules = useCallback(
    (
      patches: Array<{
        itemId: string
        sourceTaskId: string
        startDate: string
        endDate: string
      }>
    ) => {
      if (patches.length === 0) return
      setDraft((prev) => {
        snapshot(prev)
        const next = new Map(prev)
        for (const p of patches) {
          next.set(p.itemId, {
            startDate: p.startDate,
            endDate: p.endDate,
            sourceTaskId: p.sourceTaskId,
          })
        }
        return next
      })
    },
    [snapshot]
  )

  const undo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack
      const prev = stack[stack.length - 1]
      setDraft(prev)
      return stack.slice(0, -1)
    })
  }, [])

  const clear = useCallback(() => {
    setDraft(new Map())
    setUndoStack([])
  }, [])

  const dirtyPatches = useCallback((): TimelineDraftPatch[] => {
    return [...draft.entries()].map(([itemId, v]) => ({
      itemId,
      sourceTaskId: v.sourceTaskId,
      startDate: v.startDate,
      endDate: v.endDate,
    }))
  }, [draft])

  const scheduleByItemId = useCallback(
    (itemId: string): { startDate: string; endDate: string } | null => {
      const v = draft.get(itemId)
      return v ? { startDate: v.startDate, endDate: v.endDate } : null
    },
    [draft]
  )

  return {
    draft,
    dirty: draft.size > 0,
    canUndo: undoStack.length > 0,
    setSchedule,
    setSchedules,
    undo,
    clear,
    dirtyPatches,
    scheduleByItemId,
  }
}
