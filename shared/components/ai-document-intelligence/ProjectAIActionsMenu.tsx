'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button, Modal, Select } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import * as aiDocService from '@/services/ai-document-intelligence.service'
import * as sessionService from '@/services/session.service'
import { AIPreviewDialog } from './AIPreviewDialog'
import { ApiError } from '@/types/api'
import { toast } from 'sonner'

interface ProjectAIActionsMenuProps {
  orgId: string
  projectId: string
  permissions: {
    canGenerateProjectBrief: boolean
    canSummarizeProjectDocuments: boolean
    canSaveQASummary: boolean
    canSaveClarityReport: boolean
    canSaveReadinessReport: boolean
  }
}

export function ProjectAIActionsMenu({ orgId, projectId, permissions }: ProjectAIActionsMenuProps) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [sessionDialog, setSessionDialog] = useState<'qa' | 'clarity' | 'readiness' | null>(null)
  const [sessions, setSessions] = useState<sessionService.SessionListItem[]>([])
  const [sessionId, setSessionId] = useState('')
  const [loading, setLoading] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [preview, setPreview] = useState<aiDocService.AIStructuredPreview | null>(null)
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [warnings, setWarnings] = useState<string[]>([])
  const [previewOrigin, setPreviewOrigin] = useState<'brief' | 'summary'>('brief')

  const hasAny =
    permissions.canGenerateProjectBrief ||
    permissions.canSummarizeProjectDocuments ||
    permissions.canSaveQASummary ||
    permissions.canSaveClarityReport ||
    permissions.canSaveReadinessReport

  useEffect(() => {
    if (!sessionDialog) return
    sessionService
      .listSessions(orgId, projectId, { limit: 50 })
      .then((res) => setSessions(res.items))
      .catch(() => setSessions([]))
  }, [sessionDialog, orgId, projectId])

  if (!hasAny) return null

  const handleError = (err: unknown) => {
    const msg =
      err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'AI action failed'
    toast.error(msg)
  }

  const runProjectBrief = async () => {
    setMenuOpen(false)
    setLoading(true)
    setPreviewOpen(true)
    setPreview(null)
    try {
      const res = await aiDocService.generateProjectBrief(orgId, projectId, { save: false })
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
      const res = await aiDocService.summarizeProjectDocuments(orgId, projectId, { save: false })
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
      const res = await aiDocService.saveAIPreviewAsDocument(orgId, {
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
      let res: aiDocService.AIDocumentCreatedResponse
      if (sessionDialog === 'qa') {
        res = await aiDocService.saveQASummary(orgId, projectId, { session_id: sessionId })
      } else if (sessionDialog === 'clarity') {
        res = await aiDocService.saveClarityReport(orgId, projectId, { session_id: sessionId })
      } else {
        res = await aiDocService.saveReadinessReport(orgId, projectId, { session_id: sessionId })
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

  return (
    <>
      <Button variant="outline" size="sm" icon={<Sparkles size={16} />} onClick={() => setMenuOpen(true)}>
        AI actions
      </Button>

      <Modal open={menuOpen} onClose={() => setMenuOpen(false)} title="AI document actions" size="sm">
        <div className="flex flex-col gap-2">
          {permissions.canGenerateProjectBrief && (
            <Button variant="ghost" className="justify-start" onClick={runProjectBrief}>
              Generate project brief
            </Button>
          )}
          {permissions.canSummarizeProjectDocuments && (
            <Button variant="ghost" className="justify-start" onClick={runSummarizeDocuments}>
              Summarize project documents
            </Button>
          )}
          {permissions.canSaveQASummary && (
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                setMenuOpen(false)
                setSessionDialog('qa')
              }}
            >
              Save QA summary as document
            </Button>
          )}
          {permissions.canSaveClarityReport && (
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                setMenuOpen(false)
                setSessionDialog('clarity')
              }}
            >
              Save clarity report as document
            </Button>
          )}
          {permissions.canSaveReadinessReport && (
            <Button
              variant="ghost"
              className="justify-start"
              onClick={() => {
                setMenuOpen(false)
                setSessionDialog('readiness')
              }}
            >
              Save readiness report as document
            </Button>
          )}
        </div>
      </Modal>

      <Modal
        open={Boolean(sessionDialog)}
        onClose={() => setSessionDialog(null)}
        title={
          sessionDialog === 'qa'
            ? 'Save QA summary'
            : sessionDialog === 'clarity'
              ? 'Save clarity report'
              : 'Save readiness report'
        }
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Session"
            value={sessionId}
            onValueChange={setSessionId}
            options={[
              { value: '', label: 'Select a session' },
              ...sessions.map((s) => ({ value: s.id, label: `${s.name} (${s.status})` })),
            ]}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSessionDialog(null)}>
              Cancel
            </Button>
            <Button variant="primary" loading={loading} disabled={!sessionId} onClick={runSessionReport}>
              Create document
            </Button>
          </div>
        </div>
      </Modal>

      <AIPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        preview={preview}
        warnings={warnings}
        loading={loading && !preview}
        onSave={generationId ? savePreview : undefined}
      />
    </>
  )
}
