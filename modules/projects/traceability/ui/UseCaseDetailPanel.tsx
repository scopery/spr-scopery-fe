'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import NextLink from 'next/link'
import { Pencil, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Button,
  ConfirmDialog,
  Input,
  SearchableSelect,
  Textarea,
  Typography,
  Badge,
} from '@/shared/ui'
import { cn } from '@/utils/cn'
import { UseCaseConditionType, UseCaseFlowType, UseCaseStatus } from '../model/use-case'
import { useUseCaseDetail } from '../hooks/useUseCaseDetail'
import { useFunctionalCatalog } from '../hooks/useFunctionalCatalog'
import { UseCaseStatusBadge } from './UseCaseStatusBadge'
import { UseCaseCompletenessBadge } from './UseCaseCompletenessBadge'
import { UseCaseFlowEditor } from './UseCaseFlowEditor'
import { MultiSelectLinkModal } from './MultiSelectLinkModal'
import type {
  UseCase,
  UseCaseCondition,
  UseCaseBusinessRule,
  UseCaseAcceptanceCriterion,
} from '../model/use-case'
import type { PrimaryFunctionChangeImpact } from '../model/flow-mention'
import { qualityApi, qualityCaseLinksHref, qualityCasesHref } from '@/modules/quality'
import type { TestCase } from '@/modules/quality'
import { ROUTES } from '@/constants/routes'

type Tab = 'conditions' | 'flows' | 'rules' | 'criteria' | 'test-cases'

