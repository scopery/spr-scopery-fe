'use client'

import { useState } from 'react'
import { Input, Modal, Select, Stack, Typography } from '@/shared/ui'
import {
  AiCapabilityLevel,
  AiConversationType,
} from '../../domain/enums/ai-assistant.enum'

export interface NewConversationFormValues {
  conversationType: AiConversationType | string
  capabilityLevel: AiCapabilityLevel | string
  projectId: string | null
  title: string
}

interface NewConversationDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (values: NewConversationFormValues) => Promise<boolean>
  loading?: boolean
  projects: Array<{ id: string; name?: string; code?: string }>
  defaultProjectId?: string | null
}

export function NewConversationDialog({
  open,
  onClose,
  onSubmit,
  loading = false,
  projects,
  defaultProjectId = null,
}: NewConversationDialogProps) {
  const [conversationType, setConversationType] = useState<string>(
    AiConversationType.GeneralGuide
  )
  const [capabilityLevel, setCapabilityLevel] = useState<string>(
    AiCapabilityLevel.ContextualAnswer
  )
  const [projectId, setProjectId] = useState(defaultProjectId ?? '')
  const [title, setTitle] = useState('')

  const needsProject = conversationType === AiConversationType.ProjectAssistant

  const handleSubmit = async () => {
    if (needsProject && !projectId) return
    const ok = await onSubmit({
      conversationType,
      capabilityLevel,
      projectId: projectId || null,
      title: title.trim(),
    })
    if (ok) {
      setTitle('')
      onClose()
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New conversation"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost', disabled: loading },
        {
          label: 'Create',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          loading,
          disabled: loading || (needsProject && !projectId),
        },
      ]}
    >
      <Stack direction="vertical" spacing="md">
        <div>
          <Typography variant="caption" tone="muted" className="mb-1.5 block">
            Conversation type
          </Typography>
          <Select
            value={conversationType}
            onValueChange={setConversationType}
            options={[
              { value: AiConversationType.GeneralGuide, label: 'General guide' },
              {
                value: AiConversationType.ProjectAssistant,
                label: 'Project assistant',
              },
            ]}
          />
        </div>
        <div>
          <Typography variant="caption" tone="muted" className="mb-1.5 block">
            Capability
          </Typography>
          <Select
            value={capabilityLevel}
            onValueChange={setCapabilityLevel}
            options={[
              { value: AiCapabilityLevel.Guide, label: 'Guide' },
              {
                value: AiCapabilityLevel.ContextualAnswer,
                label: 'Contextual answer',
              },
            ]}
          />
        </div>
        <div>
          <Typography variant="caption" tone="muted" className="mb-1.5 block">
            Project {needsProject ? '(required)' : '(optional)'}
          </Typography>
          <Select
            value={projectId}
            onValueChange={setProjectId}
            options={projects.map((p) => ({
              value: p.id,
              label: p.name || p.code || p.id,
            }))}
            placeholder="Select project"
          />
        </div>
        <div>
          <Typography variant="caption" tone="muted" className="mb-1.5 block">
            Title (optional)
          </Typography>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 200))}
            placeholder="Conversation title"
            maxLength={200}
          />
        </div>
      </Stack>
    </Modal>
  )
}
