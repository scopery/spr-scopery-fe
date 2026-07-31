'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import {
  DEPLOYMENT_ENVIRONMENT_OPTIONS,
  DeploymentEnvironment,
} from '../../domain/enums/deployment.enum'
import type { AiModelDeployment } from '../../domain/model/deployment'
import { useDeploymentMutations } from '../hooks/useDeploymentMutations'

interface DeploymentFormModalProps {
  open: boolean
  onClose: () => void
  deployment: AiModelDeployment | null
  modelOptions: Array<{ value: string; label: string }>
  defaultModelId?: string
  onSaved: () => void
}

export function DeploymentFormModal({
  open,
  onClose,
  deployment,
  modelOptions,
  defaultModelId = '',
  onSaved,
}: DeploymentFormModalProps) {
  const isEdit = deployment != null
  const { saving, create, update } = useDeploymentMutations(onSaved)
  const [modelId, setModelId] = useState(defaultModelId)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [environment, setEnvironment] = useState<DeploymentEnvironment>(DeploymentEnvironment.Dev)
  const [providerDeploymentId, setProviderDeploymentId] = useState('')
  const [endpointUrl, setEndpointUrl] = useState('')
  const [temperature, setTemperature] = useState('')
  const [maxTokens, setMaxTokens] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [description, setDescription] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setModelId(deployment?.modelId ?? defaultModelId)
    setName(deployment?.name ?? '')
    setCode(deployment?.code ?? '')
    setEnvironment(deployment?.environment ?? DeploymentEnvironment.Dev)
    setProviderDeploymentId(deployment?.providerDeploymentId ?? '')
    setEndpointUrl(deployment?.endpointUrl ?? '')
    setTemperature(
      deployment?.defaultTemperature != null ? String(deployment.defaultTemperature) : ''
    )
    setMaxTokens(
      deployment?.defaultMaxOutputTokens != null ? String(deployment.defaultMaxOutputTokens) : ''
    )
    setIsDefault(deployment?.isDefault ?? false)
    setDescription(deployment?.description ?? '')
    setFieldError(null)
  }, [open, deployment, defaultModelId])

  const parseOptionalNumber = (v: string): number | null => {
    if (!v.trim()) return null
    const n = Number(v)
    return Number.isFinite(n) ? n : NaN
  }

  const handleSubmit = async () => {
    setFieldError(null)
    if (!isEdit && !modelId) {
      setFieldError('Model is required')
      return
    }
    if (!name.trim() || (!isEdit && !code.trim())) {
      setFieldError('Name and code are required')
      return
    }
    const temp = parseOptionalNumber(temperature)
    const tokens = parseOptionalNumber(maxTokens)
    if (Number.isNaN(temp) || Number.isNaN(tokens)) {
      setFieldError('Temperature and max tokens must be numbers')
      return
    }
    if (tokens != null && (!Number.isInteger(tokens) || tokens < 0)) {
      setFieldError('Max output tokens must be a non-negative integer')
      return
    }

    try {
      if (isEdit && deployment) {
        await update(deployment.id, {
          name: name.trim(),
          providerDeploymentId: providerDeploymentId.trim() || null,
          endpointUrl: endpointUrl.trim() || null,
          defaultTemperature: temp,
          defaultMaxOutputTokens: tokens,
          description: description.trim() || null,
        })
      } else {
        await create({
          modelId,
          name: name.trim(),
          code: code.trim(),
          environment,
          providerDeploymentId: providerDeploymentId.trim() || null,
          endpointUrl: endpointUrl.trim() || null,
          defaultTemperature: temp,
          defaultMaxOutputTokens: tokens,
          isDefault,
          description: description.trim() || null,
        })
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
      title={isEdit ? 'Edit deployment' : 'Create deployment'}
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
          <>
            <div>
              <Typography variant="caption" tone="muted" className="mb-1 block">
                Model
              </Typography>
              <Select
                value={modelId}
                onValueChange={setModelId}
                options={modelOptions}
                placeholder="Select model"
              />
            </div>
            <div>
              <Typography variant="caption" tone="muted" className="mb-1 block">
                Environment
              </Typography>
              <Select
                value={environment}
                onValueChange={(v: string) => setEnvironment(v as DeploymentEnvironment)}
                options={DEPLOYMENT_ENVIRONMENT_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
              />
            </div>
            <Input label="Code" value={code} onChange={(e) => setCode(e.target.value)} required />
            <label className="flex items-center gap-sm text-sm">
              <input
                type="checkbox"
                checked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
              />
              Set as default for model + environment
            </label>
          </>
        ) : (
          <Typography variant="caption" tone="muted" className="font-mono">
            {deployment?.code} · {deployment?.environment}
          </Typography>
        )}
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input
          label="Provider deployment name"
          value={providerDeploymentId}
          onChange={(e) => setProviderDeploymentId(e.target.value)}
        />
        <Input
          label="Endpoint URL"
          value={endpointUrl}
          onChange={(e) => setEndpointUrl(e.target.value)}
        />
        <div className="grid gap-md sm:grid-cols-2">
          <Input
            label="Default temperature"
            value={temperature}
            onChange={(e) => setTemperature(e.target.value)}
          />
          <Input
            label="Default max output tokens"
            value={maxTokens}
            onChange={(e) => setMaxTokens(e.target.value)}
          />
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
