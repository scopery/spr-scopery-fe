'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  CurrencyAmount,
  DataTable,
  FinancialKpiStrip,
  LongRunningJobState,
  LongRunningJobStatus,
  PageSkeleton,
  Typography,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ROUTES } from '@/constants/routes'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import {
  useFinanceScenarioWorkbench,
  type FinanceWorkbenchTab,
} from '../hooks/useFinanceScenarioWorkbench'
import { EditPhaseRevenueModal } from './EditPhaseRevenueModal'
import { CreateCustomCostModal } from './CreateCustomCostModal'
import { CreateVendorCostModal } from './CreateVendorCostModal'
import {
  canApproveFinanceScenario,
  canArchiveFinanceScenario,
  canEditFinanceScenario,
  canMarkFinanceCurrent,
  financeStatusLabel,
  financeStatusTone,
  formatHours,
  formatPercent,
} from '../../domain/rules/finance.rules'
import type { PhaseFinance } from '../../domain/model/finance'

const TABS: { id: FinanceWorkbenchTab; label: string }[] = [
  { id: 'phases', label: 'Phase grid' },
  { id: 'custom', label: 'Custom costs' },
  { id: 'vendor', label: 'Vendor costs' },
  { id: 'assumptions', label: 'Assumptions' },
]

function money(amount: number | null | undefined, currency: string) {
  if (amount == null) {
    return (
      <Typography as="span" variant="small" tone="muted">
        —
      </Typography>
    )
  }
  return <CurrencyAmount amount={amount} currency={currency} size="sm" />
}

