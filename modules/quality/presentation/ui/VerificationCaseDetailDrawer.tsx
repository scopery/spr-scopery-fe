'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  DetailDrawer,
  Input,
  PageSkeleton,
  Select,
  Textarea,
  Typography,
} from '@/shared/ui'
import { UserSearchSelect, type PersonIdentity } from '@/modules/platform'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as qualityApi from '../../infrastructure/api/quality.api'
import type { VerificationCase } from '../../domain/model/quality'

interface VerificationCaseDetailDrawerProps {
  projectId: string
  verificationCaseId: string | null
  assigneePeople?: PersonIdentity[]
  onClose: () => void
  onChanged?: () => void
}

const STATUS_OPTIONS = ['DRAFT', 'READY', 'DEPRECATED', 'ARCHIVED'].map((value) => ({
  value,
  label: value,
}))
const METHOD_OPTIONS = [
  'LOAD_TEST',
  'PERFORMANCE_TEST',
  'SECURITY_SCAN',
  'PENETRATION_TEST',
  'AVAILABILITY_CHECK',
  'ACCESSIBILITY_AUDIT',
  'COMPLIANCE_REVIEW',
  'MANUAL_REVIEW',
  'MONITORING_CHECK',
].map((value) => ({ value, label: value.replace(/_/g, ' ') }))
const AUTOMATION_OPTIONS = ['MANUAL', 'PLANNED', 'AUTOMATED'].map((value) => ({
  value,
  label: value,
}))

export function VerificationCaseDetailDrawer({
  projectId,
  verificationCaseId,
  assigneePeople = [],
  onClose,
  onChanged,
}: VerificationCaseDetailDrawerProps) {
  const [detail, setDetail] = useState<VerificationCase | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!verificationCaseId) {
      setDetail(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    void qualityApi
      .getVerificationCase(projectId, verificationCaseId)
      .then((item) => {
        if (!cancelled) setDetail(item)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [projectId, verificationCaseId])

  const saveField = async (changes: Record<string, string | null>) => {
    if (!detail) return
    setSaving(true)
    try {
      const updated = await qualityApi.updateVerificationCase(projectId, detail.id, {
        ...changes,
        version: detail.version ?? 0,
      })
      setDetail(updated)
      onChanged?.()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DetailDrawer
      open={Boolean(verificationCaseId)}
      onClose={onClose}
      size="lg"
      title={detail?.title ?? 'Verification Case'}
      subtitle={detail?.code ?? 'NFR verification'}
      backdropClassName="bg-neutral-900/20"
    >
      {loading ? (
        <PageSkeleton variant="detail" />
      ) : error ? (
        <Typography tone="error">{error}</Typography>
      ) : detail ? (
        <div className="space-y-md">
          <Input
            label="Title"
            defaultValue={detail.title}
            disabled={saving}
            onBlur={(event) => {
              const title = event.target.value.trim()
              if (title && title !== detail.title) void saveField({ title })
            }}
          />
          <div className="grid grid-cols-2 gap-md">
            <Select
              label="Status"
              value={detail.lifecycleStatus}
              options={STATUS_OPTIONS}
              disabled={saving}
              onValueChange={(value: string) => void saveField({ lifecycleStatus: value })}
            />
            <Select
              label="Method"
              value={detail.verificationMethod}
              options={METHOD_OPTIONS}
              disabled={saving}
              onValueChange={(value: string) => void saveField({ verificationMethod: value })}
            />
            <Select
              label="Automation"
              value={detail.automationStatus ?? 'MANUAL'}
              options={AUTOMATION_OPTIONS}
              disabled={saving}
              onValueChange={(value: string) => void saveField({ automationStatus: value })}
            />
            <Input
              label="Environment"
              defaultValue={detail.environment ?? ''}
              disabled={saving}
              onBlur={(event) =>
                void saveField({ environment: event.target.value.trim() || null })
              }
            />
          </div>
          <UserSearchSelect
            label="Assignee"
            value={detail.assigneeId ?? ''}
            seedPeople={assigneePeople}
            allowRemoteSearch={false}
            disabled={saving}
            onChange={(userId) => void saveField({ assigneeId: userId || null })}
          />
          <Textarea
            label="Description"
            defaultValue={detail.description ?? ''}
            rows={3}
            disabled={saving}
            onBlur={(event) => void saveField({ description: event.target.value || null })}
          />
          <Textarea
            label="Procedure"
            defaultValue={detail.procedure ?? ''}
            rows={4}
            disabled={saving}
            onBlur={(event) => void saveField({ procedure: event.target.value || null })}
          />
          <Textarea
            label="Expected threshold (JSON)"
            defaultValue={detail.expectedResultJson ?? ''}
            rows={4}
            disabled={saving}
            onBlur={(event) =>
              void saveField({ expectedResultJson: event.target.value.trim() || null })
            }
          />
          <div className="border-t border-neutral-200 pt-md">
            <Typography variant="caption" tone="muted">
              Requirement
            </Typography>
            <div className="mt-xs">
              <Badge tone="neutral">
                {[detail.requirementCode, detail.requirementTitle].filter(Boolean).join(' · ') ||
                  '—'}
              </Badge>
            </div>
          </div>
        </div>
      ) : null}
    </DetailDrawer>
  )
}
