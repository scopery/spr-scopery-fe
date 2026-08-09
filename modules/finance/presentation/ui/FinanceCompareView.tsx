'use client'

import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import {
  Badge,
  Button,
  Card,
  CurrencyAmount,
  DataTable,
  PageSkeleton,
  Select,
  Typography,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import { useFinanceCompare } from '../hooks/useFinanceCompare'
import { deltaDirection, formatHours, formatPercent } from '../../domain/rules/finance.rules'

export function FinanceCompareView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const { project } = useProject(workspaceId, projectId)
  const {
    scenarios,
    leftScenarioId,
    setLeftScenarioId,
    rightScenarioId,
    setRightScenarioId,
    result,
    loading,
    comparing,
    error,
    compare,
  } = useFinanceCompare(projectId)

  if (loading && scenarios.length === 0) return <PageSkeleton variant="list" />

  const options = scenarios.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.code})`,
  }))

  const currency = result?.leftSummary.currencyCode ?? result?.rightSummary.currencyCode ?? 'USD'

  const rows = result
    ? [
        {
          id: 'revenue',
          label: 'Planned revenue',
          left: result.leftSummary.plannedRevenue,
          right: result.rightSummary.plannedRevenue,
          delta: result.delta.plannedRevenueDelta,
          metric: 'plannedRevenue' as const,
          kind: 'money' as const,
        },
        {
          id: 'budget',
          label: 'Budget of costs',
          left: result.leftSummary.budgetOfCosts,
          right: result.rightSummary.budgetOfCosts,
          delta: result.delta.budgetOfCostsDelta,
          metric: 'budgetOfCosts' as const,
          kind: 'money' as const,
        },
        {
          id: 'margin',
          label: 'Gross margin',
          left: result.leftSummary.grossMargin,
          right: result.rightSummary.grossMargin,
          delta: result.delta.grossMarginDelta,
          metric: 'grossMargin' as const,
          kind: 'money' as const,
        },
        {
          id: 'marginPct',
          label: 'Margin %',
          left: result.leftSummary.grossMarginPercent,
          right: result.rightSummary.grossMarginPercent,
          delta: result.delta.grossMarginPercentDelta,
          metric: 'grossMarginPercent' as const,
          kind: 'percent' as const,
        },
        {
          id: 'pbt',
          label: 'PBT',
          left: result.leftSummary.profitBeforeTax,
          right: result.rightSummary.profitBeforeTax,
          delta: result.delta.profitBeforeTaxDelta,
          metric: 'profitBeforeTax' as const,
          kind: 'money' as const,
        },
        {
          id: 'hours',
          label: 'Estimate hours',
          left: result.leftSummary.totalEstimateHours,
          right: result.rightSummary.totalEstimateHours,
          delta: result.delta.totalEstimateHoursDelta,
          metric: 'totalEstimateHours' as const,
          kind: 'hours' as const,
        },
      ]
    : []

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Compare scenarios"
      />

      <div className="mb-2 border-b border-neutral-200 pb-2">
        <NextLink
          href={ROUTES.workspace.projectFinancials(workspaceId, projectId)}
          className="mb-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
        >
          ← Finance Scenarios
        </NextLink>
        <Typography as="h1" size="md" weight="medium">
          Scenario Comparison
        </Typography>
        <Typography variant="small" tone="muted" className="mt-1">
          Compare two finance scenarios side by side. Totals come from the server.
        </Typography>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="min-w-[12rem] flex-1">
          <Typography variant="small" weight="medium" className="mb-1">
            Left scenario
          </Typography>
          <Select
            value={leftScenarioId}
            onValueChange={setLeftScenarioId}
            options={options}
            placeholder="Select left"
          />
        </div>
        <div className="min-w-[12rem] flex-1">
          <Typography variant="small" weight="medium" className="mb-1">
            Right scenario
          </Typography>
          <Select
            value={rightScenarioId}
            onValueChange={setRightScenarioId}
            options={options}
            placeholder="Select right"
          />
        </div>
        <Button
          variant="primary"
          loading={comparing}
          disabled={!leftScenarioId || !rightScenarioId}
          onClick={() => void compare()}
        >
          Compare
        </Button>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      {result ? (
        <>
          <div className="mb-3 flex flex-wrap gap-sm">
            <Badge tone="info" size="sm">
              Left: {result.leftScenario.name}
            </Badge>
            <Badge tone="info" size="sm">
              Right: {result.rightScenario.name}
            </Badge>
          </div>
          <DataTable
            className="border border-neutral-200"
            ariaLabel="Finance scenario comparison"
            rows={rows}
            rowKey={(row) => row.id}
            columns={[
              { id: 'metric', header: 'Metric', accessor: 'label' },
              ...(['left', 'right', 'delta'] as const).map((field) => ({
                id: field,
                header: field[0].toUpperCase() + field.slice(1),
                cell: (row: (typeof rows)[number]) =>
                  row.kind === 'money' ? (
                    <CurrencyAmount amount={row[field]} currency={currency} size="sm" />
                  ) : row.kind === 'percent' ? (
                    formatPercent(row[field])
                  ) : (
                    formatHours(row[field])
                  ),
              })),
              {
                id: 'signal',
                header: 'Signal',
                cell: (row) => {
                  const dir = deltaDirection(row.metric, row.delta)
                  return (
                    <Badge
                      size="sm"
                      tone={dir === 'better' ? 'success' : dir === 'worse' ? 'warning' : 'neutral'}
                    >
                      {dir === 'better' ? 'Better' : dir === 'worse' ? 'Worse' : 'Neutral'}
                    </Badge>
                  )
                },
              },
            ]}
          />
        </>
      ) : (
        <Card className="border border-neutral-200 bg-neutral-50 p-4">
          <Typography variant="small" tone="muted">
            Select two scenarios and run compare.
          </Typography>
        </Card>
      )}
    </div>
  )
}
