'use client'

import { useEffect, useState } from 'react'

/**
 * Multi-select that defaults to every visible row key.
 * Re-selects all when the visible set changes (filter / page).
 * Pass the current page/filtered keys — not the full unfiltered list.
 */
export function useVisibleRowSelection(visibleKeys: readonly string[]) {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(
    () => new Set(visibleKeys)
  )
  const signature = visibleKeys.join('\u0001')

  useEffect(() => {
    setSelectedKeys(new Set(visibleKeys))
    // Intentionally keyed by signature so content changes re-default selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  return [selectedKeys, setSelectedKeys] as const
}
