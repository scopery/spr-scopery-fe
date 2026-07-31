'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { UserSearchSelect } from '@/modules/platform'
import { useWorkspaceMemberPeople } from '@/modules/org/workspace'
import { Input, Modal, Select, Stepper, Textarea, Typography } from '@/shared/ui'
import {
  RaidDependencyType,
  RaidIssueSeverity,
  RaidItemType,
  RaidRiskImpact,
  RaidRiskProbability,
  RaidRiskResponseStrategy,
  RaidValidationStatus,
} from '../../domain/enums/raid.enum'
import {
  raidDependencyTypeLabel,
  raidIssueSeverityLabel,
  raidRiskImpactLabel,
  raidRiskProbabilityLabel,
  raidRiskResponseStrategyLabel,
  raidTypeLabel,
  raidValidationStatusLabel,
} from '../../domain/rules/raid.rules'
import type { CreateRaidItemPayload } from '../../domain/model/raid'

interface CreateRaidItemModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateRaidItemPayload) => Promise<void>
}

const STEP_LABELS = ['Type', 'Identity', 'Details', 'Review', 'Confirm']

const TYPE_OPTIONS = [
  { value: RaidItemType.Risk, label: raidTypeLabel(RaidItemType.Risk) },
  { value: RaidItemType.Issue, label: raidTypeLabel(RaidItemType.Issue) },
  { value: RaidItemType.Assumption, label: raidTypeLabel(RaidItemType.Assumption) },
  { value: RaidItemType.Dependency, label: raidTypeLabel(RaidItemType.Dependency) },
]

const PROBABILITY_OPTIONS = [
  { value: RaidRiskProbability.Low, label: raidRiskProbabilityLabel(RaidRiskProbability.Low) },
  {
    value: RaidRiskProbability.Medium,
    label: raidRiskProbabilityLabel(RaidRiskProbability.Medium),
  },
  { value: RaidRiskProbability.High, label: raidRiskProbabilityLabel(RaidRiskProbability.High) },
]

const IMPACT_OPTIONS = [
  { value: RaidRiskImpact.Low, label: raidRiskImpactLabel(RaidRiskImpact.Low) },
  { value: RaidRiskImpact.Medium, label: raidRiskImpactLabel(RaidRiskImpact.Medium) },
  { value: RaidRiskImpact.High, label: raidRiskImpactLabel(RaidRiskImpact.High) },
]

const STRATEGY_OPTIONS = [
  {
    value: RaidRiskResponseStrategy.Mitigate,
    label: raidRiskResponseStrategyLabel(RaidRiskResponseStrategy.Mitigate),
  },
  {
    value: RaidRiskResponseStrategy.Avoid,
    label: raidRiskResponseStrategyLabel(RaidRiskResponseStrategy.Avoid),
  },
  {
    value: RaidRiskResponseStrategy.Transfer,
    label: raidRiskResponseStrategyLabel(RaidRiskResponseStrategy.Transfer),
  },
  {
    value: RaidRiskResponseStrategy.Accept,
    label: raidRiskResponseStrategyLabel(RaidRiskResponseStrategy.Accept),
  },
]

const SEVERITY_OPTIONS = [
  { value: RaidIssueSeverity.Low, label: raidIssueSeverityLabel(RaidIssueSeverity.Low) },
  { value: RaidIssueSeverity.Medium, label: raidIssueSeverityLabel(RaidIssueSeverity.Medium) },
  { value: RaidIssueSeverity.High, label: raidIssueSeverityLabel(RaidIssueSeverity.High) },
  { value: RaidIssueSeverity.Critical, label: raidIssueSeverityLabel(RaidIssueSeverity.Critical) },
]

const VALIDATION_STATUS_OPTIONS = [
  {
    value: RaidValidationStatus.Unvalidated,
    label: raidValidationStatusLabel(RaidValidationStatus.Unvalidated),
  },
  {
    value: RaidValidationStatus.Validated,
    label: raidValidationStatusLabel(RaidValidationStatus.Validated),
  },
  {
    value: RaidValidationStatus.Invalidated,
    label: raidValidationStatusLabel(RaidValidationStatus.Invalidated),
  },
]

const DEPENDENCY_TYPE_OPTIONS = [
  {
    value: RaidDependencyType.Internal,
    label: raidDependencyTypeLabel(RaidDependencyType.Internal),
  },
  {
    value: RaidDependencyType.External,
    label: raidDependencyTypeLabel(RaidDependencyType.External),
  },
]

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-2.5">
      <Typography variant="small" tone="muted">
        {label}
      </Typography>
      <Typography variant="small" weight="medium" className="text-right">
        {value || '—'}
      </Typography>
    </div>
  )
}

