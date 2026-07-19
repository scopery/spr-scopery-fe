'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import * as playgroundApi from '../../infrastructure/api/playground.api'
import type {
  PlaygroundDirectRunPayload,
  PlaygroundPromptPreviewResult,
  PlaygroundRunPayload,
  PlaygroundRunResult,
} from '../../domain/model/playground'

export function usePlaygroundActions() {
  const [running, setRunning] = useState(false)
  const [lastRun, setLastRun] = useState<PlaygroundRunResult | null>(null)
  const [preview, setPreview] = useState<PlaygroundPromptPreviewResult | null>(null)

  const runEventConfig = useCallback(
    async (eventConfigId: string, body: PlaygroundRunPayload) => {
      setRunning(true)
      try {
        const result = await playgroundApi.runPlaygroundEventConfig(eventConfigId, body)
        setLastRun(result)
        toast.success(`Playground run ${result.status}`)
        return result
      } finally {
        setRunning(false)
      }
    },
    []
  )

  const runDirect = useCallback(async (body: PlaygroundDirectRunPayload) => {
    setRunning(true)
    try {
      const result = await playgroundApi.runPlaygroundDirect(body)
      setLastRun(result)
      toast.success(`Playground run ${result.status}`)
      return result
    } finally {
      setRunning(false)
    }
  }, [])

  const previewPrompt = useCallback(
    async (promptVersionId: string, inputVariables?: Record<string, unknown>) => {
      setRunning(true)
      try {
        const result = await playgroundApi.previewPlaygroundPrompt({
          promptVersionId,
          inputVariables,
        })
        setPreview(result)
        if (result.missingVariables?.length) {
          toast.message(`Missing variables: ${result.missingVariables.join(', ')}`)
        } else {
          toast.success('Prompt preview ready')
        }
        return result
      } finally {
        setRunning(false)
      }
    },
    []
  )

  return {
    running,
    lastRun,
    preview,
    runEventConfig,
    runDirect,
    previewPrompt,
    setLastRun,
    setPreview,
  }
}
