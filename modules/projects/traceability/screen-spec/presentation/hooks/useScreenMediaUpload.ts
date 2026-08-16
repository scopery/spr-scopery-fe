'use client'

import { useCallback } from 'react'
import * as mediaApi from '../../infrastructure/api/screen-media.api'
import { useSpecImageUpload } from './useSpecImageUpload'

export function useScreenMockupUpload(
  workspaceId: string,
  screenId: string,
  initialUrl?: string | null
) {
  const { upload, ...state } = useSpecImageUpload(initialUrl)
  const onFile = useCallback(
    (file: File) => {
      void upload(file, async (next, onProgress) => {
        const result = await mediaApi.uploadScreenMockup(workspaceId, screenId, next, { onProgress })
        return result.mockupUrl
      })
    },
    [screenId, upload, workspaceId]
  )
  return { ...state, upload, onFile }
}

export function useComponentScreenshotUpload(
  workspaceId: string,
  componentId: string,
  initialUrl?: string | null
) {
  const { upload, ...state } = useSpecImageUpload(initialUrl)
  const onFile = useCallback(
    (file: File) => {
      void upload(file, async (next, onProgress) => {
        const result = await mediaApi.uploadComponentScreenshot(workspaceId, componentId, next, {
          onProgress,
        })
        return result.screenshotUrl
      })
    },
    [componentId, upload, workspaceId]
  )
  return { ...state, upload, onFile }
}
