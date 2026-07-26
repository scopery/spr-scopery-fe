'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { Button, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { knowledgeApi, type IndexJob, type DocumentIndexStatus } from '@/modules/knowledge'

function jobIdOf(job: IndexJob): string | null {
  return job.jobId ?? job.id ?? null
}

function statusOf(job: IndexJob): string {
  return job.jobStatus ?? job.status ?? 'UNKNOWN'
}

export function DocumentIndexingPanel({
  workspaceId,
  projectId,
  documentId,
}: {
  workspaceId: string
  projectId: string
  documentId?: string
}) {
  const [lastJob, setLastJob] = useState<IndexJob | null>(null)
  const [busy, setBusy] = useState(false)
  const [polling, setPolling] = useState(false)
  const [docStatus, setDocStatus] = useState<DocumentIndexStatus | null>(null)
  const [loadingDocStatus, setLoadingDocStatus] = useState(false)

  const loadDocStatus = useCallback(async () => {
    if (!documentId || !projectId) return
    setLoadingDocStatus(true)
    try {
      const status = await knowledgeApi.getDocumentIndexStatus(projectId, documentId)
      setDocStatus(status)
    } catch {
      // non-critical
    } finally {
      setLoadingDocStatus(false)
    }
  }, [projectId, documentId])

  useEffect(() => {
    void loadDocStatus()
  }, [loadDocStatus])

  const refreshJob = useCallback(async (id: string) => {
    try {
      const job = await knowledgeApi.getIndexingJob(id)
      setLastJob(job)
      return job
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      return null
    }
  }, [])

  useEffect(() => {
    const id = lastJob ? jobIdOf(lastJob) : null
    const status = lastJob ? statusOf(lastJob) : ''
    if (!id || !['RUNNING', 'QUEUED', 'PENDING'].includes(status)) return

    setPolling(true)
    const t = setInterval(() => {
      void refreshJob(id).then((job) => {
        if (!job) return
        const s = statusOf(job)
        if (!['RUNNING', 'QUEUED', 'PENDING'].includes(s)) {
          setPolling(false)
          void loadDocStatus()
        }
      })
    }, 2500)
    return () => {
      clearInterval(t)
      setPolling(false)
    }
  }, [lastJob, refreshJob, loadDocStatus])

  const reindexDocument = useCallback(async () => {
    if (!documentId) return
    setBusy(true)
    try {
      const status = await knowledgeApi.reindexDocument(projectId, documentId)
      setDocStatus(status)
      toast.success('Document reindexed')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setBusy(false)
    }
  }, [projectId, documentId])

  const reindexProject = useCallback(async () => {
    setBusy(true)
    try {
      const job = await knowledgeApi.startProjectReindex(projectId)
      setLastJob(job)
      toast.success('Project reindex started')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setBusy(false)
    }
  }, [projectId])

  const reindexWorkspace = useCallback(async () => {
    setBusy(true)
    try {
      const job = await knowledgeApi.startWorkspaceReindex(workspaceId)
      setLastJob(job)
      toast.success('Workspace reindex started')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setBusy(false)
    }
  }, [workspaceId])

  return (
    <Stack direction="vertical" spacing="sm" className="p-sm">
      {documentId ? (
        <div className="rounded border border-neutral-200 p-sm">
          <div className="mb-xs flex items-center justify-between">
            <Typography variant="small" weight="medium">
              This document
            </Typography>
            <button
              onClick={() => void loadDocStatus()}
              disabled={loadingDocStatus || busy}
              className="text-neutral-400 hover:text-neutral-600 disabled:opacity-40"
              title="Refresh status"
            >
              <RefreshCw className={`h-3 w-3 ${loadingDocStatus ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {docStatus ? (
            <div className="flex items-center gap-1.5">
              {docStatus.indexed ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-neutral-400" />
              )}
              <Typography variant="caption" tone={docStatus.indexed ? 'default' : 'muted'}>
                {docStatus.indexed
                  ? `Indexed · ${docStatus.totalChunks} chunk${docStatus.totalChunks !== 1 ? 's' : ''}`
                  : docStatus.totalChunks > 0
                    ? `Partial · ${docStatus.embeddedChunks}/${docStatus.totalChunks} chunks`
                    : 'Not indexed'}
              </Typography>
            </div>
          ) : (
            <Typography variant="caption" tone="muted">
              {loadingDocStatus ? 'Checking…' : '—'}
            </Typography>
          )}

          <div className="mt-xs">
            <Button size="sm" disabled={busy} onClick={() => void reindexDocument()}>
              Reindex this document
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded border border-neutral-200 p-sm">
        <Typography variant="small" weight="medium" className="mb-xs block">
          Knowledge indexing
        </Typography>
        <Typography variant="caption" tone="muted" className="mb-sm block">
          Trigger reindex so published content appears in knowledge search.
        </Typography>

        <div className="flex flex-wrap gap-xs">
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void reindexProject()}>
            Reindex project
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void reindexWorkspace()}>
            Reindex workspace
          </Button>
          {lastJob && jobIdOf(lastJob) ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy || polling}
              onClick={() => void refreshJob(jobIdOf(lastJob)!)}
            >
              Refresh job
            </Button>
          ) : null}
        </div>

        {lastJob ? (
          <Stack direction="vertical" spacing="none" className="mt-xs">
            <Typography variant="small" weight="medium">
              {statusOf(lastJob)}
              {polling ? ' · polling…' : ''}
            </Typography>
            <Typography variant="caption" tone="muted">
              {lastJob.jobType ?? 'job'} · {jobIdOf(lastJob)?.slice(0, 8)}…
              {lastJob.processedCount != null
                ? ` · ${lastJob.successCount ?? 0}/${lastJob.processedCount} ok`
                : ''}
              {lastJob.failureCount ? ` · ${lastJob.failureCount} failed` : ''}
            </Typography>
          </Stack>
        ) : null}
      </div>
    </Stack>
  )
}
