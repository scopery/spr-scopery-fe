'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Select, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import {
  IF_NULL_BEHAVIOR_OPTIONS,
  SUPPORT_STATUS_OPTIONS,
  SupportStatus,
  VALUE_TYPE_OPTIONS,
  type IfNullBehavior,
  type ParameterValueType,
} from '../../domain/enums/capability.enum'
import type { AiParameterCapability } from '../../domain/model/capability'
import {
  requiresConditionDescription,
  validateNumericRange,
} from '../../domain/rules/capability.rules'
import { useCapabilityMutations } from '../hooks/useCapabilityMutations'

interface CapabilityFormModalProps {
  open: boolean
  onClose: () => void
  capability: AiParameterCapability | null
  modelOptions: Array<{ value: string; label: string }>
  defaultModelId?: string
  onSaved: () => void
}

export function CapabilityFormModal({
  open,
  onClose,
  capability,
  modelOptions,
  defaultModelId = '',
  onSaved,
}: CapabilityFormModalProps) {
  const isEdit = capability != null
  const { saving, create, update } = useCapabilityMutations(onSaved)
  const [modelId, setModelId] = useState(defaultModelId)
  const [parameterName, setParameterName] = useState('')
  const [apiParameterKey, setApiParameterKey] = useState('')
  const [supportStatus, setSupportStatus] = useState<SupportStatus>(SupportStatus.Yes)
  const [valueType, setValueType] = useState<ParameterValueType | ''>('')
  const [minValue, setMinValue] = useState('')
  const [maxValue, setMaxValue] = useState('')
  const [defaultValue, setDefaultValue] = useState('')
  const [nullable, setNullable] = useState(false)
  const [ifNullBehavior, setIfNullBehavior] = useState<IfNullBehavior | ''>('')
  const [description, setDescription] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  const showValueFields = supportStatus !== SupportStatus.No

  useEffect(() => {
    if (!open) return
    setModelId(capability?.modelId ?? defaultModelId)
    setParameterName(capability?.parameterName ?? '')
    setApiParameterKey(capability?.apiParameterKey ?? '')
    setSupportStatus(capability?.supportStatus ?? SupportStatus.Yes)
    setValueType(capability?.valueType ?? '')
    setMinValue(capability?.minValue ?? '')
    setMaxValue(capability?.maxValue ?? '')
    setDefaultValue(capability?.defaultValue ?? '')
    setNullable(capability?.nullable ?? false)
    setIfNullBehavior(capability?.ifNullBehavior ?? '')
    setDescription(capability?.description ?? '')
    setFieldError(null)
  }, [open, capability, defaultModelId])

  const handleSubmit = async () => {
    setFieldError(null)
    if (!isEdit && !modelId) {
      setFieldError('Model is required')
      return
    }
    if (!parameterName.trim()) {
      setFieldError('Parameter name is required')
      return
    }
    if (requiresConditionDescription(supportStatus) && !description.trim()) {
      setFieldError('CONDITIONAL support requires a description / condition')
      return
    }
    const rangeError = showValueFields
      ? validateNumericRange(
          valueType || null,
          minValue || null,
          defaultValue || null,
          maxValue || null
        )
      : null
    if (rangeError) {
      setFieldError(rangeError)
      return
    }

    const payload = {
      parameterName: parameterName.trim(),
      apiParameterKey: apiParameterKey.trim() || null,
      supportStatus,
      valueType: showValueFields && valueType ? valueType : null,
      minValue: showValueFields ? minValue.trim() || null : null,
      maxValue: showValueFields ? maxValue.trim() || null : null,
      defaultValue: showValueFields ? defaultValue.trim() || null : null,
      nullable: showValueFields ? nullable : null,
      ifNullBehavior: showValueFields && ifNullBehavior ? ifNullBehavior : null,
      description: description.trim() || null,
    }

    try {
      if (isEdit && capability) {
        await update(capability.id, payload)
      } else {
        await create({ modelId, ...payload })
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
      title={isEdit ? 'Edit capability' : 'Add capability'}
      size="lg"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: isEdit ? 'Save' : 'Add',
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
        ) : null}
        <Input
          label="Parameter name"
          value={parameterName}
          onChange={(e) => setParameterName(e.target.value)}
          placeholder="e.g. temperature"
          required
        />
        <Input
          label="API parameter key"
          value={apiParameterKey}
          onChange={(e) => setApiParameterKey(e.target.value)}
        />
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Support status
          </Typography>
          <Select
            value={supportStatus}
            onValueChange={(v: string) => setSupportStatus(v as SupportStatus)}
            options={SUPPORT_STATUS_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
        </div>
        {showValueFields ? (
          <>
            <div>
              <Typography variant="caption" tone="muted" className="mb-1 block">
                Value type
              </Typography>
              <Select
                value={valueType}
                onValueChange={(v: string) => setValueType((v || '') as ParameterValueType | '')}
                options={[
                  { value: '', label: '—' },
                  ...VALUE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
                ]}
              />
            </div>
            <div className="grid gap-md sm:grid-cols-3">
              <Input
                label="Min"
                value={minValue}
                onChange={(e) => setMinValue(e.target.value)}
              />
              <Input
                label="Default"
                value={defaultValue}
                onChange={(e) => setDefaultValue(e.target.value)}
              />
              <Input
                label="Max"
                value={maxValue}
                onChange={(e) => setMaxValue(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-sm text-sm">
              <input
                type="checkbox"
                checked={nullable}
                onChange={(e) => setNullable(e.target.checked)}
              />
              Nullable
            </label>
            <div>
              <Typography variant="caption" tone="muted" className="mb-1 block">
                If null behavior
              </Typography>
              <Select
                value={ifNullBehavior}
                onValueChange={(v: string) => setIfNullBehavior((v || '') as IfNullBehavior | '')}
                options={[
                  { value: '', label: '—' },
                  ...IF_NULL_BEHAVIOR_OPTIONS.map((o) => ({
                    value: o.value,
                    label: o.label,
                  })),
                ]}
              />
            </div>
          </>
        ) : (
          <Typography variant="caption" tone="muted">
            Support = NO — runtime value fields are hidden.
          </Typography>
        )}
        <Input
          label={
            requiresConditionDescription(supportStatus)
              ? 'Condition / description (required)'
              : 'Description'
          }
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Stack>
    </Modal>
  )
}
