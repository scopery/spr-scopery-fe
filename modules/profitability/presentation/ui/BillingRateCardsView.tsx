'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, CurrencyAmount, DataTable, PageSkeleton, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useBillingRateCards } from '../hooks/useBillingRateCards'
import { CreateProfitRateCardModal } from './CreateProfitRateCardModal'
import { rateCardScopeLabel, rateTypeLabel } from '../../domain/rules/profitability.rules'

interface BillingRateCardsViewProps {
  /** When omitted, uses workspace route params. */
  scope?: 'workspace' | 'project'
  scopeId?: string
  title?: string
  embedded?: boolean
}

export function BillingRateCardsView({
  scope = 'workspace',
  scopeId: scopeIdProp,
  title = 'Billing Rate Cards',
  embedded = false,
}: BillingRateCardsViewProps) {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string | undefined
  const scopeId = scopeIdProp ?? (scope === 'workspace' ? workspaceId : (projectId ?? null))

  const [createOpen, setCreateOpen] = useState(false)
  const { cards, loading, error, create, archive } = useBillingRateCards(scope, scopeId)

  if (loading && cards.length === 0) return <PageSkeleton variant="list" />

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      {!embedded ? (
        <div className="mb-2 flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-2">
          <div>
            <Typography as="h1" size="md" weight="medium">
              {title}
            </Typography>
            <Typography variant="small" tone="muted" className="mt-1">
              Billing / profit rates for commercial work. Distinct from Cost Rate Cards under Costs.
            </Typography>
          </div>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
            Add rate card
          </Button>
        </div>
      ) : (
        <div className="mb-3 flex justify-end">
          <Button
            size="sm"
            variant="primary"
            icon={<Plus size={14} />}
            onClick={() => setCreateOpen(true)}
          >
            Add rate card
          </Button>
        </div>
      )}

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <DataTable
        ariaLabel="Billing rate cards"
        rows={cards}
        rowKey={(card) => card.id}
        emptyMessage="No billing rate cards yet"
        columns={[
          { id: 'code', header: 'Code', accessor: (card) => card.rateCode || '—', kind: 'code' },
          { id: 'name', header: 'Name', accessor: (card) => card.name || '—' },
          { id: 'type', header: 'Type', accessor: (card) => rateTypeLabel(card.rateType) },
          {
            id: 'role',
            header: 'Role',
            accessor: (card) => card.roleName ?? '—',
            kind: 'reference',
          },
          {
            id: 'scope',
            header: 'Scope',
            cell: (card) => (
              <Badge size="sm" tone="info">
                {rateCardScopeLabel(card.projectId)}
              </Badge>
            ),
          },
          {
            id: 'hourly',
            header: 'Hourly',
            cell: (card) => (
              <CurrencyAmount amount={card.amountPerHour} currency={card.currency} size="sm" />
            ),
          },
          {
            id: 'daily',
            header: 'Daily',
            cell: (card) => (
              <CurrencyAmount amount={card.amountPerDay} currency={card.currency} size="sm" />
            ),
          },
          {
            id: 'status',
            header: 'Status',
            cell: (card) => (
              <Badge size="sm" tone={card.status === 'ACTIVE' ? 'success' : 'neutral'}>
                {card.status}
              </Badge>
            ),
          },
          {
            id: 'actions',
            header: 'Actions',
            cell: (card) =>
              card.status !== 'ARCHIVED' ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (!window.confirm(`Archive “${card.name}”?`)) return
                    void archive(card.id)
                      .then(() => toast.success('Rate card archived'))
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

      <CreateProfitRateCardModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (body) => {
          try {
            await create(body)
            toast.success('Billing rate card created')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
