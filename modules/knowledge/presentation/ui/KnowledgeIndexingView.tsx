'use client'

import { useParams } from 'next/navigation'
import {
  Button,
  Input,
  LongRunningJobPanel,
  PageSkeleton,
  Stack,
  Typography
} from '@/shared/ui'
import { useKnowledgeIndexing } from '../hooks/useKnowledgeIndexing'

export function KnowledgeIndexingView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    jobs,
    classifications,
    sourceId,
    setSourceId,
    sourceDetail,
    chunks,
    loading,
    error,
    actionError,
    refetch,
    startReindex,
    loadSource,
    reindexSource,
  } = useKnowledgeIndexing(workspaceId)

  if (loading && jobs.length === 0) return <PageSkeleton variant="list" className="p-lg" />

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Knowledge Indexing Center</Typography>
      <Typography tone="muted">
        Monitor reindex jobs. Requires X-Workspace-Id (injected via knowledge headers).
      </Typography>
      {error ? <Typography tone="error">{error}</Typography> : null}
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}
      <div className="flex flex-wrap gap-sm">
        <Button size="sm" onClick={() => void startReindex()}>
          Start workspace reindex
        </Button>
        <Button size="sm" variant="outline" onClick={() => void refetch()}>
          Refresh
        </Button>
      </div>
      {jobs.length === 0 ? (
        <Typography tone="muted">No indexing jobs.</Typography>
      ) : (
        jobs.map((job) => {
          const id = job.jobId ?? job.id ?? 'unknown'
          return (
            <LongRunningJobPanel
              key={id}
              job={{
                jobId: id,
                jobType: job.jobType ?? 'KNOWLEDGE_REINDEX',
                status: job.jobStatus ?? job.status ?? 'UNKNOWN',
              }}
            />
          )
        })
      )}

      <Typography variant="h4">Document classifications</Typography>
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {classifications.map((c) => (
          <li key={c.id} className="p-md text-sm">
            {[c.code, c.name].filter(Boolean).join(' · ')}
          </li>
        ))}
      </ul>

      <Typography variant="h4">Source inspector</Typography>
      <div className="flex flex-wrap gap-sm">
        <Input
          value={sourceId}
          onChange={(e) => setSourceId(e.target.value)}
          placeholder="Source ID"
          aria-label="Knowledge source ID"
        />
        <Button size="sm" variant="outline" onClick={() => void loadSource(sourceId)}>
          Load
        </Button>
        <Button size="sm" disabled={!sourceDetail} onClick={() => void reindexSource()}>
          Reindex source
        </Button>
      </div>
      {sourceDetail ? (
        <Typography variant="caption" tone="muted">
          {[sourceDetail.title ?? sourceDetail.id, sourceDetail.status].filter(Boolean).join(' · ')}
          {chunks.length ? ` · ${chunks.length} chunks` : ''}
        </Typography>
      ) : null}
    </Stack>
  )
}
