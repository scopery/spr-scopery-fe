'use client'

import { Search } from 'lucide-react'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button, Input, Stack, Typography, Skeleton } from '@/shared/ui'
import { useRateResolution } from '../hooks/useRateResolution'

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function formatMoney(amount: number | null, currency: string): string {
  if (amount == null) return '—'
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

/** User-friendly rate lookup — hides internal IDs and shows only the rates that matter. */
export function RateLookupView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { result, loading, error, resolve } = useRateResolution()

  const [form, setForm] = useState({
    costRoleCode: '',
    targetDate: todayIso(),
    currencyCode: '',
  })

  const canSubmit = Boolean(form.costRoleCode.trim()) && Boolean(form.targetDate)

  const handleSubmit = async () => {
    try {
      await resolve({
        workspaceId,
        costRoleCode: form.costRoleCode.trim(),
        targetDate: form.targetDate,
        currencyCode: form.currencyCode.trim() || undefined,
      })
    } catch {
      // toast already shown by the hook
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Rate Lookup
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Check the current cost and billing rate for a role as of a given date.
        </Typography>
      </div>

      <div className="border border-neutral-200 bg-white p-5">
        <Stack direction="vertical" spacing="md">
          <Input
            label="Role code"
            value={form.costRoleCode}
            onChange={(e) => setForm((f) => ({ ...f, costRoleCode: e.target.value }))}
            placeholder="SWE"
          />
          <Input
            label="As of date"
            type="date"
            value={form.targetDate}
            onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
          />
          <Input
            label="Currency (optional)"
            value={form.currencyCode}
            onChange={(e) => setForm((f) => ({ ...f, currencyCode: e.target.value }))}
            placeholder="USD"
          />
          <Button
            variant="primary"
            onClick={() => void handleSubmit()}
            disabled={!canSubmit || loading}
            loading={loading} icon={<Search size={16} />}>
            Look up rate
          </Button>
        </Stack>
      </div>

      {loading ? (
        <div className="mt-6 flex justify-center">
          <Skeleton variant="rectangular" width="100%" height={80} />
        </div>
      ) : error ? (
        <div className="mt-6 border border-red-200 bg-red-50 p-4">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : result ? (
        <div className="mt-6 border border-neutral-200 bg-white p-5">
          <Typography weight="semibold" variant="small" className="mb-3">
            {result.costRoleCode}
          </Typography>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Typography variant="small" tone="muted">
                Cost rate / hour
              </Typography>
              <Typography size="lg" weight="bold">
                {formatMoney(result.adjustedCostRate, result.currencyCode)}
              </Typography>
            </div>
            <div>
              <Typography variant="small" tone="muted">
                Billing rate / hour
              </Typography>
              <Typography size="lg" weight="bold">
                {formatMoney(result.adjustedBillingRate, result.currencyCode)}
              </Typography>
            </div>
          </div>
          <Typography variant="small" tone="muted" className="mt-4">
            As of {result.resolvedForDate}
            {result.inflationPercent != null
              ? ` · ${result.inflationPercent}% inflation applied`
              : ''}
          </Typography>
        </div>
      ) : null}
    </div>
  )
}
