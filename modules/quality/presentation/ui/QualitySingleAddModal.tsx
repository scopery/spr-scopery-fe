'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Textarea, Typography } from '@/shared/ui'
import {
  DefectCategory,
  DefectPriority,
  DefectSeverity,
  ReleaseType,
  TestCasePriority,
  TestCaseType,
  TestLevel,
  TestRunType,
  TraceLinkType,
} from '../../domain/enums/quality.enum'
import {
  emptyDraftValues,
  isDraftRowValid,
  mapDraftToCreateInput,
  QUALITY_SINGLE_TITLES,
  type QualityBulkKind,
  type QualityCreateInput,
  type QualityDraftValues,
} from './quality-bulk.model'

function enumOptions(values: readonly string[]) {
  return values.map((v) => ({ value: v, label: v }))
}

interface QualitySingleAddModalProps {
  open: boolean
  kind: QualityBulkKind
  onClose: () => void
  onCreate: (input: QualityCreateInput) => Promise<void>
}

export function QualitySingleAddModal({
  open,
  kind,
  onClose,
  onCreate,
}: QualitySingleAddModalProps) {
  const [values, setValues] = useState<QualityDraftValues>(() => emptyDraftValues(kind))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setValues(emptyDraftValues(kind))
    setError(null)
    setLoading(false)
  }, [open, kind])

  const set = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const canSubmit = isDraftRowValid(kind, values)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={QUALITY_SINGLE_TITLES[kind]}
      size="lg"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: 'Create',
          variant: 'primary',
          loading,
          disabled: !canSubmit || loading,
          onClick: () => {
            void (async () => {
              setLoading(true)
              setError(null)
              try {
                await onCreate(mapDraftToCreateInput(kind, values))
                onClose()
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Create failed')
              } finally {
                setLoading(false)
              }
            })()
          },
        },
      ]}
    >
      <div className="space-y-3">
        {error ? (
          <Typography variant="small" tone="error">
            {error}
          </Typography>
        ) : null}

        {kind === 'QUALITY_PLAN' ? (
          <>
            <Input
              label="Code"
              fullWidth
              value={values.code ?? ''}
              onChange={(e) => set('code', e.target.value)}
              placeholder="QP-001"
            />
            <Input
              label="Name"
              fullWidth
              required
              value={values.name ?? ''}
              onChange={(e) => set('name', e.target.value)}
            />
            <Textarea
              label="Description"
              fullWidth
              rows={3}
              value={values.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </>
        ) : null}

        {kind === 'TEST_PLAN' ? (
          <>
            <Input
              label="Code"
              fullWidth
              value={values.code ?? ''}
              onChange={(e) => set('code', e.target.value)}
            />
            <Input
              label="Name"
              fullWidth
              required
              value={values.name ?? ''}
              onChange={(e) => set('name', e.target.value)}
            />
            <div>
              <Typography variant="small" weight="medium" className="mb-1">
                Level *
              </Typography>
              <Select
                value={values.testLevel ?? TestLevel.System}
                onValueChange={(v: string) => set('testLevel', v)}
                options={enumOptions(Object.values(TestLevel))}
              />
            </div>
            <Textarea
              label="Description"
              fullWidth
              rows={2}
              value={values.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </>
        ) : null}

        {kind === 'TEST_SUITE' ? (
          <>
            <Input
              label="Name"
              fullWidth
              required
              value={values.name ?? ''}
              onChange={(e) => set('name', e.target.value)}
            />
            <Textarea
              label="Description"
              fullWidth
              rows={2}
              value={values.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </>
        ) : null}

        {kind === 'TEST_CASE' ? (
          <>
            <Input
              label="Code"
              fullWidth
              value={values.code ?? ''}
              onChange={(e) => set('code', e.target.value)}
            />
            <Input
              label="Title"
              fullWidth
              required
              value={values.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <Typography variant="small" weight="medium" className="mb-1">
                  Type *
                </Typography>
                <Select
                  value={values.type ?? TestCaseType.Functional}
                  onValueChange={(v: string) => set('type', v)}
                  options={enumOptions(Object.values(TestCaseType))}
                />
              </div>
              <div>
                <Typography variant="small" weight="medium" className="mb-1">
                  Priority *
                </Typography>
                <Select
                  value={values.priority ?? TestCasePriority.Medium}
                  onValueChange={(v: string) => set('priority', v)}
                  options={enumOptions(Object.values(TestCasePriority))}
                />
              </div>
            </div>
            <Textarea
              label="Preconditions"
              fullWidth
              rows={2}
              value={values.preconditions ?? ''}
              onChange={(e) => set('preconditions', e.target.value)}
            />
            <Textarea
              label="Expected result"
              fullWidth
              rows={2}
              value={values.expectedResult ?? ''}
              onChange={(e) => set('expectedResult', e.target.value)}
            />
          </>
        ) : null}

        {kind === 'TEST_RUN' ? (
          <>
            <Input
              label="Name"
              fullWidth
              required
              value={values.name ?? ''}
              onChange={(e) => set('name', e.target.value)}
            />
            <div>
              <Typography variant="small" weight="medium" className="mb-1">
                Run type *
              </Typography>
              <Select
                value={values.runType ?? TestRunType.Manual}
                onValueChange={(v: string) => set('runType', v)}
                options={enumOptions(Object.values(TestRunType))}
              />
            </div>
          </>
        ) : null}

        {kind === 'DEFECT' ? (
          <>
            <Input
              label="Code"
              fullWidth
              value={values.code ?? ''}
              onChange={(e) => set('code', e.target.value)}
            />
            <Input
              label="Title"
              fullWidth
              required
              value={values.title ?? ''}
              onChange={(e) => set('title', e.target.value)}
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <Typography variant="small" weight="medium" className="mb-1">
                  Category *
                </Typography>
                <Select
                  value={values.category ?? DefectCategory.Functional}
                  onValueChange={(v: string) => set('category', v)}
                  options={enumOptions(Object.values(DefectCategory))}
                />
              </div>
              <div>
                <Typography variant="small" weight="medium" className="mb-1">
                  Severity *
                </Typography>
                <Select
                  value={values.severity ?? DefectSeverity.Major}
                  onValueChange={(v: string) => set('severity', v)}
                  options={enumOptions(Object.values(DefectSeverity))}
                />
              </div>
              <div>
                <Typography variant="small" weight="medium" className="mb-1">
                  Priority *
                </Typography>
                <Select
                  value={values.priority ?? DefectPriority.P2}
                  onValueChange={(v: string) => set('priority', v)}
                  options={enumOptions(Object.values(DefectPriority))}
                />
              </div>
            </div>
            <Textarea
              label="Description"
              fullWidth
              rows={3}
              value={values.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </>
        ) : null}

        {kind === 'RELEASE' ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Code"
                fullWidth
                required
                value={values.code ?? ''}
                onChange={(e) => set('code', e.target.value)}
              />
              <Input
                label="Version"
                fullWidth
                required
                value={values.versionLabel ?? ''}
                onChange={(e) => set('versionLabel', e.target.value)}
              />
            </div>
            <Input
              label="Name"
              fullWidth
              required
              value={values.name ?? ''}
              onChange={(e) => set('name', e.target.value)}
            />
            <div>
              <Typography variant="small" weight="medium" className="mb-1">
                Type *
              </Typography>
              <Select
                value={values.releaseType ?? ReleaseType.Minor}
                onValueChange={(v: string) => set('releaseType', v)}
                options={enumOptions(Object.values(ReleaseType))}
              />
            </div>
            <Textarea
              label="Description"
              fullWidth
              rows={2}
              value={values.description ?? ''}
              onChange={(e) => set('description', e.target.value)}
            />
          </>
        ) : null}

        {kind === 'TRACE_LINK' ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="Source type"
                fullWidth
                required
                value={values.sourceType ?? ''}
                onChange={(e) => set('sourceType', e.target.value)}
              />
              <Input
                label="Source ID"
                fullWidth
                required
                value={values.sourceId ?? ''}
                onChange={(e) => set('sourceId', e.target.value)}
              />
              <Input
                label="Target type"
                fullWidth
                required
                value={values.targetType ?? ''}
                onChange={(e) => set('targetType', e.target.value)}
              />
              <Input
                label="Target ID"
                fullWidth
                required
                value={values.targetId ?? ''}
                onChange={(e) => set('targetId', e.target.value)}
              />
            </div>
            <div>
              <Typography variant="small" weight="medium" className="mb-1">
                Link type *
              </Typography>
              <Select
                value={values.linkType ?? TraceLinkType.TestedBy}
                onValueChange={(v: string) => set('linkType', v)}
                options={enumOptions(Object.values(TraceLinkType))}
              />
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  )
}
