'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button, Card, Input, Select, Textarea, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as qualityApi from '../../infrastructure/api/quality.api'
import { TraceEntitySearchSelect } from './TraceEntitySearchSelect'
import type { NfrTarget, SaveNfrSpecificationPayload } from '../../domain/model/quality'

interface NfrSpecificationPanelProps {
  projectId: string
  requirementId: string
  onSaved?: () => void
}

const ATTRIBUTE_OPTIONS = [
  'PERFORMANCE',
  'SECURITY',
  'AVAILABILITY',
  'RELIABILITY',
  'SCALABILITY',
  'USABILITY',
  'ACCESSIBILITY',
  'COMPATIBILITY',
  'MAINTAINABILITY',
  'OBSERVABILITY',
  'DATA_INTEGRITY',
  'COMPLIANCE',
].map((value) => ({ value, label: value.replace(/_/g, ' ') }))

const OPERATOR_OPTIONS = [
  { value: 'LT', label: '<' },
  { value: 'LTE', label: '≤' },
  { value: 'GT', label: '>' },
  { value: 'GTE', label: '≥' },
  { value: 'EQ', label: '=' },
  { value: 'BETWEEN', label: 'between' },
]

const TARGET_TYPE_OPTIONS = [
  'SYSTEM',
  'MODULE',
  'FUNCTION',
  'API',
  'COMPONENT',
  'ENTITY',
  'INFRASTRUCTURE',
].map((value) => ({ value, label: value }))

const emptySpec = (): SaveNfrSpecificationPayload => ({
  qualityAttribute: 'PERFORMANCE',
  metricName: '',
  comparisonOperator: 'LTE',
  targetValue: null,
  secondaryTargetValue: null,
  unit: '',
  measurementWindow: '',
  environment: '',
  verificationFrequency: '',
  configurationJson: '',
})

