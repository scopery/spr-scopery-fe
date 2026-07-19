'use client'

import { useParams } from 'next/navigation'
import {
  Button,
  PageSkeleton,
  Stack,
  Typography
} from '@/shared/ui'
import { useTestManagement } from '../hooks/useTestManagement'

export function TestManagementView() {
  const { projectId } = useParams<{ projectId: string }>()
  const {
    plans,
    runs,
    loading,
    error,
    actionError,
    approvePlan,
    startRun,
    completeRun,
    cancelRun,
  } = useTestManagement(projectId)

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Test Management</Typography>
      <Typography tone="muted">
        Test plans, suites, cases and runs. Links Requirement → Test Case → Result → Defect →
        Release.
      </Typography>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}

      <Typography variant="h4">Test plans</Typography>
      {plans.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No test plans.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {plans.map((plan) => (
            <li key={plan.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {plan.title}
                </Typography>
                {plan.status ? (
                  <Typography variant="caption" tone="muted">
                    {plan.status}
                  </Typography>
                ) : null}
              </div>
              <Button size="sm" variant="outline" onClick={() => void approvePlan(plan.id)}>
                Approve
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Test runs</Typography>
      {runs.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No test runs.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {runs.map((run) => (
            <li key={run.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {run.title}
                </Typography>
                {run.status ? (
                  <Typography variant="caption" tone="muted">
                    {run.status}
                  </Typography>
                ) : null}
              </div>
              <div className="flex gap-xs">
                <Button size="sm" variant="outline" onClick={() => void startRun(run.id)}>
                  Start
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void completeRun(run.id)}>
                  Complete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void cancelRun(run.id)}>
                  Cancel
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
