'use client'

import { useState } from 'react'
import { Button, Modal, Stack, Typography } from '@/shared/ui'
import type { AiLandingMode } from './AiWorkspaceLanding'

export interface AiRecommendedAction {
  id: string
  label: string
  description: string
}

export function recommendedActionsFor(mode: AiLandingMode): AiRecommendedAction[] {
  if (mode === 'document') {
    return [
      {
        id: 'review-requirements',
        label: 'Review requirements',
        description: 'Open a preview of extracted requirements before creating records.',
      },
      {
        id: 'task-drafts',
        label: 'Create task drafts',
        description: 'Preview task drafts from this document. Nothing is saved yet.',
      },
      {
        id: 'open-risks',
        label: 'Open extracted risks',
        description: 'Preview risks found in the document before adding them.',
      },
    ]
  }
  if (mode === 'project') {
    return [
      {
        id: 'create-risk',
        label: 'Create risk',
        description: 'Preview a mitigation risk draft. Confirm later to save.',
      },
      {
        id: 'create-tasks',
        label: 'Create tasks',
        description: 'Preview recovery tasks. No project data is created yet.',
      },
      {
        id: 'recovery-plan',
        label: 'Draft recovery plan',
        description: 'Preview a recovery plan document before publishing.',
      },
      {
        id: 'project-report',
        label: 'Generate project report',
        description: 'Preview a status report. Export or save only after review.',
      },
    ]
  }
  return [
    {
      id: 'next-steps',
      label: 'Suggest next steps',
      description: 'Preview suggested next actions for this workspace.',
    },
  ]
}

interface AiInlineActionsProps {
  mode: AiLandingMode
  heading?: string
}

export function AiInlineActions({
  mode,
  heading = 'Recommended actions',
}: AiInlineActionsProps) {
  const actions = recommendedActionsFor(mode)
  const [preview, setPreview] = useState<AiRecommendedAction | null>(null)

  return (
    <>
      <div className="mt-4 border-t border-neutral-100 pt-3">
        <Typography variant="small" weight="medium" className="mb-2 text-neutral-800">
          {heading}
        </Typography>
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.id}
              size="sm"
              variant="outline"
              onClick={() => setPreview(action)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <Modal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title={preview?.label ?? 'Action preview'}
        size="sm"
      >
        <Stack direction="vertical" spacing="md">
          <Typography variant="small" tone="muted">
            Preview only — nothing will be created until you confirm in a later step.
          </Typography>
          <Typography variant="small">{preview?.description}</Typography>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPreview(null)}>
              Close
            </Button>
            <Button variant="primary" disabled>
              Confirm later
            </Button>
          </div>
        </Stack>
      </Modal>
    </>
  )
}
