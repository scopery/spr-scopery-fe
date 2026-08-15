'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { PageSkeleton, Typography } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useWorkspaceAuthorization } from '@/modules/auth/iam'
import { CreateProjectModal } from '@/modules/projects'
import { useWorkspace } from '../hooks/useWorkspace'
import { useWorkspacePortfolio } from '../hooks/useWorkspacePortfolio'
import { filterPortfolioRows, type PortfolioMetricFilter } from '../domain/rules/portfolio.rules'
import { WorkspacePortfolioHeader } from './portfolio/WorkspacePortfolioHeader'
import { WorkspacePortfolioSummaryStrip } from './portfolio/WorkspacePortfolioSummaryStrip'
import { WorkspaceAttentionQueue } from './portfolio/WorkspaceAttentionQueue'
import { WorkspaceProjectProgress } from './portfolio/WorkspaceProjectProgress'
import { WorkspaceUnassignedWork } from './portfolio/WorkspaceUnassignedWork'
import { WorkspaceCapacityWidget } from './portfolio/WorkspaceCapacityWidget'
import { WorkspaceSetupState } from './portfolio/WorkspaceSetupState'

export function WorkspaceOverviewView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { workspace, loading, error } = useWorkspace(workspaceId)
  const { canUpdateWorkspace, canManageMembers, canInviteMembers, canCreateProjects } =
    useWorkspaceAuthorization(workspaceId)

  const portfolio = useWorkspacePortfolio(workspaceId)
  const [metricFilter, setMetricFilter] = useState<PortfolioMetricFilter>('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [actionsOpen, setActionsOpen] = useState(false)

  const canSeeUnassigned = canUpdateWorkspace || canManageMembers || canCreateProjects

  const filteredRows = useMemo(
    () => filterPortfolioRows(portfolio.rows, metricFilter),
    [portfolio.rows, metricFilter]
  )

  const handleMetricFilter = useCallback((filter: PortfolioMetricFilter) => {
    setMetricFilter(filter)
    if (filter === 'unassigned') {
      document.getElementById('unassigned-work')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      document.getElementById('project-progress')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [])

  useEffect(() => {
    if (!actionsOpen) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target?.closest('[data-workspace-actions]')) return
      setActionsOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [actionsOpen])

  if (loading) {
    return <PageSkeleton variant="cards" />
  }

  if (error || !workspace) {
    return (
      <div>
        <Typography tone="error">{error ?? 'Workspace not found'}</Typography>
      </div>
    )
  }

  const projectCount = portfolio.summary.projectCount
  const isEmptyPortfolio = projectCount === 0 && !portfolio.phaseWatchLoading
  const hasPhases = portfolio.allRows.some((r) => r.activePhases.length > 0 || r.nextPhase != null)

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb workspaceId={workspaceId} current="Overview" className="mb-4" />

      <div data-workspace-actions>
        <WorkspacePortfolioHeader
          workspace={workspace}
          projectCount={projectCount}
          memberCount={portfolio.members.length || null}
          canCreateProjects={canCreateProjects}
          canUpdateWorkspace={canUpdateWorkspace}
          canManageMembers={canManageMembers}
          canInviteMembers={canInviteMembers}
          onCreateProject={() => setCreateOpen(true)}
          actionsOpen={actionsOpen}
          onToggleActions={() => setActionsOpen((v) => !v)}
        />
      </div>

      {isEmptyPortfolio ? (
        <WorkspaceSetupState
          hasProjects={false}
          memberCount={portfolio.members.length}
          hasPhases={false}
          canCreateProjects={canCreateProjects}
          onCreateProject={() => setCreateOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          <WorkspacePortfolioSummaryStrip
            summary={portfolio.summary}
            activeFilter={metricFilter}
            onFilterChange={handleMetricFilter}
          />

          <WorkspaceAttentionQueue items={portfolio.attentionItems} />

          <div className={canSeeUnassigned ? 'grid gap-4 lg:grid-cols-2' : undefined}>
            <WorkspaceProjectProgress
              workspaceId={workspaceId}
              rows={filteredRows}
              loading={portfolio.phaseWatchLoading}
            />
            {canSeeUnassigned ? (
              <WorkspaceUnassignedWork
                tasks={portfolio.unassignedTasks}
                members={portfolio.members}
                resources={portfolio.capacity.resources}
                overAllocations={portfolio.capacity.overAllocations}
                onAssigned={() => void portfolio.refetchPhaseWatch()}
              />
            ) : null}
          </div>

          <WorkspaceCapacityWidget
            workspaceId={workspaceId}
            overview={portfolio.capacity.overview}
            overAllocations={portfolio.capacity.overAllocations}
            loading={portfolio.capacity.loading}
            forbidden={portfolio.capacity.forbidden}
          />

          {!hasPhases && projectCount > 0 ? (
            <Typography variant="small" tone="muted" className="px-1">
              Add phases to projects to unlock Phase Watch and readiness signals.
            </Typography>
          ) : null}
        </div>
      )}

      {canCreateProjects ? (
        <CreateProjectModal
          workspaceId={workspaceId}
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onSuccess={() => {
            setCreateOpen(false)
            void portfolio.refetchPhaseWatch()
          }}
        />
      ) : null}
    </div>
  )
}
