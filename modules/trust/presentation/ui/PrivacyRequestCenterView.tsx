'use client'

import { useParams } from 'next/navigation'
import {
  Button,
  ClassificationBadge,
  ClassificationLevel,
  MaskedValue,
  PageSkeleton,
  Stack,
  Typography,
} from '@/shared/ui'
import { usePrivacyRequests } from '../hooks/usePrivacyRequests'

export function PrivacyRequestCenterView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    items,
    holds,
    plans,
    selectedPlanId,
    setSelectedPlanId,
    dryRunOk,
    hasActiveLegalHold,
    loading,
    error,
    actionError,
    runDryRun,
    execute,
  } = usePrivacyRequests(workspaceId)

  if (loading) return <PageSkeleton variant="list" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md">
      <Typography as="h1" size="md" weight="medium">
        Privacy Request Center
      </Typography>
      <div className="flex flex-wrap gap-sm">
        <ClassificationBadge level={ClassificationLevel.Restricted} />
        <MaskedValue masked />
      </div>
      <Typography tone="muted">
        Export / anonymize require dry-run and legal-hold checks before execute.
      </Typography>
      {hasActiveLegalHold ? (
        <Typography tone="error">
          Active legal holds (
          {holds.filter((h) => h.status === 'ACTIVE' || h.status === 'HELD').length}) — execute is
          blocked.
        </Typography>
      ) : null}
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}

      {plans.length > 0 ? (
        <label className="flex flex-col gap-xs text-sm">
          Anonymization plan
          <select
            className="border border-neutral-300 bg-white px-sm py-xs"
            value={selectedPlanId ?? ''}
            onChange={(e) => {
              setSelectedPlanId(e.target.value)
            }}
            aria-label="Anonymization plan"
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name ?? 'Unnamed plan'} · {p.status}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <Typography tone="muted" variant="caption">
          No anonymization plans.
        </Typography>
      )}

      <div className="flex flex-wrap gap-sm">
        <Button
          size="sm"
          variant="outline"
          disabled={!selectedPlanId}
          onClick={() => void runDryRun()}
        >
          Dry-run anonymization
        </Button>
        <Button
          size="sm"
          disabled={!dryRunOk || hasActiveLegalHold || !selectedPlanId}
          title={
            hasActiveLegalHold
              ? 'Blocked by legal hold'
              : !dryRunOk
                ? 'Complete dry-run first'
                : undefined
          }
          onClick={() => void execute()}
        >
          Execute anonymization
        </Button>
      </div>

      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {items.map((r) => (
          <li key={r.id} className="p-md">
            <Typography variant="small" weight="medium">
              {r.subjectLabel}
            </Typography>
            <Typography variant="caption" tone="muted">
              {[r.type, r.status].join(' · ')}
            </Typography>
          </li>
        ))}
      </ul>
    </Stack>
  )
}
