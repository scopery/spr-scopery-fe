'use client'

import {
  useEffect,
  useState
} from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import {
  Button,
  Input,
  LongRunningJobPanel,
  PageSkeleton,
  Progress,
  Stack,
  Typography
} from '@/shared/ui'

import { useDocumentVersionUpload } from '../hooks/useDocumentVersionUpload'

/**
 * Version upload + generated document jobs panel.
 * Embeddable from document viewer or hub detail.
 */
export function DocumentVersionUploadPanel({
  projectId: projectIdProp,
  documentId: documentIdProp,
}: {
  projectId?: string
  documentId?: string
}) {
  const params = useParams<{ workspaceId?: string; projectId?: string; documentId?: string }>()
  const search = useSearchParams()
  const projectId =
    projectIdProp ?? params.projectId ?? search.get('projectId') ?? null
  const documentId = documentIdProp ?? params.documentId ?? search.get('documentId') ?? null
  const [templateId, setTemplateId] = useState('')

  const {
    versions,
    jobs,
    uploading,
    progress,
    error,
    upload,
    download,
    queueGeneration,
    refreshVersions,
    refreshJobs,
  } = useDocumentVersionUpload(projectId, documentId)

  useEffect(() => {
    void refreshVersions()
    void refreshJobs()
  }, [refreshVersions, refreshJobs])

  if (!projectId) {
    return (
      <Typography tone="muted" className="p-md">
        Select a project-scoped document to manage versions and generation jobs.
      </Typography>
    )
  }

  return (
    <Stack direction="vertical" spacing="md" className="p-md">
      <Typography variant="h4">Versions & generation</Typography>
      {error ? <Typography tone="error">{error}</Typography> : null}

      <div>
        <label className="inline-flex cursor-pointer items-center gap-sm text-sm">
          <span className="rounded-none border border-neutral-300 px-sm py-xs">
            {uploading ? 'Uploading…' : 'Upload new version'}
          </span>
          <input
            type="file"
            className="sr-only"
            disabled={uploading || !documentId}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) void upload(file)
              e.target.value = ''
            }}
          />
        </label>
        {uploading && progress != null ? (
          <Progress value={progress} size="sm" className="mt-sm" />
        ) : null}
      </div>

      {!documentId ? (
        <Typography tone="muted" variant="caption">
          Open a document to upload versions.
        </Typography>
      ) : versions.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No versions yet.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {versions.map((v) => (
            <li key={v.id} className="flex items-center justify-between gap-md p-sm text-sm">
              <span>
                v{v.versionNumber} · {v.fileName}
              </span>
              <span className="flex items-center gap-sm">
                <span className="text-neutral-500">{v.status}</span>
                {v.status === 'AVAILABLE' ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void download(v.id, v.fileName)}
                  >
                    Download
                  </Button>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Generated jobs</Typography>
      <div className="flex flex-wrap gap-xs">
        <Input
          size="sm"
          value={templateId}
          onChange={(e) => setTemplateId(e.target.value)}
          placeholder="Template ID"
          aria-label="Document template ID"
        />
        <Button
          size="sm"
          disabled={!templateId.trim()}
          onClick={() => {
            void queueGeneration(templateId.trim()).then((job) => {
              if (job) setTemplateId('')
            })
          }}
        >
          Queue generation
        </Button>
        <Button size="sm" variant="ghost" onClick={() => void refreshJobs()}>
          Refresh
        </Button>
      </div>
      {jobs.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No generation jobs.
        </Typography>
      ) : (
        <Stack direction="vertical" spacing="sm">
          {jobs.map((job) => (
            <LongRunningJobPanel
              key={job.id}
              job={{
                jobId: job.id,
                jobType: job.templateId ?? 'GENERATED_DOCUMENT',
                status: job.status,
              }}
            />
          ))}
        </Stack>
      )}
    </Stack>
  )
}

export function DocumentGeneratedJobsView() {
  const params = useParams<{ projectId?: string }>()
  if (!params.projectId) return <PageSkeleton variant="form" className="p-lg" />
  return <DocumentVersionUploadPanel projectId={params.projectId} />
}
