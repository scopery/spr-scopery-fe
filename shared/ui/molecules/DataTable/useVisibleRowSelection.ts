'use client'

import { useEffect, useState } from 'react'

/**
 * Multi-select for the current visible/filtered row keys.
 * Starts empty — no default select-all. When the visible set changes
 * (filter / page), drops keys that are no longer visible.
 */
export function useVisibleRowSelection(visibleKeys: readonly string[]) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set())
  const signature = visibleKeys.join('\u0001')

  useEffect(() => {
    const visible = new Set(visibleKeys)
    setSelectedKeys((prev) => {
      if (prev.size === 0) return prev
      let changed = false
      const next = new Set<string>()
      for (const key of prev) {
        if (visible.has(key)) next.add(key)
        else changed = true
      }
      return changed ? next : prev
    })
    // Intentionally keyed by signature so filter/page changes prune selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  return [selectedKeys, setSelectedKeys] as const
}
