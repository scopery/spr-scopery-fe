'use client'

import { useEffect, useRef, useState } from 'react'
import {
  clearLocalDraft,
  readLocalDraft,
  writeLocalDraft,
  type LocalDraftEnvelope,
} from '@/shared/lib/localDraft'

const DEFAULT_DEBOUNCE_MS = 600

/**
 * Debounced localStorage draft sync.
 * - Hydrates once when `storageKey` becomes available (if a draft exists).
 * - Writes `data` after debounce while `enabled`.
 * - Call `clearDraft()` after a successful save to BE.
 */
export function useDebouncedLocalDraft<T extends object>(options: {
  storageKey: string | null
  data: T
  enabled: boolean
  debounceMs?: number
  /** Return true if draft should replace current form state. */
  shouldHydrate?: (draft: T) => boolean
  onHydrate?: (draft: T, envelope: LocalDraftEnvelope<T>) => void
}) {
  const {
    storageKey,
    data,
    enabled,
    debounceMs = DEFAULT_DEBOUNCE_MS,
    shouldHydrate,
    onHydrate,
  } = options

  const [draftHint, setDraftHint] = useState<string | null>(null)
  const hydratedKeyRef = useRef<string | null>(null)
  const skipNextWriteRef = useRef(false)
  const onHydrateRef = useRef(onHydrate)
  const shouldHydrateRef = useRef(shouldHydrate)
  onHydrateRef.current = onHydrate
  shouldHydrateRef.current = shouldHydrate

  // Allow re-hydrate when the editor reopens
  useEffect(() => {
    if (!enabled || !storageKey) {
      hydratedKeyRef.current = null
    }
  }, [enabled, storageKey])

  // Hydrate once per storage key — after parent's initial state sync (setTimeout 0)
  useEffect(() => {
    if (!storageKey || !enabled) return
    if (hydratedKeyRef.current === storageKey) return
    const timer = window.setTimeout(() => {
      if (hydratedKeyRef.current === storageKey) return
      hydratedKeyRef.current = storageKey
      const envelope = readLocalDraft<T>(storageKey)
      if (!envelope) {
        setDraftHint(null)
        return
      }
      const ok = shouldHydrateRef.current
        ? shouldHydrateRef.current(envelope.data)
        : true
      if (!ok) {
        setDraftHint(null)
        return
      }
      skipNextWriteRef.current = true
      onHydrateRef.current?.(envelope.data, envelope)
      const when = new Date(envelope.updatedAt)
      setDraftHint(
        Number.isNaN(when.getTime())
          ? 'Draft restored'
          : `Draft restored · ${when.toLocaleString()}`
      )
    }, 0)
    return () => window.clearTimeout(timer)
  }, [storageKey, enabled])

  // Debounced write
  useEffect(() => {
    if (!storageKey || !enabled) return
    if (skipNextWriteRef.current) {
      skipNextWriteRef.current = false
      return
    }
    const timer = window.setTimeout(() => {
      writeLocalDraft(storageKey, data)
      setDraftHint((prev) => prev ?? 'Draft saved locally')
    }, debounceMs)
    return () => window.clearTimeout(timer)
  }, [storageKey, data, enabled, debounceMs])

  const clearDraft = () => {
    if (storageKey) clearLocalDraft(storageKey)
    setDraftHint(null)
  }

  return { draftHint, clearDraft, setDraftHint }
}
