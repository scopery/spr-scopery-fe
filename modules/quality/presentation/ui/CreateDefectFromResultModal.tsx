'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Badge,
  Input,
  Modal,
  PageSkeleton,
  Select,
  Textarea,
  Typography,
} from '@/shared/ui'
import * as qualityApi from '../../infrastructure/api/quality.api'
import {
  DefectCategory,
  DefectPriority,
  DefectSeverity,
} from '../../domain/enums/quality.enum'
import type {
  CreateDefectPayload,
  RunExecutionRow,
  TestCaseDetail,
  VerificationCase,
} from '../../domain/model/quality'
import { caseKindLabel } from '../../domain/rules/quality.rules'

interface CreateDefectFromResultModalProps {
  open: boolean
  projectId: string
  row: RunExecutionRow
  runName?: string | null
  onClose: () => void
  onCreated: () => Promise<void> | void
}

function enumOptions(values: string[]) {
  return values.map((value) => ({ value, label: value.replaceAll('_', ' ') }))
}

function resultLabel(result: string): string {
  const labels: Record<string, string> = {
    PASSED: 'Passed',
    FAILED: 'Failed',
    BLOCKED: 'Blocked',
    SKIPPED: 'Skipped',
    NOT_RUN: 'Not run',
  }
  return labels[result] ?? result
}

function isMissingTitle(title?: string | null): boolean {
  if (!title?.trim()) return true
  return (
    title === 'Unavailable test case' ||
    title === 'Unavailable verification case' ||
    title === 'Untitled case' ||
    title === 'Untitled'
  )
}

/** Prefer failure notes as the defect name; fall back to case identity. */
function buildDefectTitle(input: {
  status: string
  notes?: string | null
  code?: string | null
  title?: string | null
}): string {
  const notes = input.notes?.trim()
  if (notes) {
    // Keep list-friendly length; full text stays in Actual / Description.
    const oneLine = notes.replace(/\s+/g, ' ')
    return oneLine.length > 120 ? `${oneLine.slice(0, 117)}…` : oneLine
  }
  const statusPart = resultLabel(input.status)
  const codePart = input.code?.trim() && input.code !== '—' ? input.code.trim() : null
  const titlePart = isMissingTitle(input.title) ? null : input.title!.trim()
  if (codePart && titlePart) return `${statusPart}: ${codePart} · ${titlePart}`
  if (titlePart) return `${statusPart}: ${titlePart}`
  if (codePart) return `${statusPart}: ${codePart}`
  return `${statusPart}: Test case`
}

