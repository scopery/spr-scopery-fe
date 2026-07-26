'use client'

import { useState } from 'react'
import { Modal, Radio, Typography } from '@/shared/ui'
import type { ProjectBaseline } from '../../domain/model/project-control'
import {
  buildBaselineHealth,
  formatBaselineCapturedAt,
  formatMetricNumber,
  mapBaselineSummaryToMetrics,
} from '../../domain/rules/project-control.rules'

export type ApproveOutcome = 'reference' | 'active'

export function BaselineApproveSheet({
  open,
  baseline,
  busy,
  onClose,
  onConfirm,
}: {
  open: boolean
  baseline: ProjectBaseline
  busy: boolean
  onClose: () => void
  onConfirm: (outcome: ApproveOutcome) => void
}) {
  const [outcome, setOutcome] = useState<ApproveOutcome>('active')
  const metrics = mapBaselineSummaryToMetrics(baseline.summary)
  const health = buildBaselineHealth(baseline)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Approve Baseline #${baseline.baselineNumber}`}
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost', disabled: busy },
        {
          label: 'Approve baseline',
          variant: 'primary',
          loading: busy,
          onClick: () => onConfirm(outcome),
        },
      ]}
    >
      <div className="space-y-5">
        <div>
          <Typography variant="overline" tone="muted">
            Captured
          </Typography>
          <Typography variant="small" className="mt-1">
            {formatBaselineCapturedAt(baseline.createdAt)}
          </Typography>
        </div>

        <div>
          <Typography variant="overline" tone="muted">
            Includes
          </Typography>
          <ul className="mt-2 space-y-1 text-sm text-neutral-800">
            <li>{formatMetricNumber(metrics.phaseCount)} Phases</li>
            <li>{formatMetricNumber(metrics.wbsCount)} WBS items</li>
            <li>{formatMetricNumber(metrics.taskCount)} Tasks</li>
            <li>{formatMetricNumber(metrics.estimateHours, 'h')} estimate</li>
          </ul>
        </div>

        <div>
          <Typography variant="overline" tone="muted">
            Validation
          </Typography>
          <Typography variant="small" className="mt-1">
            Snapshot {health.snapshotStatus} · {health.warnings} warnings ·{' '}
            {health.blocking} blocking
          </Typography>
        </div>

        <fieldset className="space-y-3">
          <Typography variant="overline" tone="muted">
            This baseline will become
          </Typography>
          <Radio
            name="approve-outcome"
            value="reference"
            checked={outcome === 'reference'}
            onChange={() => setOutcome('reference')}
            label="Approved reference"
            helperText="Keep as an approved historical plan without making it active."
          />
          <Radio
            name="approve-outcome"
            value="active"
            checked={outcome === 'active'}
            onChange={() => setOutcome('active')}
            label="Active project baseline"
            helperText="Approve and use as the current reference plan."
          />
        </fieldset>
      </div>
    </Modal>
  )
}
