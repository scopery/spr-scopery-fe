'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  CurrencyAmount,
  FinancialKpiStrip,
  Input,
  LongRunningJobState,
  LongRunningJobStatus,
  PageSkeleton,
  Select,
  Textarea,
  Typography,
  VersionRail,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import {
  useProfitabilityCenter,
  type ProfitabilityTab,
} from '../hooks/useProfitabilityCenter'
import { BillingRateCardsView } from './BillingRateCardsView'
import {
  formatPercent,
  healthStatusLabel,
  healthStatusTone,
  isThresholdOrderValid,
} from '../../domain/rules/profitability.rules'
import {
  AdjustmentType,
  CostForecastType,
  CostSourceType,
  ProfitPlanType,
  ProfitRiskImpactType,
  RevenueForecastType,
  RevenueSourceType,
  VarianceType,
} from '../../domain/enums/profitability.enum'

const TABS: { id: ProfitabilityTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'sources', label: 'Sources' },
  { id: 'forecasts', label: 'Forecasts' },
  { id: 'plans', label: 'Plans' },
  { id: 'adjustments', label: 'Adjustments' },
  { id: 'variance', label: 'Variance' },
  { id: 'risks', label: 'Risk Flags' },
  { id: 'rateCards', label: 'Rate Cards' },
  { id: 'settings', label: 'Settings' },
]

