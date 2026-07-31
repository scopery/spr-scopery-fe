'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { Pencil, X } from 'lucide-react'
import { Button, Input, SearchableSelect, Textarea, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { UseCaseConditionType, UseCaseFlowType, UseCaseStatus } from '../model/use-case'
import { useUseCaseDetail } from '../hooks/useUseCaseDetail'
import { UseCaseStatusBadge } from './UseCaseStatusBadge'
import { UseCaseCompletenessBadge } from './UseCaseCompletenessBadge'
import { UseCaseFlowEditor } from './UseCaseFlowEditor'
import type {
  UseCase,
  UseCaseCondition,
  UseCaseBusinessRule,
  UseCaseAcceptanceCriterion,
} from '../model/use-case'
import { qualityCasesHref } from '@/modules/quality'

type Tab = 'conditions' | 'flows' | 'rules' | 'criteria'

const TABS: { id: Tab; label: string }[] = [
  { id: 'conditions', label: 'Conditions' },
  { id: 'flows', label: 'Flows' },
  { id: 'rules', label: 'Rules' },
  { id: 'criteria', label: 'Criteria' },
]

const CONDITION_TYPE_LABELS: Record<string, string> = {
  [UseCaseConditionType.Precondition]: 'Precondition',
  [UseCaseConditionType.Assumption]: 'Assumption',
  [UseCaseConditionType.SuccessPostcondition]: 'Success Postcondition',
  [UseCaseConditionType.FailurePostcondition]: 'Failure Postcondition',
}

const CONDITION_TYPE_OPTIONS = Object.values(UseCaseConditionType).map((v) => ({
  value: v,
  label: CONDITION_TYPE_LABELS[v] ?? v,
}))

const STATUS_OPTIONS = [
  { value: UseCaseStatus.Draft, label: 'Draft' },
  { value: UseCaseStatus.InReview, label: 'In Review' },
  { value: UseCaseStatus.Approved, label: 'Approved' },
  { value: UseCaseStatus.Deprecated, label: 'Deprecated' },
  { value: UseCaseStatus.Archived, label: 'Archived' },
]

// ─── Overview edit ───────────────────────────────────────────────────────────

function OverviewTab({
  overview,
  editing,
  onEditDone,
  onUpdate,
}: {
  overview: UseCase
  editing: boolean
  onEditDone: () => void
  onUpdate: (body: {
    name: string
    goal: string | null
    primaryActorName: string | null
    triggerText: string | null
    status: string
  }) => Promise<void>
}) {
  const [name, setName] = useState(overview.name)
  const [goal, setGoal] = useState(overview.goal ?? '')
  const [actor, setActor] = useState(overview.primaryActorName ?? '')
  const [trigger, setTrigger] = useState(overview.triggerText ?? '')
  const [status, setStatus] = useState(overview.status)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onUpdate({
        name: name.trim(),
        goal: goal.trim() || null,
        primaryActorName: actor.trim() || null,
        triggerText: trigger.trim() || null,
        status,
      })
      onEditDone()
    } finally {
      setSaving(false)
    }
  }

  const fieldCls =
    'border-0 border-b border-dashed border-neutral-400 bg-transparent px-0 shadow-none focus:ring-0 focus:border-neutral-700'

  if (editing) {
    return (
      <div className="space-y-4">
        <div>
          <p className="mb-1 text-xs text-neutral-500">
            Name <span className="text-red-500">*</span>
          </p>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            className={fieldCls}
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-neutral-500">Status</p>
          <SearchableSelect options={STATUS_OPTIONS} value={status} onValueChange={setStatus} />
        </div>
        <div>
          <p className="mb-1 text-xs text-neutral-500">Goal</p>
          <Textarea
            rows={2}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            fullWidth
            className={fieldCls}
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-neutral-500">Primary Actor</p>
          <Input
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            fullWidth
            className={fieldCls}
          />
        </div>
        <div>
          <p className="mb-1 text-xs text-neutral-500">Trigger</p>
          <Textarea
            rows={2}
            value={trigger}
            onChange={(e) => setTrigger(e.target.value)}
            fullWidth
            className={fieldCls}
          />
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={save} disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button size="sm" variant="ghost" onClick={onEditDone}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {overview.goal && (
        <div>
          <p className="text-xs text-neutral-500">Goal</p>
          <p className="mt-1 text-sm text-neutral-700">{overview.goal}</p>
        </div>
      )}
      {overview.primaryActorName && (
        <div>
          <p className="text-xs text-neutral-500">Primary Actor</p>
          <p className="mt-1 text-sm text-neutral-700">{overview.primaryActorName}</p>
        </div>
      )}
      {overview.triggerText && (
        <div>
          <p className="text-xs text-neutral-500">Trigger</p>
          <p className="mt-1 text-sm text-neutral-700">{overview.triggerText}</p>
        </div>
      )}
      {!overview.goal && !overview.primaryActorName && !overview.triggerText && (
        <Typography tone="muted" variant="small">
          No details yet. Click Edit to add.
        </Typography>
      )}
    </div>
  )
}