const TABS: { id: Tab; label: string }[] = [
  { id: 'conditions', label: 'Conditions' },
  { id: 'flows', label: 'Flows' },
  { id: 'rules', label: 'Rules' },
  { id: 'criteria', label: 'Criteria' },
  { id: 'test-cases', label: 'Test Cases' },
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
  onUpdate,
  onDelete,
}: {
  conditions: UseCaseCondition[]
  onAdd: (conditionType: string, content: string) => Promise<void>
  onUpdate: (id: string, content: string, displayOrder: number) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [conditionType, setConditionType] = useState<string>(UseCaseConditionType.Precondition)
  const [content, setContent] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const enterEdit = () => {
    const next: Record<string, string> = {}
    for (const c of conditions) next[c.id] = c.content
    setDrafts(next)
    setEditing(true)
  }

  const leaveEdit = () => {
    setEditing(false)
    setDrafts({})
    setAdding(false)
  }

  const save = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      await onAdd(conditionType, content.trim())
      setContent('')
      setConditionType(UseCaseConditionType.Precondition)
      setAdding(false)
      toast.success('Condition added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add condition')
    } finally {
      setSaving(false)
    }
  }

  const saveItem = async (c: UseCaseCondition) => {
    const next = (drafts[c.id] ?? c.content).trim()
    if (!next) {
      toast.error('Content is required')
      return
    }
    if (next === c.content) return
    setSavingId(c.id)
    try {
      await onUpdate(c.id, next, c.displayOrder)
      toast.success('Condition updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update condition')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={() => (editing ? leaveEdit() : enterEdit())}>
          {editing ? 'Done' : 'Edit'}
        </Button>
      </div>
      {Object.values(UseCaseConditionType).map((type) => {
        const group = conditions.filter((c) => c.conditionType === type)
        return (
          <div key={type}>
            <p className="text-xs text-neutral-500">{CONDITION_TYPE_LABELS[type]}</p>
            {group.length === 0 ? (
              <p className="mt-1 text-sm text-neutral-400">None</p>
            ) : (
              <ul className="mt-1 space-y-2">
                {group.map((c) => (
                  <li key={c.id} className="space-y-2 border border-neutral-100 px-3 py-2 text-sm">
                    {editing ? (
                      <>
                        <Textarea
                          rows={2}
                          value={drafts[c.id] ?? c.content}
                          onChange={(e) =>
                            setDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                          }
                          fullWidth
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            disabled={savingId === c.id || !(drafts[c.id] ?? c.content).trim()}
                            onClick={() => void saveItem(c)}
                          >
                            {savingId === c.id ? 'Saving…' : 'Save'}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            tone="error"
                            disabled={savingId === c.id}
                            onClick={() => void onDelete(c.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="min-w-0 whitespace-pre-wrap break-words text-neutral-800">
                        {c.content}
                      </p>
                    )}
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
            <Button size="sm" onClick={() => void save()} disabled={saving || !content.trim()}>
              {saving ? 'Saving…' : 'Add'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
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
  onUpdate,
  onDelete,
}: {
  businessRules: UseCaseBusinessRule[]
  onAdd: (ruleCode: string, description: string) => Promise<void>
  onUpdate: (
    id: string,
    body: { ruleCode: string; description: string; displayOrder: number }
  ) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [drafts, setDrafts] = useState<
    Record<string, { ruleCode: string; description: string }>
  >({})
  const [ruleCode, setRuleCode] = useState('')
  const [description, setDescription] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const enterEdit = () => {
    const next: Record<string, { ruleCode: string; description: string }> = {}
    for (const rule of businessRules) {
      next[rule.id] = { ruleCode: rule.ruleCode, description: rule.description }
    }
    setDrafts(next)
    setEditing(true)
  }

  const leaveEdit = () => {
    setEditing(false)
    setDrafts({})
    setAdding(false)
  }

  const save = async () => {
    if (!ruleCode.trim() || !description.trim()) return
    setSaving(true)
    try {
      await onAdd(ruleCode.trim(), description.trim())
      setRuleCode('')
      setDescription('')
      setAdding(false)
      toast.success('Rule added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add rule')
    } finally {
      setSaving(false)
    }
  }

  const saveItem = async (rule: UseCaseBusinessRule) => {
    const draft = drafts[rule.id] ?? {
      ruleCode: rule.ruleCode,
      description: rule.description,
    }
    const nextCode = draft.ruleCode.trim()
    const nextDesc = draft.description.trim()
    if (!nextCode || !nextDesc) {
      toast.error('Rule code and description are required')
      return
    }
    if (nextCode === rule.ruleCode && nextDesc === rule.description) return
    setSavingId(rule.id)
    try {
      await onUpdate(rule.id, {
        ruleCode: nextCode,
        description: nextDesc,
        displayOrder: rule.displayOrder,
      })
      toast.success('Rule updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update rule')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={() => (editing ? leaveEdit() : enterEdit())}>
          {editing ? 'Done' : 'Edit'}
        </Button>
      </div>
      {businessRules.map((rule) => {
        const draft = drafts[rule.id] ?? {
          ruleCode: rule.ruleCode,
          description: rule.description,
        }
        return (
          <div key={rule.id} className="space-y-2 border border-neutral-100 px-3 py-2">
            {editing ? (
              <>
                <div>
                  <p className="mb-1 text-xs text-neutral-500">Rule code</p>
                  <Input
                    value={draft.ruleCode}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [rule.id]: { ...draft, ruleCode: e.target.value },
                      }))
                    }
                    size="sm"
                    fullWidth
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-neutral-500">Description</p>
                  <Textarea
                    rows={2}
                    value={draft.description}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [rule.id]: { ...draft, description: e.target.value },
                      }))
                    }
                    fullWidth
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={
                      savingId === rule.id || !draft.ruleCode.trim() || !draft.description.trim()
                    }
                    onClick={() => void saveItem(rule)}
                  >
                    {savingId === rule.id ? 'Saving…' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    tone="error"
                    disabled={savingId === rule.id}
                    onClick={() => void onDelete(rule.id)}
                  >
                    Delete
                  </Button>
                </div>
              </>
            ) : (
              <div className="min-w-0">
                <span className="font-mono text-xs font-semibold text-neutral-500">
                  {rule.ruleCode}
                </span>
                <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-neutral-800">
                  {rule.description}
                </p>
              </div>
            )}
          </div>
        )
      })}

      {businessRules.length === 0 && (
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
              onClick={() => void save()}
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
          type="button"
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
  onUpdate,
  onDelete,
}: {
  acceptanceCriteria: UseCaseAcceptanceCriterion[]
  onAdd: (
    title: string,
    given: string | null,
    when: string | null,
    then: string | null
  ) => Promise<void>
  onUpdate: (
    id: string,
    body: {
      title: string
      givenText: string | null
      whenText: string | null
      thenText: string | null
      displayOrder: number
    }
  ) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [adding, setAdding] = useState(false)
  const [drafts, setDrafts] = useState<
    Record<string, { title: string; given: string; when: string; then: string }>
  >({})
  const [title, setTitle] = useState('')
  const [given, setGiven] = useState('')
  const [when, setWhen] = useState('')
  const [then, setThen] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const enterEdit = () => {
    const next: Record<string, { title: string; given: string; when: string; then: string }> = {}
    for (const ac of acceptanceCriteria) {
      next[ac.id] = {
        title: ac.title,
        given: ac.givenText ?? '',
        when: ac.whenText ?? '',
        then: ac.thenText ?? '',
      }
    }
    setDrafts(next)
    setEditing(true)
  }

  const leaveEdit = () => {
    setEditing(false)
    setDrafts({})
    setAdding(false)
  }

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
      toast.success('Criterion added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add criterion')
    } finally {
      setSaving(false)
    }
  }

  const saveItem = async (ac: UseCaseAcceptanceCriterion) => {
    const draft = drafts[ac.id] ?? {
      title: ac.title,
      given: ac.givenText ?? '',
      when: ac.whenText ?? '',
      then: ac.thenText ?? '',
    }
    const nextTitle = draft.title.trim()
    if (!nextTitle) {
      toast.error('Title is required')
      return
    }
    const givenText = draft.given.trim() || null
    const whenText = draft.when.trim() || null
    const thenText = draft.then.trim() || null
    if (
      nextTitle === ac.title &&
      givenText === (ac.givenText ?? null) &&
      whenText === (ac.whenText ?? null) &&
      thenText === (ac.thenText ?? null)
    ) {
      return
    }
    setSavingId(ac.id)
    try {
      await onUpdate(ac.id, {
        title: nextTitle,
        givenText,
        whenText,
        thenText,
        displayOrder: ac.displayOrder,
      })
      toast.success('Criterion updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update criterion')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={() => (editing ? leaveEdit() : enterEdit())}>
          {editing ? 'Done' : 'Edit'}
        </Button>
      </div>
      {acceptanceCriteria.map((ac) => {
        const draft = drafts[ac.id] ?? {
          title: ac.title,
          given: ac.givenText ?? '',
          when: ac.whenText ?? '',
          then: ac.thenText ?? '',
        }
        return (
          <div key={ac.id} className="space-y-2 border border-neutral-100 px-3 py-2">
            {editing ? (
              <>
                <div>
                  <p className="mb-1 text-xs text-neutral-500">Title</p>
                  <Input
                    value={draft.title}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [ac.id]: { ...draft, title: e.target.value },
                      }))
                    }
                    size="sm"
                    fullWidth
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-neutral-500">Given</p>
                  <Textarea
                    rows={1}
                    value={draft.given}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [ac.id]: { ...draft, given: e.target.value },
                      }))
                    }
                    fullWidth
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-neutral-500">When</p>
                  <Textarea
                    rows={1}
                    value={draft.when}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [ac.id]: { ...draft, when: e.target.value },
                      }))
                    }
                    fullWidth
                  />
                </div>
                <div>
                  <p className="mb-1 text-xs text-neutral-500">Then</p>
                  <Textarea
                    rows={1}
                    value={draft.then}
                    onChange={(e) =>
                      setDrafts((prev) => ({
                        ...prev,
                        [ac.id]: { ...draft, then: e.target.value },
                      }))
                    }
                    fullWidth
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={savingId === ac.id || !draft.title.trim()}
                    onClick={() => void saveItem(ac)}
                  >
                    {savingId === ac.id ? 'Saving…' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    tone="error"
                    disabled={savingId === ac.id}
                    onClick={() => void onDelete(ac.id)}
                  >
                    Delete
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="min-w-0 whitespace-pre-wrap break-words text-sm font-medium text-neutral-800">
                  {ac.title}
                </p>
                {(ac.givenText || ac.whenText || ac.thenText) && (
                  <div className="mt-1 space-y-1 text-xs text-neutral-700">
                    {ac.givenText && (
                      <p className="whitespace-pre-wrap break-words">
                        <strong>Given:</strong> {ac.givenText}
                      </p>
                    )}
                    {ac.whenText && (
                      <p className="whitespace-pre-wrap break-words">
                        <strong>When:</strong> {ac.whenText}
                      </p>
                    )}
                    {ac.thenText && (
                      <p className="whitespace-pre-wrap break-words">
                        <strong>Then:</strong> {ac.thenText}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )
      })}

      {acceptanceCriteria.length === 0 && (
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
            <Button size="sm" onClick={() => void save()} disabled={saving || !title.trim()}>
              {saving ? 'Saving…' : 'Add'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full border border-dashed border-neutral-200 py-2 text-xs text-neutral-500 hover:border-neutral-400 hover:text-neutral-700"
        >
          + Add criterion
        </button>
      )}
    </div>
  )
}

// ─── Linked Test Cases ────────────────────────────────────────────────────────

function UseCaseLinkedTestCasesTab({
  workspaceId,
  projectId,
  useCaseId,
}: {
  workspaceId: string
  projectId: string
  useCaseId: string
}) {
  const [linked, setLinked] = useState<TestCase[]>([])
  const [allCases, setAllCases] = useState<TestCase[]>([])
  const [loading, setLoading] = useState(true)
  const [pickerLoading, setPickerLoading] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadLinked = useCallback(async () => {
    setLoading(true)
    try {
      const res = await qualityApi.listTestCases(projectId, {
        useCaseId,
        page: 0,
        size: 500,
        sort: 'updatedAt,desc',
      })
      setLinked(res.items)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load Test Cases')
    } finally {
      setLoading(false)
    }
  }, [projectId, useCaseId])

  useEffect(() => {
    void loadLinked()
  }, [loadLinked])

  useEffect(() => {
    if (!addOpen) return
    let cancelled = false
    setPickerLoading(true)
    void (async () => {
      try {
        const res = await qualityApi.listTestCases(projectId, {
          page: 0,
          size: 500,
          sort: 'updatedAt,desc',
        })
        if (!cancelled) setAllCases(res.items)
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Failed to load Test Cases')
        }
      } finally {
        if (!cancelled) setPickerLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [addOpen, projectId])

  const linkedIds = useMemo(() => new Set(linked.map((tc) => tc.id)), [linked])

  const options = useMemo(
    () =>
      allCases.map((tc) => ({
        id: tc.id,
        code: tc.code,
        label: tc.title,
        meta: tc.useCaseId && tc.useCaseId !== useCaseId ? 'Linked to another Use Case' : null,
        disabled: linkedIds.has(tc.id),
      })),
    [allCases, linkedIds, useCaseId]
  )

  const assignMany = async (ids: string[]) => {
    setSaving(true)
    try {
      const toLink = ids.filter((id) => !linkedIds.has(id))
      for (const testCaseId of toLink) {
        let currentIds: string[] = []
        try {
          const traceability = await qualityApi.getTestCaseTraceability(projectId, testCaseId)
          currentIds = traceability.useCases.map((item) => item.id)
        } catch {
          const fromList = allCases.find((item) => item.id === testCaseId)?.useCaseId
          if (fromList) currentIds = [fromList]
        }
        const nextIds = [...new Set([...currentIds, useCaseId])]
        try {
          await qualityApi.replaceTestCaseUseCaseLinks(projectId, testCaseId, nextIds)
        } catch {
          // FK sync below is enough for this page
        }
        const detail = await qualityApi.getTestCase(projectId, testCaseId)
        await qualityApi.updateTestCase(projectId, testCaseId, {
          useCaseId,
          version: detail.version ?? 0,
        })
      }
      toast.success(`${toLink.length} Test Case${toLink.length === 1 ? '' : 's'} linked`)
      await loadLinked()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to link Test Cases')
      throw err
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-2">
        <Typography variant="small" tone="muted">
          Test Cases linked to this Use Case.
        </Typography>
        <Button
          size="sm"
          variant="ghost"
          icon={<Plus size={14} />}
          disabled={saving}
          onClick={() => setAddOpen(true)}
        >
          Add
        </Button>
      </div>

      {loading && linked.length === 0 ? (
        <Typography variant="small" tone="muted">
          Loading…
        </Typography>
      ) : linked.length === 0 ? (
        <Typography variant="small" tone="muted">
          No Test Cases linked yet.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-100 border border-neutral-100">
          {linked.map((tc) => (
            <li key={tc.id}>
              <NextLink
                href={qualityCasesHref(workspaceId, projectId, {
                  type: 'functional',
                  selected: tc.id,
                })}
                className="block px-3 py-2.5 hover:bg-neutral-50"
              >
                <Typography
                  variant="small"
                  className="whitespace-normal break-words text-primary underline-offset-2 hover:underline"
                >
                  <span className="font-mono text-xs text-neutral-400">{tc.code}</span>
                  {' · '}
                  {tc.title}
                </Typography>
              </NextLink>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="caption" tone="muted">
        Need to assign many across Use Cases?{' '}
        <NextLink
          href={qualityCaseLinksHref(workspaceId, projectId, useCaseId)}
          className="underline underline-offset-2 hover:text-neutral-800"
        >
          Open bulk link page
        </NextLink>
      </Typography>

      <MultiSelectLinkModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Test Cases"
        searchPlaceholder="Search test cases…"
        options={options}
        loading={pickerLoading}
        saving={saving}
        emptyMessage="No Test Cases in this project yet. Create them from Quality → Cases."
        confirmLabel="Add selected"
        onConfirm={assignMany}
      />
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
  const [primaryChangeImpact, setPrimaryChangeImpact] =
    useState<PrimaryFunctionChangeImpact | null>(null)
  const [pendingPrimaryFunctionId, setPendingPrimaryFunctionId] = useState<string | null>(null)
  const [primaryChanging, setPrimaryChanging] = useState(false)
  const hook = useUseCaseDetail(projectId, useCaseId)
  const { detail, loading, error } = hook
  const { functionalItems } = useFunctionalCatalog(projectId)

  const applyPrimaryFunction = useCallback(
    async (functionId: string) => {
      setPrimaryChanging(true)
      try {
        await hook.setPrimaryFunction(functionId)
        toast.success('Primary Function updated')
        setPrimaryChangeImpact(null)
        setPendingPrimaryFunctionId(null)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to set primary Function')
      } finally {
        setPrimaryChanging(false)
      }
    },
    [hook]
  )

  const requestPrimaryFunctionChange = useCallback(
    async (functionId: string) => {
      try {
        const impact = await hook.previewPrimaryFunctionChange(functionId)
        if (impact && impact.outOfScopeMentions.length > 0) {
          setPendingPrimaryFunctionId(functionId)
          setPrimaryChangeImpact(impact)
          return
        }
        await applyPrimaryFunction(functionId)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to check Function change impact')
      }
    },
    [hook, applyPrimaryFunction]
  )

  if (loading && !detail) {
    return <div className="p-5 text-sm text-neutral-500">Loading...</div>
  }

  if (error || !detail) {
    return <div className="p-5 text-sm text-red-500">{error ?? 'Use case not found'}</div>
  }

  const { overview, flows, conditions, businessRules, acceptanceCriteria, supportingFunctions } =
    detail

  const primaryFunctionCode =
    functionalItems.find((item) => item.id === overview.primaryFunctionId)?.code ?? null

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
          <p className="text-xs text-neutral-500">
            {overview.primaryFunctionName || 'No primary Function linked yet'}
          </p>
        </div>
        <div className="flex items-center gap-1">
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
        <div className="mt-4">
          <p className="text-xs text-neutral-500">Functions</p>
          <div className="mt-1 space-y-1">
            {overview.primaryFunctionId ? (
              <div className="flex items-center justify-between gap-2 border border-neutral-100 px-3 py-1.5 text-sm">
                <span className="flex min-w-0 flex-wrap items-center gap-2">
                  <NextLink
                    href={`${ROUTES.workspace.projectFunctionalCatalog(workspaceId, projectId)}?fr=${encodeURIComponent(overview.primaryFunctionId)}`}
                    className="min-w-0 whitespace-normal break-words text-primary underline-offset-2 hover:underline"
                  >
                    {primaryFunctionCode ? (
                      <span className="font-mono text-xs text-neutral-400">
                        {primaryFunctionCode}
                      </span>
                    ) : null}
                    {primaryFunctionCode ? ' ' : null}
                    {overview.primaryFunctionName || 'Primary Function'}
                  </NextLink>
                  <Badge size="sm" variant="solid" tone="primary">
                    Primary
                  </Badge>
                </span>
              </div>
            ) : (
              <Typography variant="small" tone="muted">
                No primary Function yet. Mark one from supporting links or the Function catalog.
              </Typography>
            )}
            {supportingFunctions.map((sf) => (
              <div
                key={sf.functionId}
                className="flex items-center justify-between gap-2 border border-neutral-100 px-3 py-1.5 text-sm"
              >
                <NextLink
                  href={`${ROUTES.workspace.projectFunctionalCatalog(workspaceId, projectId)}?fr=${encodeURIComponent(sf.functionId)}`}
                  className="min-w-0 whitespace-normal break-words text-primary underline-offset-2 hover:underline"
                >
                  <span className="font-mono text-xs text-neutral-400">{sf.functionCode}</span>{' '}
                  {sf.functionName}
                </NextLink>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void requestPrimaryFunctionChange(sf.functionId)}
                    className="text-xs text-neutral-600 underline-offset-2 hover:underline"
                  >
                    Mark primary
                  </button>
                  <button
                    type="button"
                    onClick={() => void hook.removeSupportingFunction(sf.functionId)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
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
            onUpdate={(id, content, displayOrder) =>
              hook.updateCondition(id, { content, displayOrder })
            }
            onDelete={hook.deleteCondition}
          />
        )}

        {activeTab === 'flows' && (
          <div className="space-y-4">
            {flows.map((flow) => (
              <UseCaseFlowEditor
                key={flow.id}
                projectId={projectId}
                useCaseId={useCaseId}
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
            onUpdate={(id, body) => hook.updateRule(id, body)}
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
            onUpdate={(id, body) => hook.updateCriterion(id, body)}
            onDelete={hook.deleteCriterion}
          />
        )}

        {activeTab === 'test-cases' && (
          <UseCaseLinkedTestCasesTab
            workspaceId={workspaceId}
            projectId={projectId}
            useCaseId={useCaseId}
          />
        )}
      </div>

      <ConfirmDialog
        open={Boolean(primaryChangeImpact && pendingPrimaryFunctionId)}
        onClose={() => {
          setPrimaryChangeImpact(null)
          setPendingPrimaryFunctionId(null)
        }}
        title="Mentions outside new Function scope"
        message={
          primaryChangeImpact
            ? `${primaryChangeImpact.outOfScopeMentions.length} mention(s) in Flow steps are not linked to the new Function. They will be kept but marked out of scope until you edit them. Change primary Function anyway?`
            : ''
        }
        confirmLabel={primaryChanging ? 'Changing…' : 'Change anyway'}
        variant="danger"
        loading={primaryChanging}
        onConfirm={async () => {
          if (!pendingPrimaryFunctionId) return
          await applyPrimaryFunction(pendingPrimaryFunctionId)
        }}
      />
    </div>
  )
}
