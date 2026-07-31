'use client'

import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button, PageSkeleton, Select, Stack, Typography } from '@/shared/ui'
import { useTestManagement } from '../hooks/useTestManagement'
import { QualityAddBar } from './QualityAddBar'
import { displayName } from '../../domain/model/quality'
import type { QualityCreateInput } from './quality-bulk.model'

export function TestManagementView() {
  const { projectId } = useParams<{ projectId: string }>()
  const {
    plans,
    suites,
    cases,
    runs,
    selectedPlanId,
    setSelectedPlanId,
    loading,
    error,
    actionError,
    refetch,
    refetchSuites,
    createPlan,
    createSuite,
    createCase,
    createRun,
    approvePlan,
    startRun,
    completeRun,
    cancelRun,
  } = useTestManagement(projectId)

  const handleCreate = async (input: QualityCreateInput) => {
    switch (input.kind) {
      case 'TEST_PLAN':
        await createPlan(input.payload)
        break
      case 'TEST_SUITE':
        await createSuite(input.payload)
        break
      case 'TEST_CASE':
        await createCase(input.payload)
        break
      case 'TEST_RUN':
        await createRun(input.payload)
        break
      default:
        break
    }
  }

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="border-b border-neutral-200 pb-2">
        <Typography as="h1" size="md" weight="medium">
          Test Management
        </Typography>
        <Typography variant="caption" tone="muted" className="mt-0.5">
          Test plans → suites → cases → runs. Use Single or Bulk add (paste from Excel).
        </Typography>
      </div>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography variant="h4">Test plans</Typography>
          <QualityAddBar
            kind="TEST_PLAN"
            onCreate={handleCreate}
            onBatchComplete={async () => {
              await refetch()
              toast.success('Test plan(s) created')
            }}
          />
        </div>
        {plans.length === 0 ? (
          <Typography tone="muted" variant="caption">
            No test plans.
          </Typography>
        ) : (
          <ul className="divide-y divide-neutral-200 border border-neutral-200">
            {plans.map((plan) => (
              <li key={plan.id} className="flex items-center justify-between gap-md p-md">
                <button
                  type="button"
                  className="text-left"
                  onClick={() => setSelectedPlanId(plan.id)}
                >
                  <Typography
                    variant="small"
                    weight="medium"
                    className={selectedPlanId === plan.id ? 'text-primary' : undefined}
                  >
                    {displayName(plan)}
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    {[plan.code, plan.testLevel, plan.status].filter(Boolean).join(' · ')}
                  </Typography>
                </button>
                <Button size="sm" variant="outline" onClick={() => void approvePlan(plan.id)}>
                  Approve
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Typography variant="h4">Suites</Typography>
            {plans.length > 0 ? (
              <Select
                value={selectedPlanId ?? ''}
                onValueChange={setSelectedPlanId}
                options={plans.map((p) => ({
                  value: p.id,
                  label: displayName(p),
                }))}
                placeholder="Select plan"
              />
            ) : null}
          </div>
          <QualityAddBar
            kind="TEST_SUITE"
            disabled={!selectedPlanId}
            onCreate={handleCreate}
            onBatchComplete={async () => {
              await refetchSuites()
              toast.success('Suite(s) created')
            }}
          />
        </div>
        {!selectedPlanId ? (
          <Typography tone="muted" variant="caption">
            Select a test plan to manage suites.
          </Typography>
        ) : suites.length === 0 ? (
          <Typography tone="muted" variant="caption">
            No suites for this plan.
          </Typography>
        ) : (
          <ul className="divide-y divide-neutral-200 border border-neutral-200">
            {suites.map((suite) => (
              <li key={suite.id} className="p-md">
                <Typography variant="small" weight="medium">
                  {suite.name}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {suite.status}
                </Typography>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography variant="h4">Test cases</Typography>
          <QualityAddBar
            kind="TEST_CASE"
            onCreate={handleCreate}
            onBatchComplete={async () => {
              await refetch()
              toast.success('Test case(s) created')
            }}
          />
        </div>
        {cases.length === 0 ? (
          <Typography tone="muted" variant="caption">
            No test cases yet.
          </Typography>
        ) : (
          <ul className="divide-y divide-neutral-200 border border-neutral-200">
            {cases.map((tc) => (
              <li key={tc.id} className="p-md">
                <Typography variant="small" weight="medium">
                  {tc.title}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {[tc.code, tc.type, tc.priority, tc.status].filter(Boolean).join(' · ')}
                </Typography>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography variant="h4">Test runs</Typography>
          <QualityAddBar
            kind="TEST_RUN"
            onCreate={handleCreate}
            onBatchComplete={async () => {
              await refetch()
              toast.success('Test run(s) created')
            }}
          />
        </div>
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
                    {displayName(run)}
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    {[run.runType, run.status].filter(Boolean).join(' · ')}
                  </Typography>
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
      </section>
    </Stack>
  )
}
