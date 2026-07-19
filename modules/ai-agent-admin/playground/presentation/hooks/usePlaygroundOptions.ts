'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as playgroundApi from '../../infrastructure/api/playground.api'
import type { PlaygroundOptions } from '../../domain/model/playground'

export function usePlaygroundOptions(enabled: boolean) {
  const [options, setOptions] = useState<PlaygroundOptions | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      setOptions(await playgroundApi.getPlaygroundOptions())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load playground options')
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void load()
  }, [load])

  return { options, loading, error, refetch: load }
}
