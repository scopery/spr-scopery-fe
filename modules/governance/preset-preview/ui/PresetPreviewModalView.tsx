'use client'

import { Modal, Typography, Button, ContentLoader } from '@/shared/ui'
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
        <ContentLoader />
      ) : preview ? (
        <div className="space-y-4">
          <div>
            <Typography variant="small" className="font-medium">
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
          <ul className="max-h-48 space-y-2 overflow-auto text-sm">
            {preview.rules.map((rule) => (
              <li key={rule.ruleKey} className="border-border rounded border p-2">
                <div className="font-medium">
                  {rule.name} · {rule.actionKey} · {rule.effect}
                </div>
                <div className="text-muted-foreground">{rule.conditionSummary}</div>
              </li>
            ))}
          </ul>
          <div className="flex gap-2 pt-2">
            <Button
              variant="primary"
              size="sm"
              loading={confirming}
              onClick={() => presetKey && onConfirm(presetKey)}
            >
              Apply as inactive policy
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
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
