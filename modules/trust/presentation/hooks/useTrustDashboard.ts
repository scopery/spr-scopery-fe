'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../../infrastructure/api/trust.api'
import type { TrustDashboardSummary } from '../../domain/model/trust'
import type {
  AccessReviewCampaign,
  ClassificationPolicy,
  ConsentRecord,
  ContactSuppression,
  EvidenceRecord,
  PermissionReviewFinding,
  RetentionPolicy,
  SensitiveObject,
} from '../../infrastructure/api/trust.api'

export function useTrustDashboard(workspaceId: string | null) {
  const [data, setData] = useState<TrustDashboardSummary | null>(null)
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([])
  const [campaigns, setCampaigns] = useState<AccessReviewCampaign[]>([])
  const [findings, setFindings] = useState<PermissionReviewFinding[]>([])
  const [evidence, setEvidence] = useState<EvidenceRecord[]>([])
  const [classificationPolicy, setClassificationPolicy] = useState<ClassificationPolicy | null>(
    null
  )
  const [sensitiveObjects, setSensitiveObjects] = useState<SensitiveObject[]>([])
  const [consents, setConsents] = useState<ConsentRecord[]>([])
  const [suppressions, setSuppressions] = useState<ContactSuppression[]>([])
  const [exportAuditLogs, setExportAuditLogs] = useState<Array<{ id: string; status?: string }>>(
    []
  )
  const [privacyExports, setPrivacyExports] = useState<Array<{ id: string; status?: string }>>([])
  const [retentionJobs, setRetentionJobs] = useState<Array<{ id: string; status?: string }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [dryRunResult, setDryRunResult] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [
        dash,
        retention,
        access,
        find,
        evid,
        policy,
        sensitive,
        consent,
        suppress,
        exportLogs,
        privacyPkgs,
        retJobs,
      ] = await Promise.all([
        api.getTrustDashboard(workspaceId),
        api.listRetentionPolicies(workspaceId),
        api.listAccessReviewCampaigns(workspaceId),
        api.listPermissionFindings(workspaceId),
        api.listEvidenceRecords(workspaceId),
        api.getClassificationPolicy(workspaceId),
        api.listSensitiveObjects(workspaceId),
        api.listConsentRecords(workspaceId),
        api.listContactSuppressions(workspaceId),
        api.listExportAuditLogs(workspaceId),
        api.listPrivacyExportPackages(workspaceId),
        api.listRetentionJobs(workspaceId),
      ])
      setData(dash)
      setRetentionPolicies(retention.items)
      setCampaigns(access.items)
      setFindings(find.items)
      setEvidence(evid.items)
      setClassificationPolicy(policy)
      setSensitiveObjects(sensitive.items)
      setConsents(consent.items)
      setSuppressions(suppress.items)
      setExportAuditLogs(exportLogs.items)
      setPrivacyExports(privacyPkgs.items)
      setRetentionJobs(retJobs.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trust dashboard')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const dryRunRetention = useCallback(
    async (policyId: string) => {
      if (!workspaceId) return
      setActionError(null)
      setDryRunResult(null)
      try {
        const res = await api.dryRunRetentionPolicy(workspaceId, policyId)
        if (res.blockedByLegalHold) {
          setActionError('Retention dry-run blocked by legal hold (W4-EX-LEGAL-HOLD-POLICY)')
          return
        }
        setDryRunResult(`Dry-run OK for ${policyId} · ${res.status}`)
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Retention dry-run failed')
      }
    },
    [workspaceId]
  )

  const startCampaign = useCallback(
    async (campaignId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.startAccessReview(workspaceId, campaignId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Start campaign failed')
      }
    },
    [workspaceId, load]
  )

  const completeCampaign = useCallback(
    async (campaignId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.completeAccessReview(workspaceId, campaignId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Complete campaign failed')
      }
    },
    [workspaceId, load]
  )

  const cancelCampaign = useCallback(
    async (campaignId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.cancelAccessReview(workspaceId, campaignId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Cancel campaign failed')
      }
    },
    [workspaceId, load]
  )

  const resolveFinding = useCallback(
    async (findingId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.resolveFinding(workspaceId, findingId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Resolve finding failed')
      }
    },
    [workspaceId, load]
  )

  const dismissFinding = useCallback(
    async (findingId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.dismissFinding(workspaceId, findingId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Dismiss finding failed')
      }
    },
    [workspaceId, load]
  )

  const finalizeEvidence = useCallback(
    async (evidenceId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.finalizeEvidence(workspaceId, evidenceId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Finalize evidence failed')
      }
    },
    [workspaceId, load]
  )

  const withdrawConsent = useCallback(
    async (consentId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.withdrawConsent(workspaceId, consentId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Withdraw consent failed')
      }
    },
    [workspaceId, load]
  )

  const releaseSuppression = useCallback(
    async (suppressionId: string) => {
      if (!workspaceId) return
      setActionError(null)
      try {
        await api.releaseSuppression(workspaceId, suppressionId)
        await load()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Release suppression failed')
      }
    },
    [workspaceId, load]
  )

  return {
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
    refetch: load,
    dryRunRetention,
    startCampaign,
    completeCampaign,
    cancelCampaign,
    resolveFinding,
    dismissFinding,
    finalizeEvidence,
    withdrawConsent,
    releaseSuppression,
  }
}
