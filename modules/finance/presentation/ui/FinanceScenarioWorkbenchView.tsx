'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  CurrencyAmount,
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
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to this scenario</Typography>
      </div>
    )
  }

  if (error || !scenario) {
    return (
      <div className="border border-error/30 bg-error/5 p-4">
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
    <div>
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
          <Typography as="h1" size="lg" weight="semibold">
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
          <div className="overflow-x-auto border border-neutral-200 bg-neutral-50">
            <table className="min-w-full text-left text-xs">
              <tbody>
                <tr className="border-b border-neutral-200">
                  <td className="px-3 py-2 text-neutral-600">Estimate hours</td>
                  <td className="px-3 py-2">{formatHours(summary.totalEstimateHours)}</td>
                  <td className="px-3 py-2 text-neutral-600">Labor</td>
                  <td className="px-3 py-2">{money(summary.totalLaborCost, currency)}</td>
                  <td className="px-3 py-2 text-neutral-600">Custom</td>
                  <td className="px-3 py-2">{money(summary.totalCustomCost, currency)}</td>
                  <td className="px-3 py-2 text-neutral-600">Vendor</td>
                  <td className="px-3 py-2">{money(summary.totalVendorCost, currency)}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-neutral-600">Contingency</td>
                  <td className="px-3 py-2">{money(summary.totalContingency, currency)}</td>
                  <td className="px-3 py-2 text-neutral-600">Overhead</td>
                  <td className="px-3 py-2">{money(summary.totalOverhead, currency)}</td>
                  <td className="px-3 py-2 text-neutral-600">Margin %</td>
                  <td className="px-3 py-2">{formatPercent(summary.grossMarginPercent)}</td>
                  <td className="px-3 py-2 text-neutral-600">PBT %</td>
                  <td className="px-3 py-2">{formatPercent(summary.pbtPercent)}</td>
                </tr>
              </tbody>
            </table>
          </div>
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
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="sticky left-0 z-10 bg-neutral-50 px-3 py-2 font-medium">
                  Phase
                </th>
                <th className="px-3 py-2 font-medium">Hours</th>
                <th className="px-3 py-2 font-medium">Labor</th>
                <th className="px-3 py-2 font-medium">Custom</th>
                <th className="px-3 py-2 font-medium">Vendor</th>
                <th className="px-3 py-2 font-medium">Contingency</th>
                <th className="px-3 py-2 font-medium">Direct</th>
                <th className="px-3 py-2 font-medium">Overhead</th>
                <th className="px-3 py-2 font-medium">Budget</th>
                <th className="px-3 py-2 font-medium">Revenue</th>
                <th className="px-3 py-2 font-medium">Rev %</th>
                <th className="px-3 py-2 font-medium">Margin</th>
                <th className="px-3 py-2 font-medium">Margin %</th>
                <th className="px-3 py-2 font-medium">PBT</th>
                {editable ? <th className="px-3 py-2 font-medium">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {phases.length === 0 ? (
                <tr>
                  <td colSpan={editable ? 15 : 14} className="px-3 py-8 text-center">
                    <Typography variant="small" tone="muted">
                      No phase financials — recalculate after creating the scenario
                    </Typography>
                  </td>
                </tr>
              ) : (
                [...phases]
                  .sort((a, b) => a.phaseOrder - b.phaseOrder)
                  .map((p) => (
                    <tr key={p.id} className="border-t border-neutral-100">
                      <td className="sticky left-0 z-10 bg-white px-3 py-2 font-medium">
                        {p.phaseNameSnapshot}
                      </td>
                      <td className="px-3 py-2">{formatHours(p.estimateHours)}</td>
                      <td className="px-3 py-2">{money(p.laborCost, currency)}</td>
                      <td className="px-3 py-2">{money(p.customCost, currency)}</td>
                      <td className="px-3 py-2">{money(p.vendorCost, currency)}</td>
                      <td className="px-3 py-2">{money(p.contingencyAmount, currency)}</td>
                      <td className="px-3 py-2">{money(p.directCost, currency)}</td>
                      <td className="px-3 py-2">{money(p.overheadAmount, currency)}</td>
                      <td className="px-3 py-2">{money(p.budgetOfCosts, currency)}</td>
                      <td className="px-3 py-2">{money(p.plannedRevenue, currency)}</td>
                      <td className="px-3 py-2">{formatPercent(p.revenuePercent)}</td>
                      <td className="px-3 py-2">{money(p.grossMargin, currency)}</td>
                      <td className="px-3 py-2">{formatPercent(p.grossMarginPercent)}</td>
                      <td className="px-3 py-2">{money(p.profitBeforeTax, currency)}</td>
                      {editable ? (
                        <td className="px-3 py-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setPhaseEdit(p)}
                          >
                            Revenue
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
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
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {editable ? <th className="px-4 py-3 font-medium">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {customCosts.length === 0 ? (
                  <tr>
                    <td colSpan={editable ? 6 : 5} className="px-4 py-8 text-center">
                      <Typography variant="small" tone="muted">
                        No custom costs
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  customCosts.map((c) => (
                    <tr key={c.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3">{c.name}</td>
                      <td className="px-4 py-3">{c.category}</td>
                      <td className="px-4 py-3">{money(c.amount, c.currencyCode)}</td>
                      <td className="px-4 py-3">{c.costDate ?? '—'}</td>
                      <td className="px-4 py-3">{c.status}</td>
                      {editable ? (
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              void runAction('Custom cost archived', () =>
                                archiveCustom(c.id)
                              )
                            }
                          >
                            Archive
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Vendor</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  {editable ? <th className="px-4 py-3 font-medium">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {vendorCosts.length === 0 ? (
                  <tr>
                    <td colSpan={editable ? 5 : 4} className="px-4 py-8 text-center">
                      <Typography variant="small" tone="muted">
                        No vendor costs
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  vendorCosts.map((v) => (
                    <tr key={v.id} className="border-t border-neutral-100">
                      <td className="px-4 py-3">{v.vendorName}</td>
                      <td className="px-4 py-3">{v.description ?? '—'}</td>
                      <td className="px-4 py-3">{money(v.amount, v.currencyCode)}</td>
                      <td className="px-4 py-3">{v.status}</td>
                      {editable ? (
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              void runAction('Vendor cost archived', () =>
                                archiveVendor(v.id)
                              )
                            }
                          >
                            Archive
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === 'assumptions' ? (
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          {scenario.assumptionsJson == null ? (
            <Typography variant="small" tone="muted">
              No assumptions recorded.
            </Typography>
          ) : (
            <pre className="overflow-x-auto text-xs text-neutral-700">
              {JSON.stringify(scenario.assumptionsJson, null, 2)}
            </pre>
          )}
        </div>
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
