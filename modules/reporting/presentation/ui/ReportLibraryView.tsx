'use client'

import { Button, LongRunningJobPanel, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useReportLibrary } from '../hooks/useReportLibrary'

export function ReportLibraryView() {
  const {
    definitions,
    exports,
    activeRun,
    loading,
    error,
    actionError,
    runReport,
    refreshRun,
    exportActiveRun,
    cancelExport,
    openDownload,
    refreshExports,
  } = useReportLibrary()

  if (loading) return <PageSkeleton variant="list" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md">
      <Typography as="h1" size="md" weight="medium">
        Report Library
      </Typography>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}

      {activeRun ? (
        <Stack direction="vertical" spacing="sm" className="border border-neutral-200 p-md">
          <LongRunningJobPanel
            job={{
              jobId: activeRun.id,
              jobType: activeRun.reportCode,
              status: activeRun.status,
            }}
            label={`Run ${activeRun.reportCode}`}
          />
          <div className="flex flex-wrap gap-sm">
            <Button size="sm" variant="outline" onClick={() => void refreshRun()}>
              Refresh status
            </Button>
            <Button
              size="sm"
              disabled={activeRun.status !== 'COMPLETED' && activeRun.status !== 'SUCCEEDED'}
              onClick={() => void exportActiveRun('CSV')}
            >
              Export CSV
            </Button>
          </div>
        </Stack>
      ) : null}

      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {definitions.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-md p-md">
            <div>
              <Typography variant="small" weight="medium">
                {d.name}
              </Typography>
              <Typography variant="caption" tone="muted">
                {d.code}
              </Typography>
            </div>
            <Button size="sm" variant="outline" onClick={() => void runReport(d.code)}>
              Run
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-md">
        <Typography variant="h4">Export jobs</Typography>
        <Button size="sm" variant="ghost" onClick={() => void refreshExports()}>
          Refresh
        </Button>
      </div>
      {exports.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No export jobs yet.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {exports.map((job) => (
            <li key={job.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {job.fileName ?? job.reportCode ?? '—'}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {[job.format, job.status].filter(Boolean).join(' · ')}
                </Typography>
              </div>
              <div className="flex gap-xs">
                {job.status === 'COMPLETED' || job.status === 'SUCCEEDED' ? (
                  <Button size="sm" variant="outline" onClick={() => openDownload(job.id)}>
                    Download
                  </Button>
                ) : null}
                {job.status === 'QUEUED' || job.status === 'PROCESSING' ? (
                  <Button size="sm" variant="ghost" onClick={() => void cancelExport(job.id)}>
                    Cancel
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
