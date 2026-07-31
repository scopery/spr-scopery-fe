'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import {
  AGENT_AUTONOMY_OPTIONS,
  AGENT_OUTPUT_FORMAT_OPTIONS,
  AGENT_SCOPE_OPTIONS,
  AGENT_TYPE_OPTIONS,
  AgentScope,
  AgentType,
  type AgentAutonomyLevel,
  type AgentOutputFormat,
} from '../../domain/enums/agent.enum'
import { sanitizeAgentScopeFields } from '../../domain/rules/agent.rules'
import type { AiAgent } from '../../domain/model/agent'
import { useAgentMutations } from '../hooks/useAgentMutations'
import { AdminOrganizationSearchSelect } from '@/modules/admin/organizations'
import { AdminWorkspaceSearchSelect } from '@/modules/admin/workspaces'

interface AgentFormModalProps {
  open: boolean
  onClose: () => void
  agent: AiAgent | null
  deploymentOptions: Array<{ value: string; label: string }>
  onSaved: () => void
}

export function AgentFormModal({
  open,
  onClose,
  agent,
  deploymentOptions,
  onSaved,
}: AgentFormModalProps) {
  const isEdit = agent != null
  const { saving, create, update } = useAgentMutations(onSaved)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [type, setType] = useState<AgentType>(AgentType.Generation)
  const [description, setDescription] = useState('')
  const [defaultModelDeploymentId, setDefaultModelDeploymentId] = useState('')
  const [outputFormat, setOutputFormat] = useState<AgentOutputFormat | ''>('')
  const [autonomyLevel, setAutonomyLevel] = useState<AgentAutonomyLevel | ''>('')
  const [scope, setScope] = useState<AgentScope | ''>('')
  const [organizationId, setOrganizationId] = useState('')
  const [workspaceId, setWorkspaceId] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setName(agent?.name ?? '')
    setCode(agent?.code ?? '')
    setType(agent?.type ?? AgentType.Generation)
    setDescription(agent?.description ?? '')
    setDefaultModelDeploymentId(agent?.defaultModelDeploymentId ?? '')
    setOutputFormat(agent?.outputFormat ?? '')
    setAutonomyLevel(agent?.autonomyLevel ?? '')
    setScope(agent?.scope ?? '')
    setOrganizationId(agent?.organizationId ?? '')
    setWorkspaceId(agent?.workspaceId ?? '')
    setFieldError(null)
  }, [open, agent])

  const handleSubmit = async () => {
    setFieldError(null)
    if (!name.trim() || (!isEdit && !code.trim())) {
      setFieldError('Name and code are required')
      return
    }
    const scopeFields = sanitizeAgentScopeFields({
      scope: scope || null,
      organizationId,
      workspaceId,
    })
    if (scope === AgentScope.Organization && !scopeFields.organizationId) {
      setFieldError('Organization is required for ORGANIZATION scope')
      return
    }
    if (scope === AgentScope.Workspace && !scopeFields.workspaceId) {
      setFieldError('Workspace is required for WORKSPACE scope')
      return
    }

    const body = {
      name: name.trim(),
      type,
      description: description.trim() || null,
      defaultModelDeploymentId: defaultModelDeploymentId || null,
      outputFormat: outputFormat || null,
      autonomyLevel: autonomyLevel || null,
      scope: scope || null,
      ...scopeFields,
    }

    try {
      if (isEdit && agent) {
        await update(agent.id, body)
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
      title={isEdit ? 'Edit agent' : 'Create agent'}
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
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        {!isEdit ? (
          <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
        ) : (
          <Typography className="font-mono text-sm">{agent?.code}</Typography>
        )}
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Type
          </Typography>
          <Select
            value={type}
            onValueChange={(v: string) => setType(v as AgentType)}
            options={AGENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
        <Input
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Default model deployment
          </Typography>
          <Select
            value={defaultModelDeploymentId}
            onValueChange={setDefaultModelDeploymentId}
            options={[{ value: '', label: 'None' }, ...deploymentOptions]}
          />
        </div>
        <div className="grid gap-md sm:grid-cols-2">
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Output format
            </Typography>
            <Select
              value={outputFormat}
              onValueChange={(v: string) => setOutputFormat((v || '') as AgentOutputFormat | '')}
              options={[
                { value: '', label: '—' },
                ...AGENT_OUTPUT_FORMAT_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                })),
              ]}
            />
          </div>
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Autonomy
            </Typography>
            <Select
              value={autonomyLevel}
              onValueChange={(v: string) => setAutonomyLevel((v || '') as AgentAutonomyLevel | '')}
              options={[
                { value: '', label: '—' },
                ...AGENT_AUTONOMY_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
              ]}
            />
          </div>
        </div>
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Scope
          </Typography>
          <Select
            value={scope}
            onValueChange={(v: string) => setScope((v || '') as AgentScope | '')}
            options={[
              { value: '', label: '—' },
              ...AGENT_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        </div>
        {scope === AgentScope.Organization || scope === AgentScope.Workspace ? (
          <AdminOrganizationSearchSelect value={organizationId} onChange={setOrganizationId} />
        ) : null}
        {scope === AgentScope.Workspace ? (
          <AdminWorkspaceSearchSelect value={workspaceId} onChange={setWorkspaceId} />
        ) : null}
        {scope === AgentScope.Global ? (
          <Typography variant="caption" tone="muted">
            GLOBAL scope clears organization and workspace IDs.
          </Typography>
        ) : null}
      </Stack>
    </Modal>
  )
}
