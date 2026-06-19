'use client'

import { useEffect, useState } from 'react'
import { subscribeGlobalLoading } from '@/shared/lib/globalLoading'
import { Progress } from '@/shared/ui'

const SHOW_DELAY_MS = 150

export function GlobalLoadingBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let showTimer: ReturnType<typeof setTimeout> | undefined

    return subscribeGlobalLoading((count) => {
      if (count > 0) {
        showTimer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
        return
      }

      if (showTimer) clearTimeout(showTimer)
      setVisible(false)
    })
  }, [])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999]"
      role="progressbar"
      aria-busy="true"
      aria-label="Loading"
    >
      <Progress indeterminate size="sm" tone="primary" />
    </div>
  )
}
