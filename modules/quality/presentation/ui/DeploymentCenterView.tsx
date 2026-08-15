'use client'

import { useParams } from 'next/navigation'
import { Button, Card, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useDeployments } from '../hooks/useDeployments'

export function DeploymentCenterView() {
  const { projectId } = useParams<{ projectId: string }>()
  const {
    items,
    environments,
    rollbackPlans,
    reports,
    loading,
    error,
    actionError,
    start,
    succeed,
    fail,
    rollback,
    archiveEnv,
    approveRollback,
  } = useDeployments(projectId)

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md">
      <div className="border-b border-neutral-200 pb-2">
        <Typography as="h1" size="md" weight="medium">
          Deployment Center
        </Typography>
        <Typography variant="caption" tone="muted" className="mt-0.5">
          Track deployments and rollbacks for this project.
        </Typography>
      </div>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}

      <Typography variant="h4">Deployments</Typography>
      {items.length === 0 ? (
        <Typography tone="muted">No deployments yet.</Typography>
      ) : (
        <Card as="ul" className="divide-y divide-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {item.title}
                </Typography>
                {item.status ? (
                  <Typography variant="caption" tone="muted">
                    {item.status}
                  </Typography>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-xs">
                <Button size="sm" variant="outline" onClick={() => void start(item.id)}>
                  Start
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void succeed(item.id)}>
                  Succeed
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void fail(item.id)}>
                  Fail
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void rollback(item.id)}>
                  Rollback
                </Button>
              </div>
            </li>
          ))}
        </Card>
      )}

      <Typography variant="h4">Environments</Typography>
      {environments.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No environments.
        </Typography>
      ) : (
        <Card as="ul" className="divide-y divide-neutral-200">
          {environments.map((env) => (
            <li key={env.id} className="flex items-center justify-between gap-md p-md">
              <Typography variant="small">
                {[env.name, env.status].filter(Boolean).join(' · ')}
              </Typography>
              <Button size="sm" variant="outline" onClick={() => void archiveEnv(env.id)}>
                Archive
              </Button>
            </li>
          ))}
        </Card>
      )}

      <Typography variant="h4">Rollback plans</Typography>
      {rollbackPlans.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No rollback plans.
        </Typography>
      ) : (
        <Card as="ul" className="divide-y divide-neutral-200">
          {rollbackPlans.map((plan) => (
            <li key={plan.id} className="flex items-center justify-between gap-md p-md">
              <Typography variant="small">
                {[plan.name ?? 'Unnamed rollback plan', plan.status].filter(Boolean).join(' · ')}
              </Typography>
              <Button size="sm" variant="outline" onClick={() => void approveRollback(plan.id)}>
                Approve
              </Button>
            </li>
          ))}
        </Card>
      )}

      <Typography variant="h4">Quality reports</Typography>
      <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
        {Object.entries(reports).map(([key, value]) => (
          <Card key={key} className="p-md">
            <Typography variant="caption" tone="muted">
              {key}
            </Typography>
            <Typography variant="small">
              {Object.keys(value).length === 0 ? 'No data' : `${Object.keys(value).length} fields`}
            </Typography>
          </Card>
        ))}
      </div>
    </Stack>
  )
}