export function CreateRaidItemModal({ open, onClose, onSubmit }: CreateRaidItemModalProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { people: ownerPeople } = useWorkspaceMemberPeople(open ? workspaceId : null)
  const [step, setStep] = useState(0)
  const [type, setType] = useState<string>(RaidItemType.Risk)
  const [title, setTitle] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [ownerUserId, setOwnerUserId] = useState('')
  const [ownerName, setOwnerName] = useState('')

  const [probability, setProbability] = useState<string>(RaidRiskProbability.Medium)
  const [impact, setImpact] = useState<string>(RaidRiskImpact.Medium)
  const [riskResponseStrategy, setRiskResponseStrategy] = useState<string>(
    RaidRiskResponseStrategy.Mitigate
  )
  const [riskTrigger, setRiskTrigger] = useState('')

  const [severity, setSeverity] = useState<string>(RaidIssueSeverity.Medium)
  const [issueCategory, setIssueCategory] = useState('')
  const [rootCause, setRootCause] = useState('')

  const [assumptionStatement, setAssumptionStatement] = useState('')
  const [validationStatus, setValidationStatus] = useState<string>(RaidValidationStatus.Unvalidated)

  const [dependencyType, setDependencyType] = useState<string>(RaidDependencyType.Internal)

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep(0)
    setType(RaidItemType.Risk)
    setTitle('')
    setCode('')
    setDescription('')
    setOwnerUserId('')
    setOwnerName('')
    setProbability(RaidRiskProbability.Medium)
    setImpact(RaidRiskImpact.Medium)
    setRiskResponseStrategy(RaidRiskResponseStrategy.Mitigate)
    setRiskTrigger('')
    setSeverity(RaidIssueSeverity.Medium)
    setIssueCategory('')
    setRootCause('')
    setAssumptionStatement('')
    setValidationStatus(RaidValidationStatus.Unvalidated)
    setDependencyType(RaidDependencyType.Internal)
  }, [open])

  const isRisk = type === RaidItemType.Risk
  const isIssue = type === RaidItemType.Issue
  const isAssumption = type === RaidItemType.Assumption
  const isDependency = type === RaidItemType.Dependency

  const trimmedTitle = title.trim()
  const autoCode = () =>
    `${type.slice(0, 4)}_${trimmedTitle
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .slice(0, 20)}`
  const effectiveCode = code.trim() || autoCode()

  const buildPayload = (): CreateRaidItemPayload => ({
    type,
    title: trimmedTitle,
    code: effectiveCode,
    description: description.trim() || null,
    ownerUserId: ownerUserId.trim() || null,
    ...(isRisk
      ? {
          probability,
          impact,
          riskResponseStrategy,
          riskTrigger: riskTrigger.trim() || null,
        }
      : {}),
    ...(isIssue
      ? {
          severity,
          issueCategory: issueCategory.trim() || null,
          rootCause: rootCause.trim() || null,
        }
      : {}),
    ...(isAssumption
      ? {
          assumptionStatement: assumptionStatement.trim() || null,
          validationStatus,
        }
      : {}),
    ...(isDependency
      ? {
          dependencyType,
        }
      : {}),
  })

  const handleSubmit = async () => {
    if (!trimmedTitle || !effectiveCode) return
    setLoading(true)
    try {
      await onSubmit(buildPayload())
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const canLeaveIdentity = trimmedTitle.length > 0 && effectiveCode.length > 0

  const stepperSteps = STEP_LABELS.map((label, i) => ({
    id: i + 1,
    label,
    active: i === step,
  }))

  const actions =
    step === 0
      ? [
          { label: 'Cancel', onClick: onClose, variant: 'ghost' as const },
          { label: 'Next', onClick: () => setStep(1), variant: 'primary' as const },
        ]
      : step === 1
        ? [
            { label: 'Back', onClick: () => setStep(0), variant: 'ghost' as const },
            {
              label: 'Next',
              onClick: () => setStep(2),
              variant: 'primary' as const,
              disabled: !canLeaveIdentity,
            },
          ]
        : step === 2
          ? [
              { label: 'Back', onClick: () => setStep(1), variant: 'ghost' as const },
              { label: 'Next', onClick: () => setStep(3), variant: 'primary' as const },
            ]
          : step === 3
            ? [
                { label: 'Back', onClick: () => setStep(2), variant: 'ghost' as const },
                { label: 'Next', onClick: () => setStep(4), variant: 'primary' as const },
              ]
            : [
                { label: 'Back', onClick: () => setStep(3), variant: 'ghost' as const },
                {
                  label: 'Create RAID item',
                  onClick: () => void handleSubmit(),
                  variant: 'primary' as const,
                  loading,
                },
              ]

  return (
    <Modal open={open} onClose={onClose} title="Add RAID item" size="md" actions={actions}>
      <div className="space-y-5">
        <Stepper steps={stepperSteps} />

        {step === 0 && (
          <div className="space-y-4">
            <Typography variant="small" tone="muted">
              Choose the kind of RAID item you want to log.
            </Typography>
            <div>
              <Typography variant="small" className="mb-1.5">
                Type
              </Typography>
              <Select value={type} onValueChange={setType} options={TYPE_OPTIONS} />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="Title"
              required
              fullWidth
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Key developer may resign before go-live"
            />
            <Input
              label="Code"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={autoCode() || 'Auto from title if empty'}
            />
            <Textarea
              label="Description"
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
            <UserSearchSelect
              label="Owner (optional)"
              value={ownerUserId}
              seedPeople={ownerPeople}
              allowRemoteSearch={false}
              onChange={(userId, person) => {
                setOwnerUserId(userId)
                setOwnerName(person?.fullName ?? '')
              }}
            />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            {isRisk && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Typography variant="small" className="mb-1.5">
                      Probability
                    </Typography>
                    <Select
                      value={probability}
                      onValueChange={setProbability}
                      options={PROBABILITY_OPTIONS}
                    />
                  </div>
                  <div>
                    <Typography variant="small" className="mb-1.5">
                      Impact
                    </Typography>
                    <Select value={impact} onValueChange={setImpact} options={IMPACT_OPTIONS} />
                  </div>
                </div>
                <div>
                  <Typography variant="small" className="mb-1.5">
                    Response strategy
                  </Typography>
                  <Select
                    value={riskResponseStrategy}
                    onValueChange={setRiskResponseStrategy}
                    options={STRATEGY_OPTIONS}
                  />
                </div>
                <Textarea
                  label="Trigger (optional)"
                  fullWidth
                  value={riskTrigger}
                  onChange={(e) => setRiskTrigger(e.target.value)}
                  rows={2}
                  placeholder="What event would trigger this risk?"
                />
              </>
            )}
            {isIssue && (
              <>
                <div>
                  <Typography variant="small" className="mb-1.5">
                    Severity
                  </Typography>
                  <Select value={severity} onValueChange={setSeverity} options={SEVERITY_OPTIONS} />
                </div>
                <Input
                  label="Category (optional)"
                  fullWidth
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  placeholder="e.g. Resourcing, Technical, Vendor"
                />
                <Textarea
                  label="Root cause (optional)"
                  fullWidth
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  rows={3}
                />
              </>
            )}
            {isAssumption && (
              <>
                <Textarea
                  label="Assumption statement"
                  fullWidth
                  value={assumptionStatement}
                  onChange={(e) => setAssumptionStatement(e.target.value)}
                  rows={3}
                  placeholder="What are we assuming to be true?"
                />
                <div>
                  <Typography variant="small" className="mb-1.5">
                    Validation status
                  </Typography>
                  <Select
                    value={validationStatus}
                    onValueChange={setValidationStatus}
                    options={VALIDATION_STATUS_OPTIONS}
                  />
                </div>
              </>
            )}
            {isDependency && (
              <div>
                <Typography variant="small" className="mb-1.5">
                  Dependency type
                </Typography>
                <Select
                  value={dependencyType}
                  onValueChange={setDependencyType}
                  options={DEPENDENCY_TYPE_OPTIONS}
                />
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <Typography variant="small" tone="muted">
              Review the details below before confirming.
            </Typography>
            <div className="divide-y divide-neutral-100 border border-neutral-200">
              <ReviewRow label="Type" value={raidTypeLabel(type)} />
              <ReviewRow label="Code" value={effectiveCode} />
              <ReviewRow label="Title" value={trimmedTitle} />
              <ReviewRow label="Description" value={description.trim()} />
              <ReviewRow label="Owner" value={ownerName || 'Unassigned'} />
              {isRisk && (
                <>
                  <ReviewRow label="Probability" value={raidRiskProbabilityLabel(probability)} />
                  <ReviewRow label="Impact" value={raidRiskImpactLabel(impact)} />
                  <ReviewRow
                    label="Response strategy"
                    value={raidRiskResponseStrategyLabel(riskResponseStrategy)}
                  />
                  <ReviewRow label="Trigger" value={riskTrigger.trim()} />
                </>
              )}
              {isIssue && (
                <>
                  <ReviewRow label="Severity" value={raidIssueSeverityLabel(severity)} />
                  <ReviewRow label="Category" value={issueCategory.trim()} />
                  <ReviewRow label="Root cause" value={rootCause.trim()} />
                </>
              )}
              {isAssumption && (
                <>
                  <ReviewRow label="Statement" value={assumptionStatement.trim()} />
                  <ReviewRow
                    label="Validation status"
                    value={raidValidationStatusLabel(validationStatus)}
                  />
                </>
              )}
              {isDependency && (
                <ReviewRow
                  label="Dependency type"
                  value={raidDependencyTypeLabel(dependencyType)}
                />
              )}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-3 py-2 text-center">
            <Typography weight="semibold">Ready to create this RAID item?</Typography>
            <Typography variant="small" tone="muted">
              “{trimmedTitle}” will be added to the RAID register as an open{' '}
              {raidTypeLabel(type).toLowerCase()}.
            </Typography>
          </div>
        )}
      </div>
    </Modal>
  )
}