export function FinanceScenarioWorkbenchView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string
  const scenarioId = params.scenarioId as string

  const [phaseEdit, setPhaseEdit] = useState<PhaseFinance | null>(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [vendorOpen, setVendorOpen] = useState(false)

  const { project } = useProject(workspaceId, projectId)
  const {
    tab,
    setTab,
    scenario,
    summary,
    phases,
    customCosts,
    vendorCosts,
    loading,
    recalculating,
    error,
    forbidden,
    recalculate,
    approve,
    markCurrent,
    archive,
    updatePhaseRevenue,
    addCustomCost,
    archiveCustom,
    addVendorCost,
    archiveVendor,
  } = useFinanceScenarioWorkbench(projectId, scenarioId)

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    try {
      await fn()
      toast.success(label)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (loading && !scenario) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <Card className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to this scenario</Typography>
      </Card>
    )
  }

  if (error || !scenario) {
    return (
      <div className="border-error/30 bg-error/5 border p-4">
        <Typography variant="small" tone="error">
          {error ?? 'Scenario not found'}
        </Typography>
        <NextLink
          href={ROUTES.workspace.projectFinancials(workspaceId, projectId)}
          className="mt-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
        >
          Back to Financials
        </NextLink>
      </div>
    )
  }

  const currency = summary?.currencyCode ?? scenario.currencyCode
  const editable = canEditFinanceScenario(scenario)

  const primaryKpis = summary
    ? [
        {
          id: 'revenue',
          label: 'Planned revenue',
          value: <CurrencyAmount amount={summary.plannedRevenue} currency={currency} />,
        },
        {
          id: 'budget',
          label: 'Budget of costs',
          value: <CurrencyAmount amount={summary.budgetOfCosts} currency={currency} />,
        },
        {
          id: 'margin',
          label: 'Gross margin',
          value: <CurrencyAmount amount={summary.grossMargin} currency={currency} />,
        },
        {
          id: 'pbt',
          label: 'PBT',
          value: <CurrencyAmount amount={summary.profitBeforeTax} currency={currency} />,
        },
      ]
    : []

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current={scenario.name}
      />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <NextLink
            href={ROUTES.workspace.projectFinancials(workspaceId, projectId)}
            className="mb-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
          >
            ← Finance Scenarios
          </NextLink>
          <Typography as="h1" size="md" weight="medium">
            {scenario.name}
          </Typography>
          <div className="mt-2 flex flex-wrap items-center gap-sm">
            <Badge tone={financeStatusTone(scenario.status)}>
              {financeStatusLabel(scenario.status)}
            </Badge>
            {scenario.currentFlag ? (
              <Badge tone="success" size="sm">
                Current
              </Badge>
            ) : null}
            <Typography variant="small" tone="muted">
              {scenario.code} · v{scenario.scenarioVersion} · {scenario.currencyCode}
              {summary?.formulaVersion ? ` · Formula ${summary.formulaVersion}` : ''}
            </Typography>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            icon={<RefreshCw size={16} />}
            loading={recalculating}
            onClick={() => void runAction('Recalculated', () => recalculate())}
          >
            Recalculate
          </Button>
          {canApproveFinanceScenario(scenario) ? (
            <Button
              variant="secondary"
              onClick={() => {
                if (
                  !window.confirm(
                    `Approve “${scenario.name}”? Editing will be locked after approval.`
                  )
                )
                  return
                void runAction('Scenario approved', () => approve())
              }}
            >
              Approve
            </Button>
          ) : null}
          {canMarkFinanceCurrent(scenario) && !scenario.currentFlag ? (
            <Button
              variant="secondary"
              onClick={() => void runAction('Marked as current', () => markCurrent())}
            >
              Mark current
            </Button>
          ) : null}
          {canArchiveFinanceScenario(scenario) ? (
            <Button
              variant="ghost"
              onClick={() => {
                if (!window.confirm(`Archive “${scenario.name}”?`)) return
                void runAction('Scenario archived', () => archive())
              }}
            >
              Archive
            </Button>
          ) : null}
        </div>
      </div>

      {recalculating ? (
        <LongRunningJobState
          className="mb-4"
          status={LongRunningJobStatus.Running}
          label="Recalculating"
          message="Refreshing summary and phase financials from the server…"
        />
      ) : null}

      {summary ? (
        <div className="mb-4">
          <FinancialKpiStrip items={primaryKpis} mode="expanded" className="mb-3" />
          <DataTable
            ariaLabel="Finance summary details"
            rows={[
              { metric: 'Estimate hours', value: formatHours(summary.totalEstimateHours) },
              { metric: 'Labor', value: money(summary.totalLaborCost, currency) },
              { metric: 'Custom', value: money(summary.totalCustomCost, currency) },
              { metric: 'Vendor', value: money(summary.totalVendorCost, currency) },
              { metric: 'Contingency', value: money(summary.totalContingency, currency) },
              { metric: 'Overhead', value: money(summary.totalOverhead, currency) },
              { metric: 'Margin %', value: formatPercent(summary.grossMarginPercent) },
              { metric: 'PBT %', value: formatPercent(summary.pbtPercent) },
            ]}
            rowKey={(row) => row.metric}
            compact
            columns={[
              { id: 'metric', header: 'Metric', accessor: 'metric' },
              { id: 'value', header: 'Value', accessor: 'value' },
            ]}
          />
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={
              tab === t.id
                ? 'border-b-2 border-primary px-3 py-2 text-sm font-medium text-primary'
                : 'px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'phases' ? (
        <DataTable
          ariaLabel="Phase financials"
          rows={[...phases].sort((a, b) => a.phaseOrder - b.phaseOrder)}
          rowKey={(phase) => phase.id}
          emptyMessage="No phase financials — recalculate after creating the scenario"
          columns={[
            {
              id: 'phase',
              header: 'Phase',
              accessor: (p) => p.phaseNameSnapshot || '—',
              sticky: true,
              width: '180px',
            },
            { id: 'hours', header: 'Hours', accessor: (p) => formatHours(p.estimateHours) },
            ...(
              [
                'laborCost',
                'customCost',
                'vendorCost',
                'contingencyAmount',
                'directCost',
                'overheadAmount',
                'budgetOfCosts',
                'plannedRevenue',
                'grossMargin',
                'profitBeforeTax',
              ] as const
            ).map((field) => ({
              id: field,
              header: (
                {
                  laborCost: 'Labor',
                  customCost: 'Custom',
                  vendorCost: 'Vendor',
                  contingencyAmount: 'Contingency',
                  directCost: 'Direct',
                  overheadAmount: 'Overhead',
                  budgetOfCosts: 'Budget',
                  plannedRevenue: 'Revenue',
                  grossMargin: 'Margin',
                  profitBeforeTax: 'PBT',
                } as const
              )[field],
              cell: (p: (typeof phases)[number]) => money(p[field], currency),
            })),
            {
              id: 'revenuePercent',
              header: 'Rev %',
              accessor: (p) => formatPercent(p.revenuePercent),
            },
            {
              id: 'marginPercent',
              header: 'Margin %',
              accessor: (p) => formatPercent(p.grossMarginPercent),
            },
            ...(editable
              ? [
                  {
                    id: 'actions',
                    header: 'Actions',
                    cell: (p: (typeof phases)[number]) => (
                      <Button size="sm" variant="ghost" onClick={() => setPhaseEdit(p)}>
                        Revenue
                      </Button>
                    ),
                  },
                ]
              : []),
          ]}
        />
      ) : null}

      {tab === 'custom' ? (
        <div>
          {editable ? (
            <div className="mb-3">
              <Button
                size="sm"
                variant="primary"
                icon={<Plus size={14} />}
                onClick={() => setCustomOpen(true)}
              >
                Add custom cost
              </Button>
            </div>
          ) : null}
          <DataTable
            ariaLabel="Custom costs"
            rows={customCosts}
            rowKey={(cost) => cost.id}
            emptyMessage="No custom costs"
            columns={[
              { id: 'name', header: 'Name', accessor: (c) => c.name || '—' },
              { id: 'category', header: 'Category', accessor: (c) => c.category || '—' },
              { id: 'amount', header: 'Amount', cell: (c) => money(c.amount, c.currencyCode) },
              { id: 'date', header: 'Date', accessor: (c) => c.costDate ?? '—' },
              { id: 'status', header: 'Status', accessor: 'status' },
              ...(editable
                ? [
                    {
                      id: 'actions',
                      header: 'Actions',
                      cell: (c: (typeof customCosts)[number]) => (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void runAction('Custom cost archived', () => archiveCustom(c.id))
                          }
                        >
                          Archive
                        </Button>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ) : null}

      {tab === 'vendor' ? (
        <div>
          {editable ? (
            <div className="mb-3">
              <Button
                size="sm"
                variant="primary"
                icon={<Plus size={14} />}
                onClick={() => setVendorOpen(true)}
              >
                Add vendor cost
              </Button>
            </div>
          ) : null}
          <DataTable
            ariaLabel="Vendor costs"
            rows={vendorCosts}
            rowKey={(cost) => cost.id}
            emptyMessage="No vendor costs"
            columns={[
              {
                id: 'vendor',
                header: 'Vendor',
                accessor: (v) => v.vendorName || '—',
                kind: 'reference',
              },
              { id: 'description', header: 'Description', accessor: (v) => v.description ?? '—' },
              { id: 'amount', header: 'Amount', cell: (v) => money(v.amount, v.currencyCode) },
              { id: 'status', header: 'Status', accessor: 'status' },
              ...(editable
                ? [
                    {
                      id: 'actions',
                      header: 'Actions',
                      cell: (v: (typeof vendorCosts)[number]) => (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void runAction('Vendor cost archived', () => archiveVendor(v.id))
                          }
                        >
                          Archive
                        </Button>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ) : null}

      {tab === 'assumptions' ? (
        <Card className="border border-neutral-200 bg-neutral-50 p-4">
          {scenario.assumptionsJson == null ? (
            <Typography variant="small" tone="muted">
              No assumptions recorded.
            </Typography>
          ) : (
            <pre className="overflow-x-auto text-xs text-neutral-700">
              {JSON.stringify(scenario.assumptionsJson, null, 2)}
            </pre>
          )}
        </Card>
      ) : null}

      <EditPhaseRevenueModal
        open={phaseEdit != null}
        onClose={() => setPhaseEdit(null)}
        phase={phaseEdit}
        projectRevenue={summary?.plannedRevenue ?? scenario.plannedRevenue}
        onSubmit={async (body) => {
          if (!phaseEdit) return
          try {
            await updatePhaseRevenue(phaseEdit.id, body)
            toast.success('Phase revenue updated')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
      <CreateCustomCostModal
        open={customOpen}
        onClose={() => setCustomOpen(false)}
        phases={phases}
        currencyCode={currency}
        onSubmit={async (body) => {
          try {
            await addCustomCost(body)
            toast.success('Custom cost added')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
      <CreateVendorCostModal
        open={vendorOpen}
        onClose={() => setVendorOpen(false)}
        phases={phases}
        currencyCode={currency}
        onSubmit={async (body) => {
          try {
            await addVendorCost(body)
            toast.success('Vendor cost added')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