export function NfrSpecificationPanel({
  projectId,
  requirementId,
  onSaved,
}: NfrSpecificationPanelProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [spec, setSpec] = useState<SaveNfrSpecificationPayload>(emptySpec())
  const [targets, setTargets] = useState<
    Array<{ targetType: string; targetId: string; targetLabel: string; displayOrder: number }>
  >([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !requirementId) return
    setLoading(true)
    setError(null)
    try {
      const [specRes, targetsRes] = await Promise.all([
        qualityApi.getNfrSpecification(projectId, requirementId).catch(() => null),
        qualityApi.getNfrTargets(projectId, requirementId).catch(() => null),
      ])
      if (specRes) {
        setSpec({
          qualityAttribute: specRes.qualityAttribute,
          metricName: specRes.metricName ?? '',
          comparisonOperator: specRes.comparisonOperator ?? 'LTE',
          targetValue: specRes.targetValue ?? null,
          secondaryTargetValue: specRes.secondaryTargetValue ?? null,
          unit: specRes.unit ?? '',
          measurementWindow: specRes.measurementWindow ?? '',
          environment: specRes.environment ?? '',
          verificationFrequency: specRes.verificationFrequency ?? '',
          configurationJson: specRes.configurationJson ?? '',
        })
      } else {
        setSpec(emptySpec())
      }
      setTargets(
        (targetsRes?.targets ?? []).map((target: NfrTarget, index) => ({
          targetType: String(target.targetType),
          targetId: target.targetId ?? '',
          targetLabel: target.targetLabel ?? '',
          displayOrder: target.displayOrder ?? index,
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load NFR specification')
    } finally {
      setLoading(false)
    }
  }, [projectId, requirementId])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    const incompleteTarget = targets.find((target) =>
      ['SYSTEM', 'INFRASTRUCTURE'].includes(target.targetType)
        ? !target.targetLabel.trim()
        : !target.targetId.trim()
    )
    if (incompleteTarget) {
      toast.error(
        ['SYSTEM', 'INFRASTRUCTURE'].includes(incompleteTarget.targetType)
          ? 'Add a description for every system or infrastructure target'
          : 'Select an entity for every verification target'
      )
      return
    }
    setSaving(true)
    try {
      await qualityApi.saveNfrSpecification(projectId, requirementId, {
        ...spec,
        metricName: spec.metricName?.trim() || null,
        unit: spec.unit?.trim() || null,
        measurementWindow: spec.measurementWindow?.trim() || null,
        environment: spec.environment?.trim() || null,
        verificationFrequency: spec.verificationFrequency?.trim() || null,
        configurationJson: spec.configurationJson?.trim() || null,
      })
      await qualityApi.replaceNfrTargets(projectId, requirementId, {
        targets: targets.map((target, index) => ({
          targetType: target.targetType,
          targetId: target.targetId.trim() || null,
          targetLabel: target.targetLabel.trim() || null,
          displayOrder: index,
        })),
      })
      toast.success('NFR specification saved')
      await load()
      onSaved?.()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Typography tone="muted">Loading NFR specification…</Typography>
  }

  if (error) {
    return <Typography tone="error">{error}</Typography>
  }

  return (
    <Card className="space-y-md p-md">
      <div>
        <Typography variant="h3">NFR Specification</Typography>
        <Typography variant="caption" tone="muted">
          Measurable criteria and verification targets for this non-functional requirement.
        </Typography>
      </div>

      <div className="grid grid-cols-2 gap-md">
        <Select
          label="Quality attribute"
          value={String(spec.qualityAttribute)}
          options={ATTRIBUTE_OPTIONS}
          onValueChange={(value: string) =>
            setSpec((current) => ({ ...current, qualityAttribute: value }))
          }
        />
        <Input
          label="Metric name"
          value={spec.metricName ?? ''}
          onChange={(event) =>
            setSpec((current) => ({ ...current, metricName: event.target.value }))
          }
        />
        <Select
          label="Operator"
          value={String(spec.comparisonOperator ?? 'LTE')}
          options={OPERATOR_OPTIONS}
          onValueChange={(value: string) =>
            setSpec((current) => ({ ...current, comparisonOperator: value }))
          }
        />
        <Input
          label="Target value"
          type="number"
          value={spec.targetValue ?? ''}
          onChange={(event) =>
            setSpec((current) => ({
              ...current,
              targetValue: event.target.value === '' ? null : Number(event.target.value),
            }))
          }
        />
        <Input
          label="Secondary value"
          type="number"
          value={spec.secondaryTargetValue ?? ''}
          onChange={(event) =>
            setSpec((current) => ({
              ...current,
              secondaryTargetValue: event.target.value === '' ? null : Number(event.target.value),
            }))
          }
        />
        <Input
          label="Unit"
          value={spec.unit ?? ''}
          onChange={(event) => setSpec((current) => ({ ...current, unit: event.target.value }))}
        />
        <Input
          label="Measurement window"
          value={spec.measurementWindow ?? ''}
          onChange={(event) =>
            setSpec((current) => ({ ...current, measurementWindow: event.target.value }))
          }
        />
        <Input
          label="Environment"
          value={spec.environment ?? ''}
          onChange={(event) =>
            setSpec((current) => ({ ...current, environment: event.target.value }))
          }
        />
      </div>

      <Textarea
        label="Configuration JSON"
        rows={3}
        value={spec.configurationJson ?? ''}
        onChange={(event) =>
          setSpec((current) => ({ ...current, configurationJson: event.target.value }))
        }
      />

      <div className="space-y-sm">
        <div className="flex items-center justify-between">
          <Typography variant="body">Verification targets</Typography>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() =>
              setTargets((current) => [
                ...current,
                {
                  targetType: 'SYSTEM',
                  targetId: '',
                  targetLabel: '',
                  displayOrder: current.length,
                },
              ])
            }
          >
            Add target
          </Button>
        </div>
        {targets.length === 0 ? (
          <Typography variant="caption" tone="muted">
            No targets yet. Add system, API, or component targets to verify against.
          </Typography>
        ) : (
          targets.map((target, index) => (
            <div key={index} className="grid grid-cols-[140px_1fr_1fr_auto] gap-sm">
              <Select
                value={target.targetType}
                options={TARGET_TYPE_OPTIONS}
                onValueChange={(value: string) =>
                  setTargets((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index
                        ? { ...row, targetType: value, targetId: '', targetLabel: '' }
                        : row
                    )
                  )
                }
              />
              {!['SYSTEM', 'INFRASTRUCTURE'].includes(target.targetType) ? (
                <TraceEntitySearchSelect
                  workspaceId={workspaceId}
                  projectId={projectId}
                  entityType={target.targetType}
                  label={target.targetType.replace(/_/g, ' ')}
                  required
                  value={target.targetId}
                  onChange={(targetId, targetLabel) =>
                    setTargets((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index
                          ? {
                              ...row,
                              targetId,
                              targetLabel: targetLabel ?? row.targetLabel,
                            }
                          : row
                      )
                    )
                  }
                />
              ) : (
                <div />
              )}
              <Input
                placeholder={
                  ['SYSTEM', 'INFRASTRUCTURE'].includes(target.targetType)
                    ? 'Target description'
                    : 'Display label'
                }
                value={target.targetLabel}
                onChange={(event) =>
                  setTargets((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, targetLabel: event.target.value } : row
                    )
                  )
                }
              />
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setTargets((current) => current.filter((_, rowIndex) => rowIndex !== index))
                }
              >
                Remove
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save NFR'}
        </Button>
      </div>
    </Card>
  )
}
