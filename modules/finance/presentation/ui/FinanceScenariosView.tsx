'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { GitCompareArrows, Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  CurrencyAmount,
  DataTable,
  FinancialKpiStrip,
  PageSkeleton,
  Typography,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ROUTES } from '@/constants/routes'
import { estimationApi } from '@/modules/estimation'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import { useFinanceScenarios } from '../hooks/useFinanceScenarios'
import { CreateFinanceScenarioModal } from './CreateFinanceScenarioModal'
import {
  canApproveFinanceScenario,
  canArchiveFinanceScenario,
  canMarkFinanceCurrent,
  financeStatusLabel,
  financeStatusTone,
  formatPercent,
} from '../../domain/rules/finance.rules'
import type { FinanceScenario } from '../../domain/model/finance'

function formatUpdated(value: string | undefined): string {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export function FinanceScenariosView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const [createOpen, setCreateOpen] = useState(false)
  const [estimationOptions, setEstimationOptions] = useState<Array<{ id: string; label: string }>>(
    []
  )

  const { project } = useProject(workspaceId, projectId)
  const {
    scenarios,
    currentScenario,
    currentSummary,
    loading,
    creating,
    error,
    forbidden,
    createScenario,
    approveScenario,
    markCurrent,
    archiveScenario,
    duplicateScenario,
  } = useFinanceScenarios(projectId)

  useEffect(() => {
    if (!projectId) return
    void estimationApi
      .listEstimationRuns(projectId)
      .then((list) => {
        setEstimationOptions(
          (list ?? []).map((r) => ({
            id: r.id,
            label: `${r.name} · ${r.status}`,
          }))
        )
      })
      .catch(() => setEstimationOptions([]))
  }, [projectId])

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn()
      toast.success(label)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (loading && scenarios.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <Card className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to financials</Typography>
      </Card>
    )
  }

  const currency = currentSummary?.currencyCode ?? 'USD'
  const kpiItems = currentSummary
    ? [
        {
          id: 'revenue',
          label: 'Planned revenue',
          value: <CurrencyAmount amount={currentSummary.plannedRevenue} currency={currency} />,
        },
        {
          id: 'budget',
          label: 'Budget of costs',
          value: <CurrencyAmount amount={currentSummary.budgetOfCosts} currency={currency} />,
        },
        {
          id: 'margin',
          label: 'Gross margin',
          value: <CurrencyAmount amount={currentSummary.grossMargin} currency={currency} />,
        },
        {
          id: 'marginPct',
          label: 'Margin %',
          value: (
            <Typography weight="semibold">
              {formatPercent(currentSummary.grossMarginPercent)}
            </Typography>
          ),
        },
      ]
    : []

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Financials"
      />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Finance Scenarios
          </Typography>
          {project ? (
            <Typography variant="small" tone="muted" className="mt-1">
              {project.code} · {project.name}
            </Typography>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <NextLink href={ROUTES.workspace.projectFinancialsCompare(workspaceId, projectId)}>
            <Button variant="ghost" icon={<GitCompareArrows size={16} />}>
              Compare
            </Button>
          </NextLink>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            loading={creating}
            onClick={() => setCreateOpen(true)}
          >
            Create scenario
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <Typography as="h2" size="md" weight="medium" className="mb-3">
        Current finance
      </Typography>
      {currentSummary && currentScenario ? (
        <div className="mb-8">
          <div className="mb-3 flex flex-wrap items-center gap-sm">
            <Typography variant="small" weight="medium">
              {currentScenario.name}
            </Typography>
            <Badge tone="success" size="sm">
              Current
            </Badge>
            <Badge tone={financeStatusTone(currentScenario.status)} size="sm">
              {financeStatusLabel(currentScenario.status)}
            </Badge>
            <NextLink
              href={ROUTES.workspace.projectFinancialsScenario(
                workspaceId,
                projectId,
                currentScenario.id
              )}
              className="text-sm text-primary underline-offset-2 hover:underline"
            >
              Open workbench
            </NextLink>
          </div>
          <FinancialKpiStrip items={kpiItems} mode="compact" />
        </div>
      ) : (
        <Card className="mb-8 border border-neutral-200 bg-neutral-50 p-4">
          <Typography variant="small" tone="muted">
            No current finance scenario yet. Create one and mark it as current.
          </Typography>
        </Card>
      )}

      <Typography as="h2" size="md" weight="medium" className="mb-3">
        Scenarios
      </Typography>
      <DataTable<FinanceScenario>
        className="border border-neutral-200"
        ariaLabel="Finance scenarios"
        rows={scenarios}
        rowKey={(scenario) => scenario.id}
        emptyMessage="No finance scenarios yet"
        columns={[
          {
            id: 'scenario',
            header: 'Scenario',
            cell: (s) => (
              <NextLink
                href={ROUTES.workspace.projectFinancialsScenario(workspaceId, projectId, s.id)}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {s.name}
              </NextLink>
            ),
          },
          { id: 'code', header: 'Code', accessor: (s) => s.code || '—', kind: 'code' },
          { id: 'version', header: 'Version', accessor: (s) => `v${s.scenarioVersion}` },
          { id: 'currency', header: 'Currency', accessor: 'currencyCode' },
          {
            id: 'revenue',
            header: 'Revenue',
            cell: (s) => (
              <CurrencyAmount amount={s.plannedRevenue} currency={s.currencyCode} size="sm" />
            ),
          },
          {
            id: 'status',
            header: 'Status',
            cell: (s) => (
              <Badge tone={financeStatusTone(s.status)}>{financeStatusLabel(s.status)}</Badge>
            ),
          },
          {
            id: 'current',
            header: 'Current',
            cell: (s) =>
              s.currentFlag || currentScenario?.id === s.id ? (
                <Badge tone="success" size="sm">
                  Yes
                </Badge>
              ) : (
                '—'
              ),
          },
          { id: 'updated', header: 'Updated', accessor: (s) => formatUpdated(s.updatedAt) },
          {
            id: 'actions',
            header: 'Actions',
            cell: (s) => (
              <div className="flex flex-wrap gap-1">
                {canApproveFinanceScenario(s) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void runAction('Scenario approved', () => approveScenario(s.id))}
                  >
                    Approve
                  </Button>
                ) : null}
                {canMarkFinanceCurrent(s) && !(s.currentFlag || currentScenario?.id === s.id) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void runAction('Marked as current', () => markCurrent(s.id))}
                  >
                    Mark current
                  </Button>
                ) : null}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    void runAction('Scenario duplicated', () => duplicateScenario(s.id))
                  }
                >
                  Duplicate
                </Button>
                {canArchiveFinanceScenario(s) ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (!window.confirm(`Archive “${s.name}”?`)) return
                      void runAction('Scenario archived', () => archiveScenario(s.id))
                    }}
                  >
                    Archive
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
      />

      <CreateFinanceScenarioModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        estimationRuns={estimationOptions}
        onSubmit={async (body) => {
          try {
            await createScenario(body)
            toast.success('Finance scenario created')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