export function ProfitabilityCenterView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const { project } = useProject(workspaceId, projectId)
  const h = useProfitabilityCenter(projectId)

  const [currencyInit, setCurrencyInit] = useState('USD')
  const [healthy, setHealthy] = useState('20')
  const [watch, setWatch] = useState('10')
  const [atRisk, setAtRisk] = useState('5')
  const [lossRisk, setLossRisk] = useState('0')

  // Lightweight create form state (sources / forecasts / etc.)
  const [costAmount, setCostAmount] = useState('')
  const [costType, setCostType] = useState<string>(CostSourceType.Labor)
  const [revAmount, setRevAmount] = useState('')
  const [revType, setRevType] = useState<string>(RevenueSourceType.Contract)
  const [cfAmount, setCfAmount] = useState('')
  const [rfAmount, setRfAmount] = useState('')
  const [planName, setPlanName] = useState('')
  const [planCode, setPlanCode] = useState('')
  const [adjAmount, setAdjAmount] = useState('')
  const [adjReason, setAdjReason] = useState('')
  const [varFrom, setVarFrom] = useState('')
  const [varTo, setVarTo] = useState('')
  const [riskReason, setRiskReason] = useState('')
  const [riskAmount, setRiskAmount] = useState('')

  const run = async (ok: string, fn: () => Promise<unknown>) => {
    try {
      await fn()
      toast.success(ok)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (h.loading && !h.profile && !h.summary) return <PageSkeleton variant="cards" />

  if (h.forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to profitability</Typography>
      </div>
    )
  }

  const currency = h.summary?.currency ?? h.profile?.currency ?? 'USD'

  const kpiItems = h.summary
    ? [
        {
          id: 'rev',
          label: 'Revenue',
          value: <CurrencyAmount amount={h.summary.totalRevenue} currency={currency} />,
        },
        {
          id: 'cost',
          label: 'Cost',
          value: <CurrencyAmount amount={h.summary.totalCost} currency={currency} />,
        },
        {
          id: 'margin',
          label: 'Gross margin',
          value: <CurrencyAmount amount={h.summary.grossMargin} currency={currency} />,
        },
        {
          id: 'pbt',
          label: 'PBT',
          value: <CurrencyAmount amount={h.summary.profitBeforeTax} currency={currency} />,
        },
      ]
    : []

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Profitability"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Profitability Center
          </Typography>
          {project ? (
            <Typography variant="small" tone="muted" className="mt-1">
              {project.code} · {project.name}
            </Typography>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {!h.profile ? (
            <div className="flex items-end gap-2">
              <Input
                label="Currency"
                value={currencyInit}
                onChange={(e) => setCurrencyInit(e.target.value.toUpperCase())}
              />
              <Button
                variant="primary"
                onClick={() =>
                  void run('Profile initialized', () => h.initProfile(currencyInit))
                }
              >
                Initialize
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              icon={<RefreshCw size={16} />}
              loading={h.rebuilding}
              onClick={() => void run('Summary rebuilt', () => h.rebuild())}
            >
              Rebuild summary
            </Button>
          )}
        </div>
      </div>

      {h.error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {h.error}
          </Typography>
        </div>
      ) : null}

      {h.rebuilding ? (
        <LongRunningJobState
          className="mb-4"
          status={LongRunningJobStatus.Running}
          label="Rebuilding summary"
          message="Refreshing profitability totals from the server…"
        />
      ) : null}

      <div className="mb-4 flex flex-wrap gap-1 border-b border-neutral-200">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTabAndSyncThreshold(t.id)
            }}
            className={
              h.tab === t.id
                ? 'border-b-2 border-primary px-3 py-2 text-sm font-medium text-primary'
                : 'px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900'
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {h.tab === 'overview' ? (
        <div>
          {h.summary ? (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-sm">
                <Badge tone={healthStatusTone(h.summary.healthStatus)}>
                  {healthStatusLabel(h.summary.healthStatus)}
                </Badge>
                <Typography variant="small" tone="muted">
                  Margin {formatPercent(h.summary.grossMarginPercent)} · PBT{' '}
                  {formatPercent(h.summary.pbtPercent)}
                </Typography>
              </div>
              <FinancialKpiStrip items={kpiItems} mode="expanded" className="mb-6" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-neutral-200 p-4">
                  <Typography weight="semibold" className="mb-2">
                    Cost sources ({h.costSources.length})
                  </Typography>
                  <Typography variant="small" tone="muted">
                    Active cost lines feeding forecast and summary.
                  </Typography>
                </div>
                <div className="border border-neutral-200 p-4">
                  <Typography weight="semibold" className="mb-2">
                    Revenue sources ({h.revenueSources.length})
                  </Typography>
                  <Typography variant="small" tone="muted">
                    Contract / milestone / change-order inputs.
                  </Typography>
                </div>
                <div className="border border-neutral-200 p-4">
                  <Typography weight="semibold" className="mb-2">
                    Open risk flags ({h.riskFlags.filter((r) => r.status !== 'CLOSED').length})
                  </Typography>
                </div>
                <div className="border border-neutral-200 p-4">
                  <Typography weight="semibold" className="mb-2">
                    Plans ({h.plans.length})
                  </Typography>
                </div>
              </div>
            </>
          ) : (
            <Typography variant="small" tone="muted">
              No summary yet. Initialize a profile and rebuild.
            </Typography>
          )}
        </div>
      ) : null}

      {h.tab === 'sources' ? (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <Typography as="h2" size="lg" weight="semibold" className="mr-auto">
                Cost sources
              </Typography>
              <Select
                value={costType}
                onValueChange={setCostType}
                options={[
                  { value: CostSourceType.Labor, label: 'Labor' },
                  { value: CostSourceType.Vendor, label: 'Vendor' },
                  { value: CostSourceType.Overhead, label: 'Overhead' },
                  { value: CostSourceType.Custom, label: 'Custom' },
                ]}
              />
              <Input
                label="Amount"
                type="number"
                value={costAmount}
                onChange={(e) => setCostAmount(e.target.value)}
              />
              <Button
                size="sm"
                variant="primary"
                icon={<Plus size={14} />}
                onClick={() =>
                  void run('Cost source added', () =>
                    h.addCostSource({
                      sourceType: costType as typeof CostSourceType.Labor,
                      amount: Number(costAmount),
                      currency,
                      includedInForecast: true,
                    })
                  )
                }
              >
                Add
              </Button>
            </div>
            <SourceTable
              rows={h.costSources.map((s) => ({
                id: s.id,
                type: s.sourceType,
                amount: s.amount,
                currency: s.currency,
                extra: s.effortHours != null ? `${s.effortHours}h` : '—',
                status: s.status,
              }))}
              onArchive={(id) => void run('Archived', () => h.archiveCost(id))}
            />
          </section>
          <section>
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <Typography as="h2" size="lg" weight="semibold" className="mr-auto">
                Revenue sources
              </Typography>
              <Select
                value={revType}
                onValueChange={setRevType}
                options={[
                  { value: RevenueSourceType.Contract, label: 'Contract' },
                  { value: RevenueSourceType.Milestone, label: 'Milestone' },
                  { value: RevenueSourceType.ChangeOrder, label: 'Change order' },
                  { value: RevenueSourceType.Other, label: 'Other' },
                ]}
              />
              <Input
                label="Amount"
                type="number"
                value={revAmount}
                onChange={(e) => setRevAmount(e.target.value)}
              />
              <Button
                size="sm"
                variant="primary"
                icon={<Plus size={14} />}
                onClick={() =>
                  void run('Revenue source added', () =>
                    h.addRevenueSource({
                      sourceType: revType as typeof RevenueSourceType.Contract,
                      amount: Number(revAmount),
                      currency,
                      includedInForecast: true,
                      confidence: 0.9,
                    })
                  )
                }
              >
                Add
              </Button>
            </div>
            <SourceTable
              rows={h.revenueSources.map((s) => ({
                id: s.id,
                type: s.sourceType,
                amount: s.amount,
                currency: s.currency,
                extra:
                  s.confidence != null
                    ? `${Math.round(s.confidence * 100)}% conf`
                    : '—',
                status: s.status,
              }))}
              onArchive={(id) => void run('Archived', () => h.archiveRevenue(id))}
            />
          </section>
        </div>
      ) : null}

      {h.tab === 'forecasts' ? (
        <div className="space-y-8">
          <section>
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <Typography as="h2" size="lg" weight="semibold" className="mr-auto">
                Cost forecasts
              </Typography>
              <Input
                label="Amount"
                type="number"
                value={cfAmount}
                onChange={(e) => setCfAmount(e.target.value)}
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  void run('Cost forecast added', () =>
                    h.addCostForecast({
                      forecastType: CostForecastType.Labor,
                      currency,
                      forecastAmount: Number(cfAmount),
                      confidencePercent: 90,
                    })
                  )
                }
              >
                Add
              </Button>
            </div>
            <ForecastTable rows={h.costForecasts} />
          </section>
          <section>
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <Typography as="h2" size="lg" weight="semibold" className="mr-auto">
                Revenue forecasts
              </Typography>
              <Input
                label="Amount"
                type="number"
                value={rfAmount}
                onChange={(e) => setRfAmount(e.target.value)}
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  void run('Revenue forecast added', () =>
                    h.addRevenueForecast({
                      forecastType: RevenueForecastType.Contract,
                      currency,
                      forecastAmount: Number(rfAmount),
                      confidencePercent: 90,
                    })
                  )
                }
              >
                Add
              </Button>
            </div>
            <ForecastTable rows={h.revenueForecasts} />
          </section>
        </div>
      ) : null}

      {h.tab === 'plans' ? (
        <div>
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <Input
              label="Code"
              value={planCode}
              onChange={(e) => setPlanCode(e.target.value)}
              placeholder="PP-2026-Q3"
            />
            <Input
              label="Name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
            />
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                void run('Plan created', () =>
                  h.addPlan({
                    planCode: planCode.trim(),
                    name: planName.trim(),
                    planType: ProfitPlanType.Budget,
                    versionLabel: 'v1.0',
                    currency,
                    plannedRevenue: h.summary?.totalRevenue ?? 0,
                    plannedCost: h.summary?.totalCost ?? 0,
                    plannedProfit: h.summary?.grossMargin ?? 0,
                    plannedMarginPercent: h.summary?.grossMarginPercent ?? 0,
                  })
                )
              }
            >
              Create plan
            </Button>
          </div>
          <div className="mb-4 overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Plan</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {h.plans.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center">
                      <Typography variant="small" tone="muted">
                        No plans yet
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  h.plans.map((p) => (
                    <tr
                      key={p.id}
                      className={`cursor-pointer border-t border-neutral-100 hover:bg-neutral-50 ${
                        h.selectedPlanId === p.id ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => h.setSelectedPlanId(p.id)}
                    >
                      <td className="px-4 py-3">
                        <Typography weight="medium">{p.name}</Typography>
                        <Typography variant="caption" tone="muted" className="block">
                          {p.planCode}
                        </Typography>
                      </td>
                      <td className="px-4 py-3">{p.planType}</td>
                      <td className="px-4 py-3">
                        <Badge size="sm" tone="info">
                          {p.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {h.selectedPlanId && h.planVersions.length > 0 ? (
            <div className="space-y-3">
              <VersionRail
                items={h.planVersions.map((v) => ({
                  id: v.id,
                  label: v.versionLabel,
                  statusLabel: v.status,
                  current: v.id === h.planVersions[0]?.id,
                  timestamp: v.createdAt,
                }))}
                selectedId={h.planVersions[0]?.id}
              />
              <div className="flex flex-wrap gap-2">
                {h.planVersions
                  .filter((v) => v.status !== 'FINALIZED' && !v.finalizedAt)
                  .map((v) => (
                    <Button
                      key={v.id}
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        if (!window.confirm(`Finalize version ${v.versionLabel}?`)) return
                        void run('Version finalized', () =>
                          h.finalizeVersion(h.selectedPlanId!, v.id)
                        )
                      }}
                    >
                      Finalize {v.versionLabel}
                    </Button>
                  ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {h.tab === 'adjustments' ? (
        <div>
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <Input
              label="Amount"
              type="number"
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
            />
            <Input
              label="Reason"
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
            />
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                void run('Adjustment created', () =>
                  h.addAdjustment({
                    adjustmentType: AdjustmentType.CostReduction,
                    amount: Number(adjAmount),
                    reason: adjReason.trim(),
                  })
                )
              }
            >
              Create
            </Button>
          </div>
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Applied</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {h.adjustments.map((a) => (
                  <tr key={a.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">{a.adjustmentType}</td>
                    <td className="px-4 py-3">
                      <CurrencyAmount amount={a.amount} currency={currency} size="sm" />
                    </td>
                    <td className="px-4 py-3">{a.reason}</td>
                    <td className="px-4 py-3">{a.applied ? 'Yes' : 'No'}</td>
                    <td className="px-4 py-3">
                      {!a.applied ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (!window.confirm('Apply this adjustment?')) return
                            void run('Adjustment applied', () => h.applyAdj(a.id))
                          }}
                        >
                          Apply
                        </Button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {h.tab === 'variance' ? (
        <div>
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <Input
              label="From"
              type="number"
              value={varFrom}
              onChange={(e) => setVarFrom(e.target.value)}
            />
            <Input
              label="To"
              type="number"
              value={varTo}
              onChange={(e) => setVarTo(e.target.value)}
            />
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                const from = Number(varFrom)
                const to = Number(varTo)
                const delta = to - from
                void run('Variance recorded', () =>
                  h.addVariance({
                    varianceType: VarianceType.CostOverrun,
                    fromAmount: from,
                    toAmount: to,
                    varianceAmount: delta,
                    variancePercent: from === 0 ? 0 : (delta / from) * 100,
                    currency,
                  })
                )
              }}
            >
              Record
            </Button>
          </div>
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">From</th>
                  <th className="px-4 py-3 font-medium">To</th>
                  <th className="px-4 py-3 font-medium">Delta</th>
                  <th className="px-4 py-3 font-medium">%</th>
                </tr>
              </thead>
              <tbody>
                {h.variances.map((v) => (
                  <tr key={v.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">{v.varianceType}</td>
                    <td className="px-4 py-3">
                      <CurrencyAmount amount={v.fromAmount} currency={v.currency} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <CurrencyAmount amount={v.toAmount} currency={v.currency} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <CurrencyAmount
                        amount={v.varianceAmount}
                        currency={v.currency}
                        size="sm"
                      />
                    </td>
                    <td className="px-4 py-3">{formatPercent(v.variancePercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {h.tab === 'risks' ? (
        <div>
          <div className="mb-4 flex flex-wrap items-end gap-2">
            <div className="min-w-[14rem] flex-1">
              <Typography variant="small" weight="medium" className="mb-1">
                Reason
              </Typography>
              <Textarea
                value={riskReason}
                onChange={(e) => setRiskReason(e.target.value)}
                rows={2}
              />
            </div>
            <Input
              label="Amount at risk"
              type="number"
              value={riskAmount}
              onChange={(e) => setRiskAmount(e.target.value)}
            />
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                void run('Risk flag created', () =>
                  h.addRisk({
                    reason: riskReason.trim(),
                    impactType: ProfitRiskImpactType.MarginErosion,
                    amountAtRisk: Number(riskAmount),
                  })
                )
              }
            >
              Flag
            </Button>
          </div>
          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Reason</th>
                  <th className="px-4 py-3 font-medium">Impact</th>
                  <th className="px-4 py-3 font-medium">At risk</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {h.riskFlags.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3">{r.reason}</td>
                    <td className="px-4 py-3">{r.impactType}</td>
                    <td className="px-4 py-3">
                      <CurrencyAmount amount={r.amountAtRisk} currency={currency} size="sm" />
                    </td>
                    <td className="px-4 py-3">
                      <Badge size="sm" tone="warning">
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void run('Mitigated', () => h.mitigateRisk(r.id))}
                        >
                          Mitigate
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => void run('Closed', () => h.closeRisk(r.id))}
                        >
                          Close
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {h.tab === 'rateCards' ? (
        <BillingRateCardsView
          scope="project"
          scopeId={projectId}
          title="Project billing rate cards"
          embedded
        />
      ) : null}

      {h.tab === 'settings' ? (
        <div className="max-w-md space-y-4">
          <Typography weight="semibold">Profitability thresholds</Typography>
          <Typography variant="small" tone="muted">
            Healthy ≥ Watch ≥ At risk ≥ Loss risk (margin %).
          </Typography>
          <Input
            label="Healthy margin %"
            type="number"
            fullWidth
            value={healthy}
            onChange={(e) => setHealthy(e.target.value)}
          />
          <Input
            label="Watch margin %"
            type="number"
            fullWidth
            value={watch}
            onChange={(e) => setWatch(e.target.value)}
          />
          <Input
            label="At-risk margin %"
            type="number"
            fullWidth
            value={atRisk}
            onChange={(e) => setAtRisk(e.target.value)}
          />
          <Input
            label="Loss-risk margin %"
            type="number"
            fullWidth
            value={lossRisk}
            onChange={(e) => setLossRisk(e.target.value)}
          />
          <Button
            variant="primary"
            onClick={() => {
              const body = {
                healthyMarginPercent: Number(healthy),
                watchMarginPercent: Number(watch),
                atRiskMarginPercent: Number(atRisk),
                lossRiskMarginPercent: Number(lossRisk),
              }
              if (!isThresholdOrderValid(body)) {
                toast.error('Thresholds must be in descending order')
                return
              }
              void run('Thresholds saved', () => h.saveThreshold(body))
            }}
          >
            Save thresholds
          </Button>
        </div>
      ) : null}
    </div>
  )

  function setTabAndSyncThreshold(id: ProfitabilityTab) {
    h.setTab(id)
    if (id === 'settings' && h.threshold) {
      setHealthy(String(h.threshold.healthyMarginPercent))
      setWatch(String(h.threshold.watchMarginPercent))
      setAtRisk(String(h.threshold.atRiskMarginPercent))
      setLossRisk(String(h.threshold.lossRiskMarginPercent))
    }
  }
}

function SourceTable({
  rows,
  onArchive,
}: {
  rows: Array<{
    id: string
    type: string
    amount: number
    currency: string
    extra: string
    status: string
  }>
  onArchive: (id: string) => void
}) {
  return (
    <div className="overflow-x-auto border border-neutral-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Detail</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center">
                <Typography variant="small" tone="muted">
                  No rows
                </Typography>
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="px-4 py-3">{r.type}</td>
                <td className="px-4 py-3">
                  <CurrencyAmount amount={r.amount} currency={r.currency} size="sm" />
                </td>
                <td className="px-4 py-3">{r.extra}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3">
                  {r.status !== 'ARCHIVED' ? (
                    <Button size="sm" variant="ghost" onClick={() => onArchive(r.id)}>
                      Archive
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

function ForecastTable({
  rows,
}: {
  rows: Array<{
    id: string
    forecastType: string
    forecastAmount: number
    currency: string
    confidencePercent: number | null
    forecastDate: string | null
    assumptionNotes: string | null
  }>
}) {
  return (
    <div className="overflow-x-auto border border-neutral-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Confidence</th>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center">
                <Typography variant="small" tone="muted">
                  No forecasts
                </Typography>
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-t border-neutral-100">
                <td className="px-4 py-3">{r.forecastType}</td>
                <td className="px-4 py-3">
                  <CurrencyAmount
                    amount={r.forecastAmount}
                    currency={r.currency}
                    size="sm"
                  />
                </td>
                <td className="px-4 py-3">
                  {r.confidencePercent != null ? `${r.confidencePercent}%` : '—'}
                </td>
                <td className="px-4 py-3">{r.forecastDate ?? '—'}</td>
                <td className="px-4 py-3">{r.assumptionNotes ?? '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
