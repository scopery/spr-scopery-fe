'use client'

import { useCallback, useEffect, useState } from 'react'
import { validateScreenMediaFile } from '../../domain/rules/screen-media.rules'
import { ScreenMediaMessages } from '../../domain/messages/screen-media.messages'

export function useSpecImageUpload(initialUrl: string | null | undefined, resetKey?: string) {
  const [imageUrl, setImageUrl] = useState<string | null>(initialUrl ?? null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setImageUrl(initialUrl ?? null)
    setProgress(null)
    setError(null)
    setUploading(false)
  }, [initialUrl, resetKey])

  const upload = useCallback(
    async (file: File, run: (file: File, onProgress: (percent: number) => void) => Promise<string>) => {
      const invalid = validateScreenMediaFile(file)
      if (invalid) {
        setError(invalid)
        return null
      }
      setUploading(true)
      setError(null)
      setProgress(0)
      try {
        const url = await run(file, setProgress)
        setImageUrl(url)
        return url
      } catch (err) {
        setError(err instanceof Error ? err.message : ScreenMediaMessages.UPLOAD_FAILED)
        return null
      } finally {
        setUploading(false)
        setProgress(null)
      }
    },
    []
  )

  return { imageUrl, setImageUrl, progress, error, uploading, upload }
}
