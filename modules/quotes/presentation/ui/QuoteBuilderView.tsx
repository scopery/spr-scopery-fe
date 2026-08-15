'use client'

import { useEffect, useState } from 'react'
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
import { FEATURES } from '@/config/features'
import { ROUTES } from '@/constants/routes'
import { financeApi } from '@/modules/finance'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import { useQuoteBuilder, type QuoteBuilderSection } from '../hooks/useQuoteBuilder'
import {
  canApproveVersion,
  canDuplicateVersion,
  canMarkAccepted,
  canRejectVersion,
  canSendVersion,
  canSubmitVersion,
  formatPercent,
  isVersionEditable,
  pricingMethodLabel,
  quoteStatusLabel,
  quoteStatusTone,
} from '../../domain/rules/quote.rules'
import {
  QuoteCostBaseMethod,
  QuoteDiscountMethod,
  QuoteGenerateLinesFrom,
  QuoteLineType,
  QuotePricingMethod,
  QuoteTermType,
} from '../../domain/enums/quote.enum'

const SECTIONS: { id: QuoteBuilderSection; label: string }[] = [
  { id: 'pricing', label: 'Pricing' },
  { id: 'lines', label: 'Lines' },
  { id: 'terms', label: 'Terms' },
  { id: 'client', label: 'Client' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'summary', label: 'Summary' },
  { id: 'preview', label: 'Client preview' },
]

