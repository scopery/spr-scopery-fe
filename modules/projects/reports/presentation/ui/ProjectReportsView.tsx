'use client'

import { useParams } from 'next/navigation'
import { Button, PageSkeleton, Select, Typography } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '../../../project/hooks/useProject'
import { useProjectReports } from '../hooks/useProjectReports'
import { ProjectReportResultTable } from './ProjectReportResultTable'
import type { ProjectReportKey } from '../../domain/model/reports'
import { PROJECT_REPORT_OPTIONS } from '../../domain/rules/reports.rules'

export function ProjectReportsView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const { project, loading: projectLoading } = useProject(workspaceId, projectId)
  const { reportKey, setReportKey, result, loading, error, forbidden, refetch } =
    useProjectReports(projectId)

  if (projectLoading && !project) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to project reports</Typography>
      </div>
    )
  }

  const selectedOption = PROJECT_REPORT_OPTIONS.find((o) => o.key === reportKey)

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        className="mb-4"
      />

      <div className="mb-6 border-b border-neutral-200 pb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Reports
        </Typography>
        {project ? (
          <Typography variant="small" tone="muted" className="mt-1">
            {project.code} · {project.name}
          </Typography>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-64">
          <Typography variant="small" className="mb-1.5">
            Report type
          </Typography>
          <Select
            value={reportKey}
            onValueChange={(v: string) => setReportKey(v as ProjectReportKey)}
            options={PROJECT_REPORT_OPTIONS.map((o) => ({ value: o.key, label: `${o.group} · ${o.label}` }))}
          />
        </div>
        <Button variant="secondary" onClick={() => void refetch()} disabled={loading}>
          Refresh
        </Button>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <div className="mb-3">
        <Typography weight="medium">{selectedOption?.label}</Typography>
      </div>

      {loading ? <PageSkeleton variant="list" /> : <ProjectReportResultTable result={result} />}
    </div>
  )
}
