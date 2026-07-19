'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import {
  EVENT_ENVIRONMENT_OPTIONS,
  EVENT_TRIGGER_TYPE_OPTIONS,
  EventConfigEnvironment,
  EventTriggerType,
} from '../../domain/enums/event-config.enum'
import type { AiEventConfig } from '../../domain/model/event-config'
import { useEventConfigMutations } from '../hooks/useEventConfigMutations'

interface EventConfigFormModalProps {
  open: boolean
  onClose: () => void
  config: AiEventConfig | null
  agentOptions: Array<{ value: string; label: string }>
  deploymentOptions: Array<{ value: string; label: string }>
  onSaved: () => void
}

export function EventConfigFormModal({
  open,
  onClose,
  config,
  agentOptions,
  deploymentOptions,
  onSaved,
}: EventConfigFormModalProps) {
  const isEdit = config != null
  const { saving, create, update } = useEventConfigMutations(onSaved)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [eventDefinitionId, setEventDefinitionId] = useState('')
  const [environment, setEnvironment] = useState<EventConfigEnvironment>(EventConfigEnvironment.Dev)
  const [triggerType, setTriggerType] = useState<EventTriggerType>(EventTriggerType.Event)
  const [agentId, setAgentId] = useState('')
  const [promptVersionId, setPromptVersionId] = useState('')
  const [modelDeploymentId, setModelDeploymentId] = useState('')
  const [conditionExpression, setConditionExpression] = useState('')
  const [description, setDescription] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setCode(config?.code ?? '')
    setName(config?.name ?? '')
    setEventDefinitionId(config?.eventDefinitionId ?? '')
    setEnvironment(config?.environment ?? EventConfigEnvironment.Dev)
    setTriggerType(config?.triggerType ?? EventTriggerType.Event)
    setAgentId(config?.agentId ?? '')
    setPromptVersionId(config?.promptVersionId ?? '')
    setModelDeploymentId(config?.modelDeploymentId ?? '')
    setConditionExpression(config?.conditionExpression ?? '')
    setDescription(config?.description ?? '')
    setFieldError(null)
  }, [open, config])

  const handleSubmit = async () => {
    setFieldError(null)
    if (!name.trim() || !eventDefinitionId.trim() || (!isEdit && !code.trim())) {
      setFieldError('Code, name, and event definition ID are required')
      return
    }
    const body = {
      name: name.trim(),
      eventDefinitionId: eventDefinitionId.trim(),
      environment,
      triggerType,
      agentId: agentId || null,
      promptVersionId: promptVersionId.trim() || null,
      modelDeploymentId: modelDeploymentId || null,
      conditionExpression: conditionExpression.trim() || null,
      description: description.trim() || null,
    }
    try {
      if (isEdit && config) {
        await update(config.id, body)
      } else {
        await create({ ...body, code: code.trim() })
      }
      onClose()
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        setFieldError(err.problem.detail || 'Validation failed')
      }
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit event config' : 'Create event config'}
      size="lg"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: isEdit ? 'Save' : 'Create',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          disabled: saving,
        },
      ]}
    >
      <Stack direction="vertical" spacing="md">
        {fieldError ? (
          <Typography tone="error" variant="small">
            {fieldError}
          </Typography>
        ) : null}
        {!isEdit ? (
          <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
        ) : (
          <Typography className="font-mono text-sm">{config?.code}</Typography>
        )}
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Event definition ID"
          value={eventDefinitionId}
          onChange={(e) => setEventDefinitionId(e.target.value)}
          required
        />
        <div className="grid gap-md sm:grid-cols-2">
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Environment
            </Typography>
            <Select
              value={environment}
              onValueChange={(v: string) => setEnvironment(v as EventConfigEnvironment)}
              options={EVENT_ENVIRONMENT_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
          </div>
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Trigger type
            </Typography>
            <Select
              value={triggerType}
              onValueChange={(v: string) => setTriggerType(v as EventTriggerType)}
              options={EVENT_TRIGGER_TYPE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
          </div>
        </div>
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Agent
          </Typography>
          <Select
            value={agentId}
            onValueChange={setAgentId}
            options={[{ value: '', label: 'None' }, ...agentOptions]}
          />
        </div>
        <Input
          label="Prompt version ID"
          value={promptVersionId}
          onChange={(e) => setPromptVersionId(e.target.value)}
        />
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Model deployment
          </Typography>
          <Select
            value={modelDeploymentId}
            onValueChange={setModelDeploymentId}
            options={[{ value: '', label: 'None' }, ...deploymentOptions]}
          />
        </div>
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Condition expression (SpEL — evaluated server-side only)
          </Typography>
          <textarea
            className="min-h-[80px] w-full border border-neutral-200 p-sm font-mono text-sm"
            value={conditionExpression}
            onChange={(e) => setConditionExpression(e.target.value)}
            placeholder="#event.status == 'ACTIVE'"
          />
          <Typography variant="caption" tone="warning" className="mt-1 block">
            Never evaluated in the browser. Treat as privileged server SpEL.
          </Typography>
        </div>
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Stack>
    </Modal>
  )
}