export function QuoteBuilderView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string
  const quoteId = params.quoteId as string

  const { project } = useProject(workspaceId, projectId)
  const b = useQuoteBuilder(projectId, quoteId)

  const [scenarios, setScenarios] = useState<Array<{ id: string; label: string }>>([])
  const [lineName, setLineName] = useState('')
  const [linePrice, setLinePrice] = useState('')
  const [lineType, setLineType] = useState<string>(QuoteLineType.Custom)
  const [termTitle, setTermTitle] = useState('')
  const [termContent, setTermContent] = useState('')
  const [termType, setTermType] = useState<string>(QuoteTermType.Payment)
  const [solverMargin, setSolverMargin] = useState('30')
  const [newVersionOpen, setNewVersionOpen] = useState(false)
  const [nvPricing, setNvPricing] = useState<string>(QuotePricingMethod.CostPlusMargin)
  const [nvCostBase, setNvCostBase] = useState<string>(QuoteCostBaseMethod.TotalCost)
  const [nvScenario, setNvScenario] = useState('')
  const [nvMargin, setNvMargin] = useState('30')
  const [nvValidUntil, setNvValidUntil] = useState('')

  useEffect(() => {
    if (!projectId) return
    void financeApi
      .listFinanceScenarios(projectId)
      .then((list) => {
        const opts = list.map((s) => ({ id: s.id, label: `${s.name} (${s.code})` }))
        setScenarios(opts)
        setNvScenario(opts[0]?.id ?? '')
      })
      .catch(() => setScenarios([]))
  }, [projectId])

  useEffect(() => {
    if (b.version?.targetMarginPercent != null) {
      setSolverMargin(String(b.version.targetMarginPercent))
    }
  }, [b.version?.targetMarginPercent])

  const run = async (ok: string, fn: () => Promise<unknown>) => {
    try {
      await fn()
      toast.success(ok)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (b.loading && !b.quote) return <PageSkeleton variant="list" />

  if (b.forbidden) {
    return (
      <Card className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to this quote</Typography>
      </Card>
    )
  }

  if (b.error || !b.quote) {
    return (
      <div className="border-error/30 bg-error/5 border p-4">
        <Typography variant="small" tone="error">
          {b.error ?? 'Quote not found'}
        </Typography>
        <NextLink
          href={ROUTES.workspace.projectQuotes(workspaceId, projectId)}
          className="mt-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
        >
          Back to Quotes
        </NextLink>
      </div>
    )
  }

  const editable = b.version ? isVersionEditable(b.version) : false
  const currency = b.summary?.currencyCode ?? 'USD'
  const clientLines = b.lines.filter((l) => l.clientVisible)
  const clientTerms = b.terms.filter((t) => t.clientVisible)

  const kpiItems = b.summary
    ? [
        {
          id: 'total',
          label: 'Quoted total',
          value: <CurrencyAmount amount={b.summary.totalQuotedAmount} currency={currency} />,
        },
        {
          id: 'cost',
          label: 'Cost base',
          value: <CurrencyAmount amount={b.summary.costBase} currency={currency} />,
        },
        {
          id: 'margin',
          label: 'Gross margin',
          value: <CurrencyAmount amount={b.summary.grossMargin} currency={currency} />,
        },
        {
          id: 'pct',
          label: 'Margin %',
          value: (
            <Typography weight="semibold">{formatPercent(b.summary.grossMarginPercent)}</Typography>
          ),
        },
      ]
    : []

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current={b.quote.code}
      />

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <NextLink
            href={ROUTES.workspace.projectQuotes(workspaceId, projectId)}
            className="mb-2 inline-block text-sm text-primary underline-offset-2 hover:underline"
          >
            ← Quote Register
          </NextLink>
          <Typography as="h1" size="md" weight="medium">
            {b.quote.title}
          </Typography>
          <div className="mt-2 flex flex-wrap items-center gap-sm">
            <Typography variant="small" tone="muted">
              {b.quote.code}
            </Typography>
            <Badge tone={quoteStatusTone(b.quote.status)}>{quoteStatusLabel(b.quote.status)}</Badge>
            {b.version ? (
              <>
                <Badge tone={quoteStatusTone(b.version.status)} size="sm">
                  v{b.version.versionNumber} · {quoteStatusLabel(b.version.status)}
                </Badge>
                {b.version.currentFlag ? (
                  <Badge tone="success" size="sm">
                    Current
                  </Badge>
                ) : null}
              </>
            ) : null}
            {b.quote.clientName ? (
              <Typography variant="small" tone="muted">
                · {b.quote.clientName}
              </Typography>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            icon={<RefreshCw size={16} />}
            loading={b.recalculating}
            disabled={!b.selectedVersionId}
            onClick={() => void run('Recalculated', () => b.recalculate())}
          >
            Recalculate
          </Button>
          {b.version && canSubmitVersion(b.version) ? (
            <Button
              variant="secondary"
              onClick={() => void run('Submitted', () => b.lifecycle('submit'))}
            >
              Submit
            </Button>
          ) : null}
          {b.version && canApproveVersion(b.version) ? (
            <Button
              variant="primary"
              onClick={() => void run('Approved', () => b.lifecycle('approve'))}
            >
              Approve
            </Button>
          ) : null}
          {b.version && canRejectVersion(b.version) ? (
            <Button
              variant="ghost"
              onClick={() => {
                const reason = window.prompt('Rejection reason') ?? ''
                if (!reason.trim()) return
                void run('Rejected', () => b.lifecycle('reject', reason.trim()))
              }}
            >
              Reject
            </Button>
          ) : null}
          {b.version && canSendVersion(b.version) ? (
            <Button
              variant="secondary"
              disabled={!FEATURES.wave3QuoteDocuments}
              title={
                FEATURES.wave3QuoteDocuments
                  ? undefined
                  : 'Send/document contract not available yet'
              }
              onClick={() => {
                if (!FEATURES.wave3QuoteDocuments) {
                  toast.message('Document/send is gated until the BE contract ships')
                  return
                }
                void run('Sent', () => b.lifecycle('send'))
              }}
            >
              Send
            </Button>
          ) : null}
          {b.version && canMarkAccepted(b.version) ? (
            <Button
              variant="primary"
              onClick={() => void run('Marked accepted', () => b.lifecycle('accept'))}
            >
              Mark accepted
            </Button>
          ) : null}
          {b.version && canDuplicateVersion(b.version) ? (
            <Button
              variant="ghost"
              onClick={() => void run('Version duplicated', () => b.duplicateVersion())}
            >
              Duplicate
            </Button>
          ) : null}
          {b.version && !b.version.currentFlag ? (
            <Button
              variant="ghost"
              onClick={() => void run('Marked current', () => b.lifecycle('markCurrent'))}
            >
              Mark current
            </Button>
          ) : null}
        </div>
      </div>

      {b.recalculating ? (
        <LongRunningJobState
          className="mb-4"
          status={LongRunningJobStatus.Running}
          label="Recalculating"
          message="Refreshing quote summary from the server…"
        />
      ) : null}

      {!FEATURES.wave3QuoteDocuments ? (
        <div className="mb-4 border border-neutral-200 bg-neutral-50 px-3 py-2">
          <Typography variant="caption" tone="muted">
            PDF generation and email send are disabled (`wave3QuoteDocuments`) until the backend
            document/send contract is available.
          </Typography>
        </div>
      ) : null}

      <div className="mb-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <Typography weight="semibold">Versions</Typography>
          <Button size="sm" variant="ghost" onClick={() => setNewVersionOpen((v) => !v)}>
            {newVersionOpen ? 'Cancel' : 'New version'}
          </Button>
        </div>
        {newVersionOpen ? (
          <div className="mb-3 flex flex-wrap items-end gap-2 border border-neutral-200 bg-neutral-50 p-3">
            <div className="min-w-[10rem]">
              <Typography variant="small" weight="medium" className="mb-1">
                Pricing
              </Typography>
              <Select
                value={nvPricing}
                onValueChange={setNvPricing}
                options={[
                  { value: QuotePricingMethod.CostPlusMargin, label: 'Cost + margin' },
                  { value: QuotePricingMethod.FixedPrice, label: 'Fixed price' },
                  {
                    value: QuotePricingMethod.TimeAndMaterials,
                    label: 'Time & materials',
                  },
                ]}
              />
            </div>
            <div className="min-w-[10rem]">
              <Typography variant="small" weight="medium" className="mb-1">
                Cost base
              </Typography>
              <Select
                value={nvCostBase}
                onValueChange={setNvCostBase}
                options={[
                  { value: QuoteCostBaseMethod.TotalCost, label: 'Total cost' },
                  { value: QuoteCostBaseMethod.LaborOnly, label: 'Labor only' },
                  { value: QuoteCostBaseMethod.DirectCost, label: 'Direct cost' },
                ]}
              />
            </div>
            <div className="min-w-[12rem]">
              <Typography variant="small" weight="medium" className="mb-1">
                Finance scenario
              </Typography>
              <Select
                value={nvScenario}
                onValueChange={setNvScenario}
                options={scenarios.map((s) => ({ value: s.id, label: s.label }))}
              />
            </div>
            <Input
              label="Target margin %"
              type="number"
              value={nvMargin}
              onChange={(e) => setNvMargin(e.target.value)}
            />
            <Input
              label="Valid until"
              type="date"
              value={nvValidUntil}
              onChange={(e) => setNvValidUntil(e.target.value)}
            />
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                void run('Version created', async () => {
                  await b.createVersion({
                    financeScenarioId: nvScenario || null,
                    pricingMethod: nvPricing as typeof QuotePricingMethod.CostPlusMargin,
                    costBaseMethod: nvCostBase as typeof QuoteCostBaseMethod.TotalCost,
                    targetMarginPercent: Number(nvMargin) || null,
                    generateLinesFrom: QuoteGenerateLinesFrom.Phases,
                    validUntil: nvValidUntil || null,
                    discountMethod: QuoteDiscountMethod.None,
                    proposalTitle: b.quote?.title ?? null,
                  })
                  setNewVersionOpen(false)
                })
              }
            >
              Create
            </Button>
          </div>
        ) : null}
        {b.versions.length > 0 ? (
          <VersionRail
            items={b.versions.map((v) => ({
              id: v.id,
              label: `v${v.versionNumber}`,
              statusLabel: quoteStatusLabel(v.status),
              statusTone: quoteStatusTone(v.status),
              current: v.currentFlag,
              timestamp: v.createdAt,
            }))}
            selectedId={b.selectedVersionId}
            onSelect={(id) => b.setSelectedVersionId(id)}
          />
        ) : (
          <Typography variant="small" tone="muted">
            No versions yet — create one to start pricing.
          </Typography>
        )}
      </div>

      {b.summary ? <FinancialKpiStrip items={kpiItems} mode="compact" className="mb-4" /> : null}

      <div className="mb-4 flex flex-wrap gap-1 border-b border-neutral-200">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => b.setSection(s.id)}
            className={
              b.section === s.id
                ? 'border-b-2 border-primary px-3 py-2 text-sm font-medium text-primary'
                : 'px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900'
            }
          >
            {s.label}
          </button>
        ))}
      </div>

      {b.section === 'pricing' && b.version ? (
        <div className="grid max-w-3xl gap-4 md:grid-cols-2">
          <Typography variant="small" tone="muted" className="md:col-span-2">
            {pricingMethodLabel(b.version.pricingMethod)}
            {b.version.validUntil ? ` · Valid until ${b.version.validUntil}` : ''}
          </Typography>
          <Input
            label="Target margin %"
            type="number"
            fullWidth
            disabled={!editable}
            defaultValue={b.version.targetMarginPercent ?? ''}
            onBlur={(e) => {
              if (!editable) return
              void run('Pricing updated', () =>
                b.updateVersion({ targetMarginPercent: Number(e.target.value) || null })
              )
            }}
          />
          <Input
            label="Valid until"
            type="date"
            fullWidth
            disabled={!editable}
            defaultValue={b.version.validUntil ?? ''}
            onBlur={(e) => {
              if (!editable) return
              void run('Valid until updated', () =>
                b.updateVersion({ validUntil: e.target.value || null })
              )
            }}
          />
          <Card className="border border-neutral-200 bg-neutral-50 p-4 md:col-span-2">
            <Typography weight="semibold" className="mb-2">
              Target margin solver
            </Typography>
            <div className="flex flex-wrap items-end gap-2">
              <Input
                label="Target margin %"
                type="number"
                value={solverMargin}
                onChange={(e) => setSolverMargin(e.target.value)}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  void run('Solved', () =>
                    b.solveMargin({
                      costBase: b.summary?.costBase ?? 0,
                      targetMarginPercent: Number(solverMargin) || 0,
                      currencyCode: currency,
                    })
                  )
                }
              >
                Solve
              </Button>
            </div>
            {b.solverResult ? (
              <div className="mt-3 space-y-1">
                <Typography variant="small">
                  Required contract value:{' '}
                  <CurrencyAmount
                    amount={b.solverResult.requiredContractValue}
                    currency={b.solverResult.currencyCode}
                    size="sm"
                  />
                </Typography>
                <Typography variant="caption" tone="muted">
                  Result is advisory — not auto-applied.
                </Typography>
              </div>
            ) : null}
          </Card>
        </div>
      ) : null}

      {b.section === 'lines' ? (
        <div>
          {editable ? (
            <div className="mb-3 flex flex-wrap items-end gap-2">
              <Select
                value={lineType}
                onValueChange={setLineType}
                options={[
                  { value: QuoteLineType.Phase, label: 'Phase' },
                  { value: QuoteLineType.Milestone, label: 'Milestone' },
                  { value: QuoteLineType.License, label: 'License' },
                  { value: QuoteLineType.Custom, label: 'Custom' },
                  { value: QuoteLineType.Discount, label: 'Discount' },
                ]}
              />
              <Input label="Name" value={lineName} onChange={(e) => setLineName(e.target.value)} />
              <Input
                label="Unit price"
                type="number"
                value={linePrice}
                onChange={(e) => setLinePrice(e.target.value)}
              />
              <Button
                size="sm"
                variant="primary"
                icon={<Plus size={14} />}
                onClick={() =>
                  void run('Line added', async () => {
                    await b.addLine({
                      lineType: lineType as typeof QuoteLineType.Custom,
                      name: lineName.trim(),
                      quantity: 1,
                      unitPrice: Number(linePrice) || 0,
                      clientVisible: true,
                      displayOrder: b.lines.length + 1,
                    })
                    setLineName('')
                    setLinePrice('')
                  })
                }
              >
                Add line
              </Button>
            </div>
          ) : null}
          <DataTable
            className="border border-neutral-200"
            ariaLabel="Quote lines"
            rows={b.lines}
            rowKey={(line) => line.id}
            emptyMessage="No lines"
            columns={[
              { id: 'type', header: 'Type', accessor: 'lineType' },
              {
                id: 'name',
                header: 'Name',
                cell: (line) => (
                  <>
                    <Typography>{line.name || '—'}</Typography>
                    {line.internalNote ? (
                      <Typography variant="caption" tone="muted" className="block">
                        Internal: {line.internalNote}
                      </Typography>
                    ) : null}
                  </>
                ),
              },
              { id: 'quantity', header: 'Qty', accessor: 'quantity' },
              {
                id: 'unit',
                header: 'Unit',
                cell: (line) => (
                  <CurrencyAmount amount={line.unitPrice} currency={line.currencyCode} size="sm" />
                ),
              },
              {
                id: 'amount',
                header: 'Amount',
                cell: (line) => (
                  <CurrencyAmount amount={line.amount} currency={line.currencyCode} size="sm" />
                ),
              },
              {
                id: 'client',
                header: 'Client',
                accessor: (line) => (line.clientVisible ? 'Yes' : 'No'),
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (line) =>
                  editable ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void run('Line deleted', () => b.removeLine(line.id))}
                    >
                      Delete
                    </Button>
                  ) : (
                    '—'
                  ),
              },
            ]}
          />
        </div>
      ) : null}

      {b.section === 'terms' ? (
        <div>
          {editable ? (
            <Card className="mb-3 space-y-2 border border-neutral-200 bg-neutral-50 p-3">
              <Select
                value={termType}
                onValueChange={setTermType}
                options={[
                  { value: QuoteTermType.Payment, label: 'Payment' },
                  { value: QuoteTermType.Warranty, label: 'Warranty' },
                  { value: QuoteTermType.Delivery, label: 'Delivery' },
                  { value: QuoteTermType.Scope, label: 'Scope' },
                  { value: QuoteTermType.Legal, label: 'Legal' },
                  { value: QuoteTermType.Custom, label: 'Custom' },
                ]}
              />
              <Input
                label="Title"
                fullWidth
                value={termTitle}
                onChange={(e) => setTermTitle(e.target.value)}
              />
              <Textarea
                value={termContent}
                onChange={(e) => setTermContent(e.target.value)}
                rows={3}
                placeholder="Term content"
              />
              <Button
                size="sm"
                variant="primary"
                onClick={() =>
                  void run('Term added', async () => {
                    await b.addTerm({
                      termType: termType as typeof QuoteTermType.Payment,
                      title: termTitle.trim(),
                      content: termContent.trim(),
                      clientVisible: true,
                      displayOrder: b.terms.length + 1,
                    })
                    setTermTitle('')
                    setTermContent('')
                  })
                }
              >
                Add term
              </Button>
            </Card>
          ) : null}
          <div className="space-y-3">
            {b.terms.length === 0 ? (
              <Typography variant="small" tone="muted">
                No terms
              </Typography>
            ) : (
              b.terms.map((t) => (
                <Card key={t.id} className="border border-neutral-200 p-3">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                    <Typography weight="medium">
                      {t.title}{' '}
                      <Badge size="sm" tone="neutral">
                        {t.termType}
                      </Badge>
                    </Typography>
                    {editable ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => void run('Term deleted', () => b.removeTerm(t.id))}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                  <Typography variant="small" className="whitespace-pre-wrap">
                    {t.content}
                  </Typography>
                  {!t.clientVisible ? (
                    <Typography variant="caption" tone="muted" className="mt-1 block">
                      Internal only
                    </Typography>
                  ) : null}
                </Card>
              ))
            )}
          </div>
        </div>
      ) : null}

      {b.section === 'client' ? (
        <div className="max-w-lg space-y-3">
          <Input
            label="Client name"
            fullWidth
            defaultValue={b.quote.clientName ?? ''}
            onBlur={(e) =>
              void run('Client updated', () =>
                b.updateQuoteMeta({ clientName: e.target.value || null })
              )
            }
          />
          <Input
            label="Company"
            fullWidth
            defaultValue={b.quote.clientCompany ?? ''}
            onBlur={(e) =>
              void run('Client updated', () =>
                b.updateQuoteMeta({ clientCompany: e.target.value || null })
              )
            }
          />
          <Input
            label="Email"
            fullWidth
            defaultValue={b.quote.clientEmail ?? ''}
            onBlur={(e) =>
              void run('Client updated', () =>
                b.updateQuoteMeta({ clientEmail: e.target.value || null })
              )
            }
          />
          <Input
            label="Contact"
            fullWidth
            defaultValue={b.quote.clientContactName ?? ''}
            onBlur={(e) =>
              void run('Client updated', () =>
                b.updateQuoteMeta({ clientContactName: e.target.value || null })
              )
            }
          />
          <Input
            label="Reference"
            fullWidth
            defaultValue={b.quote.clientReference ?? ''}
            onBlur={(e) =>
              void run('Client updated', () =>
                b.updateQuoteMeta({ clientReference: e.target.value || null })
              )
            }
          />
        </div>
      ) : null}

      {b.section === 'proposal' && b.version ? (
        <div className="max-w-lg space-y-3">
          <Input
            label="Proposal title"
            fullWidth
            disabled={!editable}
            defaultValue={b.version.proposalTitle ?? ''}
            onBlur={(e) => {
              if (!editable) return
              void run('Proposal updated', () =>
                b.updateVersion({ proposalTitle: e.target.value || null })
              )
            }}
          />
          <div>
            <Typography variant="small" weight="medium" className="mb-1">
              Proposal notes
            </Typography>
            <Textarea
              disabled={!editable}
              defaultValue={b.version.proposalNotes ?? ''}
              rows={4}
              onBlur={(e) => {
                if (!editable) return
                void run('Proposal updated', () =>
                  b.updateVersion({ proposalNotes: e.target.value || null })
                )
              }}
            />
          </div>
        </div>
      ) : null}

      {b.section === 'summary' && b.summary ? (
        <DataTable
          className="border border-neutral-200"
          ariaLabel="Quote summary"
          rows={[
            ...(
              [
                ['Cost base', b.summary.costBase],
                ['Direct cost', b.summary.directCost],
                ['Overhead', b.summary.overhead],
                ['Subtotal before discount', b.summary.subtotalBeforeDiscount],
                ['Discount', b.summary.discountAmount ?? 0],
                ['Subtotal after discount', b.summary.subtotalAfterDiscount],
                ['Tax', b.summary.taxAmount],
                ['Total quoted', b.summary.totalQuotedAmount],
                ['Required contract value', b.summary.requiredContractValue ?? 0],
                ['Gross margin', b.summary.grossMargin],
                ['PBT', b.summary.profitBeforeTax],
              ] as const
            ).map(([label, amount]) => ({
              label,
              value: <CurrencyAmount amount={amount} currency={currency} size="sm" />,
            })),
            { label: 'Margin %', value: formatPercent(b.summary.grossMarginPercent) },
            { label: 'Formula', value: b.summary.formulaVersion ?? '—' },
          ]}
          rowKey={(row) => row.label}
          columns={[
            { id: 'metric', header: 'Metric', accessor: 'label' },
            { id: 'value', header: 'Value', accessor: 'value' },
          ]}
        />
      ) : null}

      {b.section === 'preview' ? (
        <Card className="mx-auto max-w-2xl border border-neutral-200 bg-white p-6">
          <Typography as="h2" size="md" weight="medium" className="mb-1">
            {b.version?.proposalTitle ?? b.quote.title}
          </Typography>
          <Typography variant="small" tone="muted" className="mb-4">
            For {b.quote.clientCompany ?? b.quote.clientName ?? 'Client'}
            {b.version?.validUntil ? ` · Valid until ${b.version.validUntil}` : ''}
          </Typography>
          {b.version?.proposalNotes ? (
            <Typography variant="small" className="mb-4 whitespace-pre-wrap">
              {b.version.proposalNotes}
            </Typography>
          ) : null}
          <Typography weight="semibold" className="mb-2">
            Line items
          </Typography>
          <ul className="mb-4 space-y-2">
            {clientLines.map((l) => (
              <li key={l.id} className="flex justify-between gap-4 text-sm">
                <span>
                  {l.name}
                  {l.description ? (
                    <span className="block text-neutral-500">{l.description}</span>
                  ) : null}
                </span>
                <CurrencyAmount amount={l.amount} currency={l.currencyCode} size="sm" />
              </li>
            ))}
          </ul>
          {b.summary ? (
            <div className="mb-4 border-t border-neutral-200 pt-3 text-right">
              <Typography weight="semibold">
                Total <CurrencyAmount amount={b.summary.totalQuotedAmount} currency={currency} />
              </Typography>
            </div>
          ) : null}
          <Typography weight="semibold" className="mb-2">
            Terms
          </Typography>
          <div className="space-y-3">
            {clientTerms.map((t) => (
              <div key={t.id}>
                <Typography weight="medium" variant="small">
                  {t.title}
                </Typography>
                <Typography variant="small" className="whitespace-pre-wrap">
                  {t.content}
                </Typography>
              </div>
            ))}
          </div>
          <Typography variant="caption" tone="muted" className="mt-6 block">
            Client preview excludes internal notes, cost base, and margin details.
          </Typography>
        </Card>
      ) : null}
    </div>
  )
}
