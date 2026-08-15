'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
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
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { ROUTES } from '@/constants/routes'
import { financeApi } from '@/modules/finance'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import { useQuotes } from '../hooks/useQuotes'
import { CreateQuoteModal } from './CreateQuoteModal'
import { formatPercent, quoteStatusLabel, quoteStatusTone } from '../../domain/rules/quote.rules'
import { QuoteStatus } from '../../domain/enums/quote.enum'

function formatUpdated(value: string): string {
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

export function QuotesRegisterView() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const [createOpen, setCreateOpen] = useState(false)
  const [scenarios, setScenarios] = useState<Array<{ id: string; label: string }>>([])

  const { project } = useProject(workspaceId, projectId)
  const {
    quotes,
    loading,
    creating,
    error,
    forbidden,
    statusFilter,
    setStatusFilter,
    create,
    archive,
  } = useQuotes(projectId)

  useEffect(() => {
    if (!projectId) return
    void financeApi
      .listFinanceScenarios(projectId)
      .then((list) => setScenarios(list.map((s) => ({ id: s.id, label: `${s.name} (${s.code})` }))))
      .catch(() => setScenarios([]))
  }, [projectId])

  if (loading && quotes.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <Card className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to quotes</Typography>
      </Card>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Quotes"
      />

      <div className="mb-2 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Quote Register
          </Typography>
          {project ? (
            <Typography variant="small" tone="muted" className="mt-1">
              {project.code} · {project.name}
            </Typography>
          ) : null}
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          loading={creating}
          onClick={() => setCreateOpen(true)}
        >
          Create quote
        </Button>
      </div>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <div className="mb-4 max-w-xs">
        <Typography variant="small" weight="medium" className="mb-1">
          Status
        </Typography>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={[
            { value: 'all', label: 'All' },
            ...Object.values(QuoteStatus).map((s) => ({
              value: s,
              label: quoteStatusLabel(s),
            })),
          ]}
        />
      </div>

      <DataTable
        className="border border-neutral-200"
        ariaLabel="Quotes"
        rows={quotes}
        rowKey={(quote) => quote.id}
        emptyMessage="No quotes yet"
        columns={[
          {
            id: 'quote',
            header: 'Quote',
            cell: (q) => (
              <NextLink
                href={ROUTES.workspace.projectQuote(workspaceId, projectId, q.id)}
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                {q.title}
              </NextLink>
            ),
          },
          { id: 'code', header: 'Code', accessor: (q) => q.code || '—', kind: 'code' },
          {
            id: 'client',
            header: 'Client',
            kind: 'reference',
            cell: (q) => (
              <>
                <Typography variant="small">{q.clientName ?? '—'}</Typography>
                {q.clientCompany ? (
                  <Typography variant="caption" tone="muted" className="block">
                    {q.clientCompany}
                  </Typography>
                ) : null}
              </>
            ),
          },
          {
            id: 'status',
            header: 'Status',
            cell: (q) => (
              <Badge tone={quoteStatusTone(q.status)}>{quoteStatusLabel(q.status)}</Badge>
            ),
          },
          {
            id: 'total',
            header: 'Total',
            cell: (q) =>
              q.summary ? (
                <CurrencyAmount
                  amount={q.summary.totalQuotedAmount}
                  currency={q.summary.currencyCode}
                  size="sm"
                />
              ) : (
                '—'
              ),
          },
          {
            id: 'margin',
            header: 'Margin %',
            accessor: (q) => (q.summary ? formatPercent(q.summary.grossMarginPercent) : '—'),
          },
          { id: 'validUntil', header: 'Valid until', accessor: () => '—' },
          { id: 'updated', header: 'Updated', accessor: (q) => formatUpdated(q.updatedAt) },
          {
            id: 'actions',
            header: 'Actions',
            cell: (q) =>
              q.status !== QuoteStatus.Archived ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (!window.confirm(`Archive “${q.title}”?`)) return
                    void archive(q.id)
                      .then(() => toast.success('Quote archived'))
                      .catch((err) => toast.error(getProblemToastMessage(err)))
                  }}
                >
                  Archive
                </Button>
              ) : (
                '—'
              ),
          },
        ]}
      />

      <CreateQuoteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        financeScenarios={scenarios}
        onSubmit={async (body) => {
          try {
            const created = await create(body)
            toast.success('Quote created')
            if (created) {
              router.push(ROUTES.workspace.projectQuote(workspaceId, projectId, created.id))
            }
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
