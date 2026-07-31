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
import { useTrustDashboard } from '../hooks/useTrustDashboard'

export function TrustDashboardView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const {
    data,
    retentionPolicies,
    campaigns,
    findings,
    evidence,
    classificationPolicy,
    sensitiveObjects,
    consents,
    suppressions,
    exportAuditLogs,
    privacyExports,
    retentionJobs,
    loading,
    error,
    actionError,
    dryRunResult,
    dryRunRetention,
    startCampaign,
    completeCampaign,
    cancelCampaign,
    resolveFinding,
    dismissFinding,
    finalizeEvidence,
    withdrawConsent,
    releaseSuppression,
  } = useTrustDashboard(workspaceId)

  if (loading) return <PageSkeleton variant="cards" className="px-3 py-3 lg:px-4 lg:py-3" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="px-3 py-3 lg:px-4 lg:py-3">
      <Typography as="h1" size="md" weight="medium">
        Trust & Compliance
      </Typography>
      <div className="flex flex-wrap gap-sm">
        <ClassificationBadge level={ClassificationLevel.Confidential} />
        <MaskedValue masked />
      </div>
      <div className="grid grid-cols-1 gap-md md:grid-cols-3">
        <div className="border border-neutral-200 p-md">
          <Typography variant="caption" tone="muted">
            Privacy requests
          </Typography>
          <Typography size="md" weight="medium">
            {data?.openPrivacyRequests ?? 0}
          </Typography>
        </div>
        <div className="border border-neutral-200 p-md">
          <Typography variant="caption" tone="muted">
            Legal holds
          </Typography>
          <Typography size="md" weight="medium">
            {data?.activeLegalHolds ?? 0}
          </Typography>
        </div>
        <div className="border border-neutral-200 p-md">
          <Typography variant="caption" tone="muted">
            Access reviews
          </Typography>
          <Typography size="md" weight="medium">
            {data?.pendingAccessReviews ?? 0}
          </Typography>
        </div>
      </div>

      {actionError ? <Typography tone="error">{actionError}</Typography> : null}
      {dryRunResult ? <Typography tone="muted">{dryRunResult}</Typography> : null}

      <Typography variant="h4">Retention policies</Typography>
      {retentionPolicies.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No retention policies.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {retentionPolicies.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {p.name}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {[
                    p.policyCode,
                    p.retentionAction,
                    p.retentionPeriodDays && `${p.retentionPeriodDays}d`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              </div>
              <Button size="sm" variant="outline" onClick={() => void dryRunRetention(p.id)}>
                Dry-run
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Access review campaigns</Typography>
      {campaigns.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No access review campaigns.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {campaigns.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {c.name ?? '—'}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {c.status}
                </Typography>
              </div>
              <div className="flex gap-xs">
                <Button size="sm" variant="outline" onClick={() => void startCampaign(c.id)}>
                  Start
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void completeCampaign(c.id)}>
                  Complete
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void cancelCampaign(c.id)}>
                  Cancel
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Permission findings</Typography>
      {findings.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No findings.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {findings.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {f.summary ?? '—'}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {f.status}
                </Typography>
              </div>
              <div className="flex gap-xs">
                <Button size="sm" variant="outline" onClick={() => void resolveFinding(f.id)}>
                  Resolve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void dismissFinding(f.id)}>
                  Dismiss
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Compliance evidence</Typography>
      {evidence.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No evidence records.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {evidence.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {e.title ?? '—'}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {[e.evidenceType, e.status].filter(Boolean).join(' · ')}
                </Typography>
              </div>
              <Button size="sm" variant="outline" onClick={() => void finalizeEvidence(e.id)}>
                Finalize
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Classification policy</Typography>
      <Typography variant="caption" tone="muted">
        Default level: {classificationPolicy?.defaultLevel ?? '—'}
      </Typography>

      <Typography variant="h4">Sensitive objects</Typography>
      {sensitiveObjects.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No sensitive objects.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {sensitiveObjects.map((o) => (
            <li key={o.id} className="p-md text-sm">
              {[o.objectType, o.classification, o.status].filter(Boolean).join(' · ') || '—'}
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Consent records</Typography>
      {consents.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No consent records.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {consents.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {c.subjectLabel ?? '—'}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {c.status}
                </Typography>
              </div>
              <Button size="sm" variant="outline" onClick={() => void withdrawConsent(c.id)}>
                Withdraw
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Contact suppressions</Typography>
      {suppressions.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No suppressions.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {suppressions.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {s.channel ?? '—'}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {s.status}
                </Typography>
              </div>
              <Button size="sm" variant="outline" onClick={() => void releaseSuppression(s.id)}>
                Release
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Exports & retention jobs</Typography>
      <Typography variant="caption" tone="muted">
        Export audit: {exportAuditLogs.length} · Privacy packages: {privacyExports.length} ·
        Retention jobs: {retentionJobs.length}
      </Typography>

      <Typography tone="muted">
        Dangerous operations require dry-run / readiness checks and legal-hold validation.
      </Typography>
    </Stack>
  )
}
