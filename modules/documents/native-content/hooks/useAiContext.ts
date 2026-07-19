'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as aiContextApi from '../api/ai-context.api'
import type { AiContextAuditEntry, AiContextResolutionResult } from '../model/intelligence'

export function useAiContext(projectId: string, documentId: string) {
  const [result, setResult] = useState<AiContextResolutionResult | null>(null)
  const [audit, setAudit] = useState<AiContextAuditEntry[]>([])
  const [resolving, setResolving] = useState(false)
  const [loadingAudit, setLoadingAudit] = useState(false)

  const resolve = useCallback(async () => {
    setResolving(true)
    try {
      const res = await aiContextApi.resolveAiContext({ projectId, documentId })
      setResult(res)
      toast.success(`Resolved ${res.tokenCount} tokens · ${res.blockCount} blocks`)
      return res
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      return null
    } finally {
      setResolving(false)
    }
  }, [projectId, documentId])

  const loadAudit = useCallback(async () => {
    setLoadingAudit(true)
    try {
      const page = await aiContextApi.listAiContextAudit(documentId)
      const items = page.content ?? page.items ?? []
      setAudit(items)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoadingAudit(false)
    }
  }, [documentId])

  return { result, audit, resolving, loadingAudit, resolve, loadAudit }
}
