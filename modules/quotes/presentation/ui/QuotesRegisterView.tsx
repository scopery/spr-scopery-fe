'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  CurrencyAmount,
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
import {
  formatPercent,
  quoteStatusLabel,
  quoteStatusTone,
} from '../../domain/rules/quote.rules'
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
      .then((list) =>
        setScenarios(list.map((s) => ({ id: s.id, label: `${s.name} (${s.code})` })))
      )
      .catch(() => setScenarios([]))
  }, [projectId])

  if (loading && quotes.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to quotes</Typography>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Quotes"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
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

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Quote</th>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Client</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Margin %</th>
              <th className="px-4 py-3 font-medium">Valid until</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">
                    No quotes yet
                  </Typography>
                </td>
              </tr>
            ) : (
              quotes.map((q) => (
                <tr key={q.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-4 py-3">
                    <NextLink
                      href={ROUTES.workspace.projectQuote(workspaceId, projectId, q.id)}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      {q.title}
                    </NextLink>
                  </td>
                  <td className="px-4 py-3">{q.code}</td>
                  <td className="px-4 py-3">
                    <Typography variant="small">{q.clientName ?? '—'}</Typography>
                    {q.clientCompany ? (
                      <Typography variant="caption" tone="muted" className="block">
                        {q.clientCompany}
                      </Typography>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={quoteStatusTone(q.status)}>
                      {quoteStatusLabel(q.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {q.summary ? (
                      <CurrencyAmount
                        amount={q.summary.totalQuotedAmount}
                        currency={q.summary.currencyCode}
                        size="sm"
                      />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {q.summary ? formatPercent(q.summary.grossMarginPercent) : '—'}
                  </td>
                  <td className="px-4 py-3">—</td>
                  <td className="px-4 py-3">
                    <Typography variant="small" tone="muted">
                      {formatUpdated(q.updatedAt)}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">
                    {q.status !== QuoteStatus.Archived ? (
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
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <CreateQuoteModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        financeScenarios={scenarios}
        onSubmit={async (body) => {
          try {
            const created = await create(body)
            toast.success('Quote created')
            if (created) {
              router.push(
                ROUTES.workspace.projectQuote(workspaceId, projectId, created.id)
              )
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
