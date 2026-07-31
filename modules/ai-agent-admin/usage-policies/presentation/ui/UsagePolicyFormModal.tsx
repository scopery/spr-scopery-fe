'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, SearchableSelect, Select, Stack, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import {
  USAGE_ACTION_OPTIONS,
  USAGE_PERIOD_OPTIONS,
  USAGE_TARGET_TYPE_OPTIONS,
  UsagePolicyTargetType,
  type UsagePolicyAction,
  type UsagePolicyPeriod,
} from '../../domain/enums/usage-policy.enum'
import {
  hasAtLeastOneLimit,
  parseOptionalDecimal,
  parseOptionalInt,
  sanitizeUsageTarget,
} from '../../domain/rules/usage-policy.rules'
import type { AiUsagePolicy } from '../../domain/model/usage-policy'
import { useUsagePolicyMutations } from '../hooks/useUsagePolicyMutations'
import { useUsagePolicyTargetOptions } from '../hooks/useUsagePolicyTargetOptions'

interface UsagePolicyFormModalProps {
  open: boolean
  onClose: () => void
  policy: AiUsagePolicy | null
  onSaved: () => void
}

export function UsagePolicyFormModal({
  open,
  onClose,
  policy,
  onSaved,
}: UsagePolicyFormModalProps) {
  const isEdit = policy != null
  const { saving, create, update } = useUsagePolicyMutations(onSaved)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [targetType, setTargetType] = useState<UsagePolicyTargetType>(UsagePolicyTargetType.Global)
  const [targetId, setTargetId] = useState('')
  const [maxRequests, setMaxRequests] = useState('')
  const [maxTokens, setMaxTokens] = useState('')
  const [maxCost, setMaxCost] = useState('')
  const [maxConcurrent, setMaxConcurrent] = useState('')
  const [dailyBudget, setDailyBudget] = useState('')
  const [period, setPeriod] = useState<UsagePolicyPeriod | ''>('')
  const [action, setAction] = useState<UsagePolicyAction | ''>('')
  const [priority, setPriority] = useState('')
  const [description, setDescription] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const { options: targetOptions, loading: loadingTargets } =
    useUsagePolicyTargetOptions(targetType)

  useEffect(() => {
    if (!open) return
    setCode(policy?.code ?? '')
    setName(policy?.name ?? '')
    setTargetType(policy?.targetType ?? UsagePolicyTargetType.Global)
    setTargetId(policy?.targetId ?? '')
    setMaxRequests(policy?.maxRequestsPerPeriod != null ? String(policy.maxRequestsPerPeriod) : '')
    setMaxTokens(policy?.maxTokensPerPeriod != null ? String(policy.maxTokensPerPeriod) : '')
    setMaxCost(policy?.maxCostPerPeriod != null ? String(policy.maxCostPerPeriod) : '')
    setMaxConcurrent(
      policy?.maxConcurrentRequests != null ? String(policy.maxConcurrentRequests) : ''
    )
    setDailyBudget(policy?.dailyBudget != null ? String(policy.dailyBudget) : '')
    setPeriod(policy?.period ?? '')
    setAction(policy?.action ?? '')
    setPriority(policy?.priority != null ? String(policy.priority) : '')
    setDescription(policy?.description ?? '')
    setFieldError(null)
  }, [open, policy])

  const handleSubmit = async () => {
    setFieldError(null)
    if (!name.trim() || (!isEdit && !code.trim())) {
      setFieldError('Code and name are required')
      return
    }
    const target = sanitizeUsageTarget(targetType, targetId)
    if (target.error) {
      setFieldError(target.error)
      return
    }
    const maxRequestsPerPeriod = parseOptionalInt(maxRequests)
    const maxTokensPerPeriod = parseOptionalInt(maxTokens)
    const maxConcurrentRequests = parseOptionalInt(maxConcurrent)
    const priorityVal = parseOptionalInt(priority)
    const maxCostPerPeriod = parseOptionalDecimal(maxCost)
    const dailyBudgetVal = parseOptionalDecimal(dailyBudget)
    if (
      [maxRequestsPerPeriod, maxTokensPerPeriod, maxConcurrentRequests, priorityVal].some(
        (n) => typeof n === 'number' && Number.isNaN(n)
      ) ||
      [maxCostPerPeriod, dailyBudgetVal].some((n) => typeof n === 'number' && Number.isNaN(n))
    ) {
      setFieldError('Limits must be valid numbers (integers where required)')
      return
    }
    const limits = {
      maxRequestsPerPeriod: maxRequestsPerPeriod as number | null,
      maxTokensPerPeriod: maxTokensPerPeriod as number | null,
      maxCostPerPeriod: maxCostPerPeriod as number | null,
      maxConcurrentRequests: maxConcurrentRequests as number | null,
      dailyBudget: dailyBudgetVal as number | null,
    }
    if (!hasAtLeastOneLimit(limits)) {
      setFieldError('Configure at least one limit (requests, tokens, cost, concurrency, or budget)')
      return
    }

    const body = {
      name: name.trim(),
      targetType,
      targetId: target.targetId,
      ...limits,
      period: period || null,
      action: action || null,
      priority: priorityVal as number | null,
      description: description.trim() || null,
    }

    try {
      if (isEdit && policy) {
        await update(policy.id, body)
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
      title={isEdit ? 'Edit usage policy' : 'Create usage policy'}
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
          <Typography className="font-mono text-sm">{policy?.code}</Typography>
        )}
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <div>
          <Typography variant="caption" tone="muted" className="mb-1 block">
            Target type
          </Typography>
          <Select
            value={targetType}
            onValueChange={(v: string) => {
              setTargetType(v as UsagePolicyTargetType)
              setTargetId('')
            }}
            options={USAGE_TARGET_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
          />
        </div>
        {targetType !== UsagePolicyTargetType.Global ? (
          <SearchableSelect
            value={targetId}
            options={targetOptions}
            placeholder={loadingTargets ? 'Loading targets…' : 'Select target'}
            searchPlaceholder="Search targets…"
            onValueChange={setTargetId}
          />
        ) : (
          <Typography variant="caption" tone="muted">
            GLOBAL policies keep targetId null.
          </Typography>
        )}
        <div className="grid gap-md sm:grid-cols-2">
          <Input
            label="Max requests / period"
            value={maxRequests}
            onChange={(e) => setMaxRequests(e.target.value)}
          />
          <Input
            label="Max tokens / period"
            value={maxTokens}
            onChange={(e) => setMaxTokens(e.target.value)}
          />
          <Input
            label="Max cost / period"
            value={maxCost}
            onChange={(e) => setMaxCost(e.target.value)}
          />
          <Input
            label="Max concurrent"
            value={maxConcurrent}
            onChange={(e) => setMaxConcurrent(e.target.value)}
          />
          <Input
            label="Daily budget"
            value={dailyBudget}
            onChange={(e) => setDailyBudget(e.target.value)}
          />
          <Input label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} />
        </div>
        <div className="grid gap-md sm:grid-cols-2">
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Period
            </Typography>
            <Select
              value={period}
              onValueChange={(v: string) => setPeriod((v || '') as UsagePolicyPeriod | '')}
              options={[
                { value: '', label: '—' },
                ...USAGE_PERIOD_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
              ]}
            />
          </div>
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Action
            </Typography>
            <Select
              value={action}
              onValueChange={(v: string) => setAction((v || '') as UsagePolicyAction | '')}
              options={[
                { value: '', label: '—' },
                ...USAGE_ACTION_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
              ]}
            />
          </div>
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
