'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { knowledgeApi, type IndexJob } from '@/modules/knowledge'

function jobIdOf(job: IndexJob): string | null {
  return job.jobId ?? job.id ?? null
}

function statusOf(job: IndexJob): string {
  return job.jobStatus ?? job.status ?? 'UNKNOWN'
}

export function DocumentIndexingPanel({
  workspaceId,
  projectId,
}: {
  workspaceId: string
  projectId: string
}) {
  const [lastJob, setLastJob] = useState<IndexJob | null>(null)
  const [busy, setBusy] = useState(false)
  const [polling, setPolling] = useState(false)

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
        }
      })
    }, 2500)
    return () => {
      clearInterval(t)
      setPolling(false)
    }
  }, [lastJob, refreshJob])

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
    <Stack direction="vertical" spacing="sm" className="border border-neutral-200 p-sm">
      <Typography variant="h4">Knowledge indexing</Typography>
      <Typography variant="caption" tone="muted">
        Trigger reindex so published native content can appear in knowledge search. Publish success
        does not guarantee indexing success.
      </Typography>

      <div className="flex flex-wrap gap-xs">
        <Button size="sm" disabled={busy} onClick={() => void reindexProject()}>
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
        <Stack direction="vertical" spacing="none">
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
      ) : (
        <Typography variant="caption" tone="muted">
          No job started in this session yet.
        </Typography>
      )}
    </Stack>
  )
}