export function CreateDefectFromResultModal({
  open,
  projectId,
  row,
  runName,
  onClose,
  onCreated,
}: CreateDefectFromResultModalProps) {
  const [loadingCase, setLoadingCase] = useState(false)
  const [saving, setSaving] = useState(false)
  const [functional, setFunctional] = useState<TestCaseDetail | null>(null)
  const [nfr, setNfr] = useState<VerificationCase | null>(null)

  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<string>(
    row.kind === 'NFR' ? DefectCategory.Performance : DefectCategory.Functional
  )
  const [severity, setSeverity] = useState<string>(DefectSeverity.Major)
  const [priority, setPriority] = useState<string>(DefectPriority.P2)
  const [description, setDescription] = useState('')
  const [expectedResult, setExpectedResult] = useState('')
  const [actualResult, setActualResult] = useState(row.notes ?? '')
  const [reproductionSteps, setReproductionSteps] = useState('')

  const caseCode = functional?.code ?? nfr?.code ?? row.caseCode
  const caseTitle = functional?.title ?? nfr?.title ?? row.caseTitle

  const loadCase = useCallback(async () => {
    if (!open || !projectId || !row.caseId) return
    setLoadingCase(true)
    setFunctional(null)
    setNfr(null)
    try {
      if (row.kind === 'FUNCTIONAL') {
        const detail = await qualityApi.getTestCase(projectId, row.caseId)
        let steps = detail.steps ?? []
        if (steps.length === 0) {
          try {
            const stepRes = await qualityApi.listTestCaseSteps(projectId, row.caseId)
            steps = stepRes.items ?? []
          } catch {
            steps = []
          }
        }
        const withSteps = { ...detail, steps }
        setFunctional(withSteps)
        const resolvedTitle = withSteps.title || row.caseTitle
        const resolvedCode = withSteps.code || row.caseCode
        setTitle(
          buildDefectTitle({
            status: row.status,
            notes: row.notes,
            code: resolvedCode,
            title: resolvedTitle,
          })
        )
        setExpectedResult(withSteps.expectedResult ?? '')
        setDescription(
          [
            runName ? `Run: ${runName}` : null,
            `Case: ${resolvedCode ?? '—'} · ${isMissingTitle(resolvedTitle) ? '—' : resolvedTitle}`,
            withSteps.preconditions ? `Preconditions: ${withSteps.preconditions}` : null,
          ]
            .filter(Boolean)
            .join('\n\n')
        )
        if (withSteps.steps?.length) {
          setReproductionSteps(
            withSteps.steps
              .map(
                (step, index) =>
                  `${index + 1}. ${step.action}${step.expectedResult ? ` → ${step.expectedResult}` : ''}`
              )
              .join('\n')
          )
        }
      } else {
        const detail = await qualityApi.getVerificationCase(projectId, row.caseId)
        setNfr(detail)
        const resolvedTitle = detail.title || row.caseTitle
        const resolvedCode = detail.code || row.caseCode
        setTitle(
          buildDefectTitle({
            status: row.status,
            notes: row.notes,
            code: resolvedCode,
            title: resolvedTitle,
          })
        )
        setExpectedResult(
          [
            detail.comparisonOperator && detail.thresholdValue != null
              ? `Threshold: ${detail.comparisonOperator} ${detail.thresholdValue}${detail.thresholdUnit ? ` ${detail.thresholdUnit}` : ''}`
              : null,
            detail.verificationMethod ? `Method: ${detail.verificationMethod}` : null,
          ]
            .filter(Boolean)
            .join(' · ')
        )
        setDescription(
          [
            runName ? `Run: ${runName}` : null,
            `Case: ${resolvedCode ?? '—'} · ${isMissingTitle(resolvedTitle) ? '—' : resolvedTitle}`,
            detail.qualityAttribute ? `Attribute: ${detail.qualityAttribute}` : null,
            row.actualValue != null
              ? `Actual: ${row.actualValue}${row.actualUnit ? ` ${row.actualUnit}` : ''}`
              : null,
          ]
            .filter(Boolean)
            .join('\n\n')
        )
      }
      setActualResult(row.notes ?? '')
      setCategory(row.kind === 'NFR' ? DefectCategory.Performance : DefectCategory.Functional)
      setSeverity(DefectSeverity.Major)
      setPriority(DefectPriority.P2)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load case details')
      setTitle(
        buildDefectTitle({
          status: row.status,
          notes: row.notes,
          code: row.caseCode,
          title: row.caseTitle,
        })
      )
      setDescription(
        [runName ? `Run: ${runName}` : null, `Case id: ${row.caseId}`, row.notes]
          .filter(Boolean)
          .join('\n')
      )
    } finally {
      setLoadingCase(false)
    }
  }, [open, projectId, row, runName])

  useEffect(() => {
    void loadCase()
  }, [loadCase])

  const submit = async () => {
    if (!title.trim()) {
      toast.message('Title is required')
      return
    }
    setSaving(true)
    try {
      const payload: CreateDefectPayload = {
        title: title.trim(),
        category,
        severity,
        priority,
        description: description.trim() || null,
        expectedResult: expectedResult.trim() || null,
        actualResult: actualResult.trim() || null,
        reproductionSteps: reproductionSteps.trim() || null,
        sourceTestCaseResultId: row.kind === 'FUNCTIONAL' ? row.resultId : null,
        sourceVerificationResultId: row.kind === 'NFR' ? row.resultId : null,
      }
      const created = await qualityApi.createDefect(projectId, payload)
      toast.success(created?.code ? `Defect ${created.code} created` : 'Defect created')
      await onCreated()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create defect from result"
      size="2xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Create defect',
          variant: 'primary',
          loading: saving,
          disabled: saving || loadingCase || !title.trim(),
          onClick: () => void submit(),
        },
      ]}
    >
      <div className="space-y-4">
        {loadingCase ? (
          <PageSkeleton variant="detail" />
        ) : (
          <section className="space-y-2 border border-neutral-200 bg-neutral-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <Typography weight="medium">Source case</Typography>
              <Badge size="sm" variant="solid" tone={row.kind === 'NFR' ? 'info' : 'neutral'}>
                {caseKindLabel(row.kind, nfr?.qualityAttribute ?? row.qualityAttribute)}
              </Badge>
              <Badge
                size="sm"
                variant="solid"
                tone={row.status === 'FAILED' ? 'error' : 'warning'}
              >
                {resultLabel(row.status)}
              </Badge>
            </div>
            <Typography variant="small" weight="medium" className="font-mono">
              {caseCode && caseCode !== '—' ? caseCode : '—'}
            </Typography>
            <Typography>{isMissingTitle(caseTitle) ? 'Untitled case' : caseTitle}</Typography>
            {runName ? (
              <Typography variant="caption" tone="muted">
                From run · {runName}
              </Typography>
            ) : null}

            <div
              className={
                row.notes?.trim()
                  ? 'border border-error/30 bg-error/5 p-3'
                  : 'border border-dashed border-neutral-300 bg-white p-3'
              }
            >
              <Typography variant="caption" tone="muted" className="mb-1 block">
                Failure notes from run
              </Typography>
              {row.notes?.trim() ? (
                <Typography variant="small" className="whitespace-pre-wrap text-neutral-900">
                  {row.notes}
                </Typography>
              ) : (
                <Typography variant="small" tone="muted">
                  No comment was saved on this result. Add the fail reason below (Actual result).
                </Typography>
              )}
              {row.actualValue != null ? (
                <Typography variant="small" className="mt-2">
                  Actual value: {row.actualValue}
                  {row.actualUnit ? ` ${row.actualUnit}` : ''}
                  {row.thresholdMet == null ? '' : row.thresholdMet ? ' · threshold met' : ' · threshold not met'}
                </Typography>
              ) : null}
            </div>

            {functional ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Typography variant="caption" tone="muted">
                    Priority
                  </Typography>
                  <Typography variant="small">{functional.priority ?? '—'}</Typography>
                </div>
                <div>
                  <Typography variant="caption" tone="muted">
                    Status
                  </Typography>
                  <Typography variant="small">{functional.status ?? '—'}</Typography>
                </div>
                <div className="sm:col-span-2">
                  <Typography variant="caption" tone="muted">
                    Preconditions
                  </Typography>
                  <Typography variant="small">{functional.preconditions || '—'}</Typography>
                </div>
                <div className="sm:col-span-2">
                  <Typography variant="caption" tone="muted">
                    Expected result
                  </Typography>
                  <Typography variant="small">{functional.expectedResult || '—'}</Typography>
                </div>
                {functional.steps?.length ? (
                  <div className="sm:col-span-2">
                    <Typography variant="caption" tone="muted">
                      Steps ({functional.steps.length})
                    </Typography>
                    <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-neutral-800">
                      {functional.steps.slice(0, 8).map((step) => (
                        <li key={step.id}>
                          {step.action}
                          {step.expectedResult ? (
                            <span className="text-neutral-500"> → {step.expectedResult}</span>
                          ) : null}
                        </li>
                      ))}
                      {functional.steps.length > 8 ? (
                        <li className="text-neutral-500">…and {functional.steps.length - 8} more</li>
                      ) : null}
                    </ol>
                  </div>
                ) : null}
              </div>
            ) : null}

            {nfr ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <Typography variant="caption" tone="muted">
                    Quality attribute
                  </Typography>
                  <Typography variant="small">{nfr.qualityAttribute ?? '—'}</Typography>
                </div>
                <div>
                  <Typography variant="caption" tone="muted">
                    Method
                  </Typography>
                  <Typography variant="small">{nfr.verificationMethod ?? '—'}</Typography>
                </div>
                <div className="sm:col-span-2">
                  <Typography variant="caption" tone="muted">
                    Threshold
                  </Typography>
                  <Typography variant="small">
                    {nfr.comparisonOperator && nfr.thresholdValue != null
                      ? `${nfr.comparisonOperator} ${nfr.thresholdValue}${nfr.thresholdUnit ? ` ${nfr.thresholdUnit}` : ''}`
                      : '—'}
                  </Typography>
                </div>
                {row.actualValue != null ? (
                  <div className="sm:col-span-2">
                    <Typography variant="caption" tone="muted">
                      Actual value
                    </Typography>
                    <Typography variant="small">
                      {row.actualValue}
                      {row.actualUnit ? ` ${row.actualUnit}` : ''}
                    </Typography>
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        )}

        <section className="space-y-3">
          <Typography weight="medium">Defect</Typography>
          <Input
            label="Title"
            fullWidth
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Defaults from failure notes — edit if needed"
            helperText="Prefilled from the run result comment when available"
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Typography variant="small" weight="medium" className="mb-1">
                Category *
              </Typography>
              <Select
                value={category}
                onValueChange={setCategory}
                options={enumOptions(Object.values(DefectCategory))}
              />
            </div>
            <div>
              <Typography variant="small" weight="medium" className="mb-1">
                Severity *
              </Typography>
              <Select
                value={severity}
                onValueChange={setSeverity}
                options={enumOptions(Object.values(DefectSeverity))}
              />
            </div>
            <div>
              <Typography variant="small" weight="medium" className="mb-1">
                Priority *
              </Typography>
              <Select
                value={priority}
                onValueChange={setPriority}
                options={enumOptions(Object.values(DefectPriority))}
              />
            </div>
          </div>
          <Textarea
            label="Description"
            fullWidth
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Textarea
            label="Expected result"
            fullWidth
            rows={2}
            value={expectedResult}
            onChange={(e) => setExpectedResult(e.target.value)}
          />
          <Textarea
            label="Actual result / failure notes"
            fullWidth
            rows={3}
            value={actualResult}
            onChange={(e) => setActualResult(e.target.value)}
            placeholder="Pulled from the run result comment — edit if needed"
          />
          <Textarea
            label="Reproduction steps"
            fullWidth
            rows={4}
            value={reproductionSteps}
            onChange={(e) => setReproductionSteps(e.target.value)}
          />
        </section>
      </div>
    </Modal>
  )
}