// ─── Conditions tab ───────────────────────────────────────────────────────────

function ConditionsTab({
  conditions,
  onAdd,
  onDelete,
}: {
  conditions: UseCaseCondition[]
  onAdd: (conditionType: string, content: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const [conditionType, setConditionType] = useState<string>(UseCaseConditionType.Precondition)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      await onAdd(conditionType, content.trim())
      setContent('')
      setConditionType(UseCaseConditionType.Precondition)
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      {Object.values(UseCaseConditionType).map((type) => {
        const group = conditions.filter((c) => c.conditionType === type)
        return (
          <div key={type}>
            <p className="text-xs text-neutral-500">{CONDITION_TYPE_LABELS[type]}</p>
            {group.length === 0 ? (
              <p className="mt-1 text-sm text-neutral-400">None</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {group.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-start justify-between border border-neutral-100 px-3 py-1.5 text-sm"
                  >
                    <span className="text-neutral-700">{c.content}</span>
                    <button
                      onClick={() => onDelete(c.id)}
                      className="ml-2 shrink-0 text-base leading-none text-red-400 hover:text-red-600"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}

      {adding ? (
        <div className="space-y-2 border border-neutral-200 bg-neutral-50 p-3">
          <div>
            <p className="mb-1 text-xs text-neutral-500">Type</p>
            <SearchableSelect
              options={CONDITION_TYPE_OPTIONS}
              value={conditionType}
              onValueChange={setConditionType}
              size="sm"
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-neutral-500">Content</p>
            <Textarea
              rows={2}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe this condition…"
              fullWidth
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving || !content.trim()}>
              {saving ? 'Saving…' : 'Add'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full border border-dashed border-neutral-200 py-2 text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
        >
          + Add condition
        </button>
      )}
    </div>
  )
}

// ─── Rules tab ────────────────────────────────────────────────────────────────

function RulesTab({
  businessRules,
  onAdd,
  onDelete,
}: {
  businessRules: UseCaseBusinessRule[]
  onAdd: (ruleCode: string, description: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const [ruleCode, setRuleCode] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!ruleCode.trim() || !description.trim()) return
    setSaving(true)
    try {
      await onAdd(ruleCode.trim(), description.trim())
      setRuleCode('')
      setDescription('')
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      {businessRules.map((rule) => (
        <div
          key={rule.id}
          className="flex items-start justify-between border border-neutral-100 px-3 py-2"
        >
          <div>
            <span className="font-mono text-xs font-semibold text-neutral-500">
              {rule.ruleCode}
            </span>
            <p className="mt-0.5 text-sm text-neutral-700">{rule.description}</p>
          </div>
          <button
            onClick={() => onDelete(rule.id)}
            className="ml-2 shrink-0 text-xs text-red-400 hover:text-red-600"
          >
            ×
          </button>
        </div>
      ))}

      {businessRules.length === 0 && !adding && (
        <Typography tone="muted" variant="small">
          No business rules yet.
        </Typography>
      )}

      {adding ? (
        <div className="space-y-2 border border-neutral-200 bg-neutral-50 p-3">
          <div>
            <p className="mb-1 text-xs text-neutral-500">
              Rule code <span className="text-red-500">*</span>
            </p>
            <Input
              value={ruleCode}
              onChange={(e) => setRuleCode(e.target.value)}
              placeholder="BR-001"
              size="sm"
              fullWidth
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-neutral-500">
              Description <span className="text-red-500">*</span>
            </p>
            <Textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this rule…"
              fullWidth
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={save}
              disabled={saving || !ruleCode.trim() || !description.trim()}
            >
              {saving ? 'Saving…' : 'Add'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full border border-dashed border-neutral-200 py-2 text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
        >
          + Add rule
        </button>
      )}
    </div>
  )
}

// ─── Criteria tab ─────────────────────────────────────────────────────────────

function CriteriaTab({
  acceptanceCriteria,
  onAdd,
  onDelete,
}: {
  acceptanceCriteria: UseCaseAcceptanceCriterion[]
  onAdd: (
    title: string,
    given: string | null,
    when: string | null,
    then: string | null
  ) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [given, setGiven] = useState('')
  const [when, setWhen] = useState('')
  const [then, setThen] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!title.trim()) return
    setSaving(true)
    try {
      await onAdd(title.trim(), given.trim() || null, when.trim() || null, then.trim() || null)
      setTitle('')
      setGiven('')
      setWhen('')
      setThen('')
      setAdding(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      {acceptanceCriteria.map((ac) => (
        <div key={ac.id} className="border border-neutral-100 px-3 py-2">
          <div className="flex items-start justify-between">
            <p className="text-sm font-medium text-neutral-700">{ac.title}</p>
            <button
              onClick={() => onDelete(ac.id)}
              className="ml-2 shrink-0 text-xs text-red-400 hover:text-red-600"
            >
              ×
            </button>
          </div>
          {(ac.givenText || ac.whenText || ac.thenText) && (
            <div className="mt-1 space-y-0.5 text-xs text-neutral-600">
              {ac.givenText && (
                <p>
                  <strong>Given:</strong> {ac.givenText}
                </p>
              )}
              {ac.whenText && (
                <p>
                  <strong>When:</strong> {ac.whenText}
                </p>
              )}
              {ac.thenText && (
                <p>
                  <strong>Then:</strong> {ac.thenText}
                </p>
              )}
            </div>
          )}
        </div>
      ))}

      {acceptanceCriteria.length === 0 && !adding && (
        <Typography tone="muted" variant="small">
          No acceptance criteria yet.
        </Typography>
      )}

      {adding ? (
        <div className="space-y-2 border border-neutral-200 bg-neutral-50 p-3">
          <div>
            <p className="mb-1 text-xs text-neutral-500">
              Title <span className="text-red-500">*</span>
            </p>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Criterion title"
              size="sm"
              fullWidth
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-neutral-500">Given</p>
            <Textarea
              rows={1}
              value={given}
              onChange={(e) => setGiven(e.target.value)}
              placeholder="Given…"
              fullWidth
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-neutral-500">When</p>
            <Textarea
              rows={1}
              value={when}
              onChange={(e) => setWhen(e.target.value)}
              placeholder="When…"
              fullWidth
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-neutral-500">Then</p>
            <Textarea
              rows={1}
              value={then}
              onChange={(e) => setThen(e.target.value)}
              placeholder="Then…"
              fullWidth
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={saving || !title.trim()}>
              {saving ? 'Saving…' : 'Add'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="w-full border border-dashed border-neutral-200 py-2 text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
        >
          + Add criterion
        </button>
      )}
    </div>
  )
}

// ─── Main panel ───────────────────────────────────────────────────────────────

interface Props {
  workspaceId: string
  projectId: string
  useCaseId: string
  onClose?: () => void
}

export function UseCaseDetailPanel({ workspaceId, projectId, useCaseId, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('conditions')
  const [editingOverview, setEditingOverview] = useState(false)
  const hook = useUseCaseDetail(projectId, useCaseId)
  const { detail, loading, error } = hook

  if (loading) {
    return <div className="p-5 text-sm text-neutral-500">Loading...</div>
  }

  if (error || !detail) {
    return <div className="p-5 text-sm text-red-500">{error ?? 'Use case not found'}</div>
  }

  const { overview, flows, conditions, businessRules, acceptanceCriteria, supportingFunctions } =
    detail

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-start justify-between border-b border-neutral-200 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-neutral-400">{overview.key}</span>
            <UseCaseStatusBadge status={overview.status} />
            <UseCaseCompletenessBadge completenessStatus={overview.completenessStatus} />
          </div>
          <h2 className="mt-1 text-base font-semibold text-neutral-900">{overview.name}</h2>
          <p className="text-xs text-neutral-500">{overview.primaryFunctionName}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            as={NextLink}
            href={qualityCasesHref(workspaceId, projectId, {
              type: 'functional',
              query: `tab=links&useCaseId=${encodeURIComponent(useCaseId)}`,
            })}
            size="sm"
            variant="ghost"
          >
            Manage Test Cases
          </Button>
          <button
            onClick={() => setEditingOverview((v) => !v)}
            className="inline-flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-neutral-900"
            aria-label="Edit overview"
          >
            <Pencil size={14} strokeWidth={1.75} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center text-neutral-400 hover:text-neutral-900"
              aria-label="Close"
            >
              <X size={16} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>

      {/* Overview — always visible */}
      <div className="shrink-0 border-b border-neutral-200 px-5 py-4">
        <OverviewTab
          overview={overview}
          editing={editingOverview}
          onEditDone={() => setEditingOverview(false)}
          onUpdate={(body) => hook.updateOverview(body)}
        />
        {supportingFunctions.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-neutral-500">Supporting Functions</p>
            <div className="mt-1 space-y-1">
              {supportingFunctions.map((sf) => (
                <div
                  key={sf.functionId}
                  className="flex items-center justify-between border border-neutral-100 px-3 py-1.5 text-sm"
                >
                  <span>
                    <span className="font-mono text-xs text-neutral-400">{sf.functionCode}</span>{' '}
                    {sf.functionName}
                  </span>
                  <button
                    onClick={() => hook.removeSupportingFunction(sf.functionId)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex shrink-0 border-b border-neutral-200 px-5">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        {activeTab === 'conditions' && (
          <ConditionsTab
            conditions={conditions}
            onAdd={(conditionType, content) =>
              hook.addCondition({ conditionType, content, displayOrder: conditions.length })
            }
            onDelete={hook.deleteCondition}
          />
        )}

        {activeTab === 'flows' && (
          <div className="space-y-4">
            {flows.map((flow) => (
              <UseCaseFlowEditor
                key={flow.id}
                flow={flow}
                onUpdateFlow={(name, conditionText) =>
                  hook.updateFlow(flow.id, { name, conditionText })
                }
                onDeleteFlow={() => hook.deleteFlow(flow.id)}
                onAddStep={(body) => hook.addStep(flow.id, body)}
                onUpdateStep={(stepId, body) => hook.updateStep(flow.id, stepId, body)}
                onDeleteStep={(stepId) => hook.deleteStep(flow.id, stepId)}
                onReorderSteps={(body) => hook.reorderSteps(flow.id, body)}
              />
            ))}
            <div className="flex gap-2">
              {[UseCaseFlowType.Main, UseCaseFlowType.Alternative, UseCaseFlowType.Exception].map(
                (ft) => {
                  const exists = flows.some((f) => f.flowType === ft)
                  if (ft === UseCaseFlowType.Main && exists) return null
                  return (
                    <Button
                      key={ft}
                      size="sm"
                      variant="outline"
                      onClick={() => hook.createFlow({ flowType: ft })}
                    >
                      +{' '}
                      {ft === UseCaseFlowType.Main
                        ? 'Main'
                        : ft === UseCaseFlowType.Alternative
                          ? 'Alternative'
                          : 'Exception'}{' '}
                      Flow
                    </Button>
                  )
                }
              )}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <RulesTab
            businessRules={businessRules}
            onAdd={(ruleCode, description) =>
              hook.addRule({ ruleCode, description, displayOrder: businessRules.length })
            }
            onDelete={hook.deleteRule}
          />
        )}

        {activeTab === 'criteria' && (
          <CriteriaTab
            acceptanceCriteria={acceptanceCriteria}
            onAdd={(title, givenText, whenText, thenText) =>
              hook.addCriterion({
                title,
                givenText,
                whenText,
                thenText,
                displayOrder: acceptanceCriteria.length,
              })
            }
            onDelete={hook.deleteCriterion}
          />
        )}
      </div>
    </div>
  )
}
