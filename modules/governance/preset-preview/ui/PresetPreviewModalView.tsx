'use client'

import { Play } from 'lucide-react'

import { Modal, Typography, Button, Skeleton } from '@/shared/ui'
import type { PresetPreviewModalViewProps } from '../model/preset-preview-modal'

export function PresetPreviewModalView({
  open,
  presetKey,
  loading,
  preview,
  confirming,
  onClose,
  onConfirm,
}: PresetPreviewModalViewProps) {
  return (
    <Modal open={open} onClose={onClose} title="Preset preview" size="md">
      {loading ? (
        <Skeleton variant="rectangular" width="100%" height={80} />
      ) : preview ? (
        <div className="space-y-4">
          <div>
            <Typography variant="small" weight="medium">
              {preview.name}
            </Typography>
            <Typography variant="small" tone="muted">
              {preview.description}
            </Typography>
          </div>
          <Typography variant="small">
            Scope: {preview.scopeType} · Policy key: {preview.policyKey} · Priority:{' '}
            {preview.priority}
          </Typography>
          <Typography variant="small">
            Created as: <strong>{preview.defaultStatus}</strong> policy with{' '}
            {preview.ruleCountLabel}
          </Typography>
          <Typography variant="small">Actions: {preview.actionsAffectedLabel}</Typography>
          <Typography variant="small">Effects: {preview.effectsUsedLabel}</Typography>
          <ul className="max-h-48 space-y-2 overflow-auto">
            {preview.rules.map((rule) => (
              <li key={rule.ruleKey} className="border-border rounded border p-2">
                <Typography variant="small" weight="medium">
                  {rule.name} · {rule.actionKey} · {rule.effect}
                </Typography>
                <Typography variant="small" className="text-muted-foreground">
                  {rule.conditionSummary}
                </Typography>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-2">
            <Button
              variant="primary"
              loading={confirming}
              onClick={() => presetKey && onConfirm(presetKey)} icon={<Play size={16} />}>
              Apply as inactive policy
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Typography variant="small" tone="error">
          Could not load preset preview.
        </Typography>
      )}
    </Modal>
  )
}
