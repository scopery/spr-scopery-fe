'use client'

import { useEffect, useRef } from 'react'

/**
 * Browser-default Ctrl/Cmd+S is "Save page". Intercept and run document save instead.
 * Ignores key-repeat and overlapping presses until `enabled` flips back on after a save.
 */
export function useModSSaveShortcut(onSave: () => void, enabled = true) {
  const onSaveRef = useRef(onSave)
  const enabledRef = useRef(enabled)
  const busyRef = useRef(false)

  onSaveRef.current = onSave
  enabledRef.current = enabled

  useEffect(() => {
    // Parent disables while `saving`; when save finishes and enabled returns, unlock.
    if (enabled) busyRef.current = false
  }, [enabled])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.altKey || event.shiftKey) return
      if (event.key.toLowerCase() !== 's') return

      // Always block the browser "Save page" dialog on this chord.
      event.preventDefault()
      event.stopPropagation()

      if (!enabledRef.current) return
      if (event.repeat) return
      if (busyRef.current) return

      busyRef.current = true
      onSaveRef.current()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
