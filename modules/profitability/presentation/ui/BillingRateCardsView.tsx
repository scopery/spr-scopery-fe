'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  CurrencyAmount,
  PageSkeleton,
  Typography,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useBillingRateCards } from '../hooks/useBillingRateCards'
import { CreateProfitRateCardModal } from './CreateProfitRateCardModal'
import {
  rateCardScopeLabel,
  rateTypeLabel,
} from '../../domain/rules/profitability.rules'

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
  const scopeId = scopeIdProp ?? (scope === 'workspace' ? workspaceId : projectId ?? null)

  const [createOpen, setCreateOpen] = useState(false)
  const { cards, loading, error, create, archive } = useBillingRateCards(scope, scopeId)

  if (loading && cards.length === 0) return <PageSkeleton variant="list" />

  return (
    <div>
      {!embedded ? (
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 pb-6">
          <div>
            <Typography as="h1" size="lg" weight="semibold">
              {title}
            </Typography>
            <Typography variant="small" tone="muted" className="mt-1">
              Billing / profit rates for commercial work. Distinct from Cost Rate Cards under
              Costs.
            </Typography>
          </div>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setCreateOpen(true)}
          >
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

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Scope</th>
              <th className="px-4 py-3 font-medium">Hourly</th>
              <th className="px-4 py-3 font-medium">Daily</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cards.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">
                    No billing rate cards yet
                  </Typography>
                </td>
              </tr>
            ) : (
              cards.map((card) => (
                <tr key={card.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium">{card.rateCode}</td>
                  <td className="px-4 py-3">{card.name}</td>
                  <td className="px-4 py-3">{rateTypeLabel(card.rateType)}</td>
                  <td className="px-4 py-3">{card.roleName ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge size="sm" tone="info">
                      {rateCardScopeLabel(card.projectId)}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <CurrencyAmount
                      amount={card.amountPerHour}
                      currency={card.currency}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <CurrencyAmount
                      amount={card.amountPerDay}
                      currency={card.currency}
                      size="sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      size="sm"
                      tone={card.status === 'ACTIVE' ? 'success' : 'neutral'}
                    >
                      {card.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {card.status !== 'ARCHIVED' ? (
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
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
