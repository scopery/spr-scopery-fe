'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ROUTES } from '@/constants/routes'
import { sessionsApi } from '@/modules/sessions'
import type { SessionListItem } from '@/modules/sessions'
import * as aiDocumentIntelligenceApi from '@/modules/ai-document-intelligence/document-ai/api/ai-document-intelligence.api'
import type {
  AIDocumentCreatedResponse,
  AIStructuredPreview,
  ProjectAIActionsMenuProps,
} from '@/modules/ai-document-intelligence/document-ai/model/ai-document-intelligence'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'

export function useProjectAIActionsMenu({
  orgId,
  projectId,
}: Pick<ProjectAIActionsMenuProps, 'orgId' | 'projectId'>) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sessionDialog, setSessionDialog] = useState<'qa' | 'clarity' | 'readiness' | null>(null)
  const [sessions, setSessions] = useState<SessionListItem[]>([])
  const [sessionId, setSessionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [preview, setPreview] = useState<AIStructuredPreview | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [previewOrigin, setPreviewOrigin] = useState<'brief' | 'summary'>('brief')

  useEffect(() => {
    if (!sessionDialog) return
    sessionsApi
      .listSessions(orgId, projectId, { limit: 50 })
      .then((res) => setSessions(res.items))
      .catch(() => setSessions([]))
  }, [sessionDialog, orgId, projectId])

  const handleError = (err: unknown) => {
    const msg =
      err instanceof ApiError
        ? err.problem.detail
        : err instanceof Error
          ? err.message
          : 'AI action failed'
    toast.error(msg)
  }

  const runProjectBrief = async () => {
    setMenuOpen(false)
    setLoading(true)
    setPreviewOpen(true)
    setPreview(null)
    try {
      const res = await aiDocumentIntelligenceApi.generateProjectBrief(orgId, projectId, {
        save: false,
      })
      if ('preview' in res) {
        setPreview(res.preview)
        setGenerationId(res.generationId)
        setWarnings(res.warnings ?? [])
        setPreviewOrigin('brief')
      }
    } catch (err) {
      setPreviewOpen(false)
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const runSummarizeDocuments = async () => {
    setMenuOpen(false)
    setLoading(true)
    setPreviewOpen(true)
    setPreview(null)
    try {
      const res = await aiDocumentIntelligenceApi.summarizeProjectDocuments(orgId, projectId, {
        save: false,
      })
      if ('preview' in res) {
        setPreview(res.preview)
        setGenerationId(res.generationId)
        setWarnings(res.warnings ?? [])
        setPreviewOrigin('summary')
      }
    } catch (err) {
      setPreviewOpen(false)
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const savePreview = async () => {
    if (!preview || !generationId) {
      toast.error('Nothing to save')
      return
    }
    setLoading(true)
    try {
      const res = await aiDocumentIntelligenceApi.saveAIPreviewAsDocument(orgId, {
        generation_id: generationId,
        project_id: projectId,
        title: preview.title,
        sections: preview.sections,
        origin_type: previewOrigin === 'brief' ? 'project_summary' : 'document_summary',
        document_type: previewOrigin === 'brief' ? 'project_doc' : 'summary',
      })
      toast.success('Document created')
      setPreviewOpen(false)
      router.push(ROUTES.org.document(orgId, res.document.id, projectId))
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const runSessionReport = async () => {
    if (!sessionId || !sessionDialog) return
    setLoading(true)
    try {
      let res: AIDocumentCreatedResponse
      if (sessionDialog === 'qa') {
        res = await aiDocumentIntelligenceApi.saveQASummary(orgId, projectId, {
          session_id: sessionId,
        })
      } else if (sessionDialog === 'clarity') {
        res = await aiDocumentIntelligenceApi.saveClarityReport(orgId, projectId, {
          session_id: sessionId,
        })
      } else {
        res = await aiDocumentIntelligenceApi.saveReadinessReport(orgId, projectId, {
          session_id: sessionId,
        })
      }
      toast.success('Document created')
      setSessionDialog(null)
      router.push(ROUTES.org.document(orgId, res.document.id, projectId))
    } catch (err) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  return {
    menuOpen,
    sessionDialog,
    sessions,
    sessionId,
    loading,
    previewOpen,
    preview,
    generationId,
    warnings,
    setMenuOpen,
    setSessionDialog,
    setSessionId,
    setPreviewOpen,
    runProjectBrief,
    runSummarizeDocuments,
    savePreview,
    runSessionReport,
  }
}
