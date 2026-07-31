'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Copy, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { UserSearchSelect, type PersonIdentity } from '@/modules/platform'
import {
  Badge,
  Button,
  Checkbox,
  DetailDrawer,
  Input,
  PageSkeleton,
  Select,
  Textarea,
  Typography,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import {
  useTestCaseDetail,
  type TestCaseLinkKind,
  type TestCaseLinkOption,
} from '../hooks/useTestCaseDetail'
import type { CreateTestCaseStepPayload, TestCaseStep } from '../../domain/model/quality'

interface TestCaseDetailDrawerProps {
  projectId: string
  testCaseId: string | null
  assigneePeople?: PersonIdentity[]
  onClose: () => void
  onChanged?: () => void
}

type DetailTab = 'overview' | 'steps' | 'traceability'

const STATUS_OPTIONS = ['DRAFT', 'READY', 'APPROVED', 'ARCHIVED'].map((value) => ({
  value,
  label: value,
}))
const PRIORITY_OPTIONS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((value) => ({
  value,
  label: value,
}))
const TYPE_OPTIONS = [
  'FUNCTIONAL',
  'NON_FUNCTIONAL',
  'INTEGRATION',
  'REGRESSION',
  'SMOKE',
  'PERFORMANCE',
  'SECURITY',
  'USABILITY',
  'EXPLORATORY',
].map((value) => ({
  value,
  label: value === 'NON_FUNCTIONAL' ? 'NON_FUNCTIONAL (legacy — use Verification Case)' : value,
  disabled: value === 'NON_FUNCTIONAL',
}))
const AUTOMATION_OPTIONS = ['MANUAL', 'PLANNED', 'AUTOMATED'].map((value) => ({
  value,
  label: value,
}))

function stepAction(step: TestCaseStep): string {
  return step.action
}

function stepOrder(step: TestCaseStep, index: number): number {
  return step.sortOrder ?? index + 1
}

function parseSteps(text: string): CreateTestCaseStepPayload[] {
  return text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const [action = '', expectedResult = ''] = line.split('\t')
      return {
        action: action.trim(),
        expectedResult: expectedResult.trim(),
      }
    })
    .filter((step) => step.action && step.expectedResult)
}

export function TestCaseDetailDrawer({
  projectId,
  testCaseId,
  assigneePeople = [],
  onClose,
  onChanged,
}: TestCaseDetailDrawerProps) {
  const {
    detail,
    traceability,
    loading,
    saving,
    error,
    update,
    addStep,
    updateStep,
    duplicateStep,
    archiveStep,
    bulkAddSteps,
    loadLinkOptions,
    replaceLinks,
  } = useTestCaseDetail(projectId, testCaseId)
  const [tab, setTab] = useState<DetailTab>('overview')
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteValue, setPasteValue] = useState('')
  const [linkKind, setLinkKind] = useState<TestCaseLinkKind | null>(null)
  const [linkOptions, setLinkOptions] = useState<TestCaseLinkOption[]>([])
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(new Set())
  const [linkQuery, setLinkQuery] = useState('')
  const [linkLoading, setLinkLoading] = useState(false)
  const [linkSaving, setLinkSaving] = useState(false)
  const hasUseCase = Boolean(detail?.useCaseId || traceability?.useCases.length)

  useEffect(() => {
    setTab('overview')
    setPasteOpen(false)
    setPasteValue('')
    setLinkKind(null)
    setLinkOptions([])
    setSelectedLinkIds(new Set())
    setLinkQuery('')
  }, [testCaseId])

  const saveField = async (key: string, value: string | null) => {
    if (!detail || detail[key as keyof typeof detail] === value) return
    await update({ [key]: value })
    onChanged?.()
  }

  const addBlankStep = async () => {
    if (!detail) return
    await addStep({
      action: 'New step',
      expectedResult: 'Expected result',
    })
    onChanged?.()
  }

  const submitPaste = async () => {
    const rows = parseSteps(pasteValue)
    if (rows.length === 0) return
    await bulkAddSteps(rows)
    setPasteOpen(false)
    setPasteValue('')
    onChanged?.()
  }

  const enterLinkMode = async (kind: TestCaseLinkKind) => {
    const currentLinks = traceability?.useCases ?? []
    setLinkKind(kind)
    setLinkQuery('')
    setSelectedLinkIds(new Set(currentLinks.map((item) => item.id)))
    setLinkLoading(true)
    try {
      const loaded = await loadLinkOptions(kind)
      const loadedIds = new Set(loaded.map((item) => item.id))
      setLinkOptions([
        ...loaded,
        ...currentLinks
          .filter((item) => !loadedIds.has(item.id))
          .map((item) => ({
            id: item.id,
            code: item.code,
            label: item.name ?? '—',
            status: 'CURRENTLY_LINKED',
          })),
      ])
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLinkLoading(false)
    }
  }

  const saveLinks = async () => {
    if (!linkKind) return
    setLinkSaving(true)
    try {
      await replaceLinks(linkKind, [...selectedLinkIds])
      toast.success('Use Case links updated successfully.')
      setLinkKind(null)
      onChanged?.()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLinkSaving(false)
    }
  }

  return (
    <DetailDrawer
      open={Boolean(testCaseId)}
      onClose={onClose}
      size="lg"
      title={detail?.title ?? 'Test Case'}
      subtitle={detail?.code ?? 'Test Case detail'}
      backdropClassName="bg-neutral-900/20"
    >
      {loading ? (
        <PageSkeleton variant="detail" />
      ) : error ? (
        <Typography tone="error">{error}</Typography>
      ) : detail ? (
        linkKind ? (
          <LinkPicker
            options={linkOptions}
            selected={selectedLinkIds}
            query={linkQuery}
            loading={linkLoading}
            saving={linkSaving}
            onBack={() => setLinkKind(null)}
            onQueryChange={setLinkQuery}
            onToggle={(id) =>
              setSelectedLinkIds((current) => {
                const next = new Set(current)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
              })
            }
            onSave={() => void saveLinks()}
          />
        ) : (
          <div className="space-y-lg">
            <div className="flex border-b border-neutral-200" role="tablist">
              {(['overview', 'steps', 'traceability'] as DetailTab[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={tab === item}
                  onClick={() => setTab(item)}
                  className={
                    tab === item
                      ? 'border-b-2 border-neutral-900 px-md py-sm text-sm text-neutral-900'
                      : 'px-md py-sm text-sm text-neutral-500'
                  }
                >
                  {item === 'overview'
                    ? 'Overview'
                    : item === 'steps'
                      ? `Steps (${detail.steps?.length ?? 0})`
                      : 'Traceability'}
                </button>
              ))}
            </div>

            {tab === 'overview' ? (
              <div className="space-y-md">
                {!hasUseCase ? (
                  <div className="border-warning/40 bg-warning/5 border px-3 py-2">
                    <Typography variant="small" weight="medium">
                      Link a Use Case before moving this Test Case beyond Draft.
                    </Typography>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1 h-auto px-0 font-normal"
                      onClick={() => {
                        setTab('traceability')
                        void enterLinkMode('useCase')
                      }}
                    >
                      Select Use Case
                    </Button>
                  </div>
                ) : null}
                <Input
                  label="Title"
                  defaultValue={detail.title}
                  disabled={saving}
                  onBlur={(event) => void saveField('title', event.target.value.trim())}
                />
                <div className="grid grid-cols-2 gap-md">
                  <Select
                    label="Status"
                    value={detail.status}
                    options={STATUS_OPTIONS.map((option) => ({
                      ...option,
                      disabled:
                        !hasUseCase && (option.value === 'READY' || option.value === 'APPROVED'),
                    }))}
                    disabled={saving}
                    onValueChange={(value: string) => void saveField('status', value)}
                  />
                  <Select
                    label="Priority"
                    value={detail.priority ?? 'MEDIUM'}
                    options={PRIORITY_OPTIONS}
                    disabled={saving}
                    onValueChange={(value: string) => void saveField('priority', value)}
                  />
                  <Select
                    label="Type"
                    value={detail.type ?? 'FUNCTIONAL'}
                    options={TYPE_OPTIONS}
                    disabled={saving}
                    onValueChange={(value: string) => void saveField('type', value)}
                  />
                  <Select
                    label="Automation"
                    value={detail.automationStatus ?? 'MANUAL'}
                    options={AUTOMATION_OPTIONS}
                    disabled={saving}
                    onValueChange={(value: string) => void saveField('automationStatus', value)}
                  />
                </div>
                <UserSearchSelect
                  label="Assignee"
                  value={detail.assigneeId ?? ''}
                  seedPeople={assigneePeople}
                  allowRemoteSearch={false}
                  disabled={saving}
                  onChange={(userId) => void saveField('assigneeId', userId || null)}
                />
                <Textarea
                  label="Description"
                  defaultValue={detail.description ?? ''}
                  rows={4}
                  disabled={saving}
                  onBlur={(event) => void saveField('description', event.target.value || null)}
                />
                <Textarea
                  label="Preconditions"
                  defaultValue={detail.preconditions ?? ''}
                  rows={3}
                  disabled={saving}
                  onBlur={(event) => void saveField('preconditions', event.target.value || null)}
                />
                <div className="grid grid-cols-3 gap-sm border-t border-neutral-200 pt-md">
                  <div>
                    <Typography variant="caption" tone="muted">
                      Latest result
                    </Typography>
                    <div className="mt-xs">
                      <Badge tone={detail.latestResult === 'FAILED' ? 'error' : 'neutral'}>
                        {detail.latestResult ?? 'NOT RUN'}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Typography variant="caption" tone="muted">
                      Requirements
                    </Typography>
                    <Typography>{detail.requirementCount ?? 0}</Typography>
                  </div>
                  <div>
                    <Typography variant="caption" tone="muted">
                      Open defects
                    </Typography>
                    <Typography>{detail.openDefectCount ?? 0}</Typography>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === 'steps' ? (
              <div className="space-y-md">
                <div className="flex items-center justify-between gap-sm">
                  <Typography variant="small" tone="muted">
                    Edit action and expected result inline.
                  </Typography>
                  <div className="flex gap-xs">
                    <Button size="sm" variant="ghost" onClick={() => setPasteOpen((open) => !open)}>
                      Paste steps
                    </Button>
                    <Button size="sm" icon={<Plus size={14} />} onClick={() => void addBlankStep()}>
                      Add step
                    </Button>
                  </div>
                </div>
                {pasteOpen ? (
                  <div className="space-y-sm border border-neutral-200 bg-neutral-50 p-md">
                    <Typography variant="caption" tone="muted">
                      Paste tab-separated columns: Action · Expected result.
                    </Typography>
                    <Textarea
                      value={pasteValue}
                      onChange={(event) => setPasteValue(event.target.value)}
                      rows={5}
                      placeholder={
                        'Open login page\tLogin form appears\nEnter credentials\tValues are accepted'
                      }
                    />
                    <div className="flex justify-end gap-xs">
                      <Button size="sm" variant="ghost" onClick={() => setPasteOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        disabled={parseSteps(pasteValue).length === 0}
                        onClick={() => void submitPaste()}
                      >
                        Add {parseSteps(pasteValue).length} steps
                      </Button>
                    </div>
                  </div>
                ) : null}
                {detail.steps.length === 0 ? (
                  <div className="border border-dashed border-neutral-300 p-lg text-center">
                    <Typography tone="muted">No test steps yet.</Typography>
                  </div>
                ) : (
                  <div className="space-y-sm">
                    {detail.steps.map((step, index) => (
                      <div
                        key={step.id}
                        className="grid grid-cols-[auto_1fr_auto] gap-sm border border-neutral-200 p-sm"
                      >
                        <Typography variant="caption" tone="muted" className="pt-sm">
                          {stepOrder(step, index)}
                        </Typography>
                        <div className="grid gap-sm">
                          <Input
                            aria-label={`Step ${index + 1} action`}
                            defaultValue={stepAction(step)}
                            onBlur={(event) =>
                              void updateStep(step.id, {
                                action: event.target.value,
                                version: step.version,
                              })
                            }
                          />
                          <Input
                            aria-label={`Step ${index + 1} expected result`}
                            defaultValue={step.expectedResult ?? ''}
                            onBlur={(event) =>
                              void updateStep(step.id, {
                                expectedResult: event.target.value,
                                version: step.version,
                              })
                            }
                          />
                        </div>
                        <div className="flex flex-col gap-xs">
                          <Button
                            size="sm"
                            variant="ghost"
                            icon={<Copy size={14} />}
                            aria-label="Duplicate step"
                            onClick={() => void duplicateStep(step.id)}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            tone="error"
                            icon={<Trash2 size={14} />}
                            aria-label="Archive step"
                            onClick={() => void archiveStep(step.id)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {tab === 'traceability' ? (
              <div className="space-y-lg">
                <LinkedGroup
                  title="Requirements (derived through Use Case)"
                  items={(traceability?.requirements ?? []).map((item) => ({
                    id: item.id,
                    code: item.code,
                    label: item.name ?? '—',
                  }))}
                  readOnly
                />
                <LinkedGroup
                  title="Use Cases"
                  items={(traceability?.useCases ?? []).map((item) => ({
                    id: item.id,
                    code: item.code,
                    label: item.name ?? '—',
                  }))}
                  actionLabel="Manage links"
                  onAction={() => void enterLinkMode('useCase')}
                />
                <LinkedGroup
                  title="Derived Functions"
                  items={(traceability?.derivedFunctions ?? []).map((item) => ({
                    id: item.id,
                    code: item.code,
                    label: item.name ?? '—',
                  }))}
                  readOnly
                />
                {traceability?.derivedScreens?.length ? (
                  <LinkedGroup
                    title="Derived Screens"
                    items={traceability.derivedScreens.map((item) => ({
                      id: item.id,
                      code: item.code,
                      label: item.name ?? '—',
                    }))}
                    readOnly
                  />
                ) : null}
                {traceability?.derivedApis?.length ? (
                  <LinkedGroup
                    title="Derived APIs"
                    items={traceability.derivedApis.map((item) => ({
                      id: item.id,
                      code: item.code,
                      label: item.name ?? '—',
                    }))}
                    readOnly
                  />
                ) : null}
                {traceability?.derivedComponents?.length ? (
                  <LinkedGroup
                    title="Derived Components"
                    items={traceability.derivedComponents.map((item) => ({
                      id: item.id,
                      code: item.code,
                      label: item.name ?? '—',
                    }))}
                    readOnly
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        )
      ) : null}
    </DetailDrawer>
  )
}

function LinkPicker({
  options,
  selected,
  query,
  loading,
  saving,
  onBack,
  onQueryChange,
  onToggle,
  onSave,
}: {
  options: TestCaseLinkOption[]
  selected: Set<string>
  query: string
  loading: boolean
  saving: boolean
  onBack: () => void
  onQueryChange: (value: string) => void
  onToggle: (id: string) => void
  onSave: () => void
}) {
  const entityLabel = 'Use Cases'
  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return options
    return options.filter((item) =>
      [item.code, item.label, item.status]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized))
    )
  }, [options, query])
  const selectedOptions = options.filter((item) => selected.has(item.id))

  return (
    <div className="space-y-md">
      <div className="flex items-start gap-sm border-b border-neutral-200 pb-md">
        <Button
          size="sm"
          variant="ghost"
          icon={<ArrowLeft size={16} />}
          aria-label="Back to Test Case detail"
          onClick={onBack}
        />
        <div>
          <Typography variant="h4">Link {entityLabel}</Typography>
          <Typography variant="caption" tone="muted">
            Select the complete desired link set. Saving replaces the current links.
          </Typography>
        </div>
      </div>

      <Input
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        prefix={<Search size={15} />}
        placeholder={`Search ${entityLabel.toLowerCase()} by code or name`}
        fullWidth
      />

      <div className="grid min-h-96 border border-neutral-200 sm:grid-cols-2">
        <section className="border-b border-neutral-200 sm:border-b-0 sm:border-r">
          <div className="border-b border-neutral-200 bg-neutral-50 px-md py-sm">
            <Typography variant="small" weight="medium">
              Available {entityLabel} · {filtered.length}
            </Typography>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <PageSkeleton variant="list" className="p-md" />
            ) : filtered.length === 0 ? (
              <Typography variant="small" tone="muted" className="p-md">
                No matching {entityLabel.toLowerCase()}.
              </Typography>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {filtered.map((item) => (
                  <li key={item.id}>
                    <label className="flex cursor-pointer items-start gap-sm px-md py-sm hover:bg-neutral-50">
                      <Checkbox
                        size="sm"
                        checked={selected.has(item.id)}
                        onChange={() => onToggle(item.id)}
                        aria-label={`Select ${item.label}`}
                      />
                      <span className="min-w-0">
                        <Typography variant="small" className="block truncate">
                          {item.code ? `${item.code} · ` : ''}
                          {item.label}
                        </Typography>
                        {item.status ? (
                          <Typography variant="caption" tone="muted">
                            {item.status.replace(/_/g, ' ')}
                          </Typography>
                        ) : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section>
          <div className="border-b border-neutral-200 bg-neutral-50 px-md py-sm">
            <Typography variant="small" weight="medium">
              Selected · {selectedOptions.length}
            </Typography>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {selectedOptions.length === 0 ? (
              <Typography variant="small" tone="muted" className="p-md">
                No links selected.
              </Typography>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {selectedOptions.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-sm px-md py-sm"
                  >
                    <Typography variant="small" className="min-w-0 truncate">
                      {item.code ? `${item.code} · ` : ''}
                      {item.label}
                    </Typography>
                    <Button size="sm" variant="ghost" onClick={() => onToggle(item.id)}>
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>

      <div className="flex justify-end gap-sm">
        <Button variant="ghost" onClick={onBack} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSave} loading={saving} disabled={loading || saving}>
          Save {selected.size} links
        </Button>
      </div>
    </div>
  )
}

function LinkedGroup({
  title,
  items,
  readOnly = false,
  actionLabel,
  onAction,
}: {
  title: string
  items: Array<{ id: string; code?: string | null; label: string }>
  readOnly?: boolean
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <section className="space-y-sm">
      <div className="flex items-center justify-between">
        <Typography variant="small" weight="medium">
          {title}
        </Typography>
        {readOnly ? (
          <Badge tone="neutral" size="sm">
            Derived
          </Badge>
        ) : actionLabel && onAction ? (
          <Button size="sm" variant="ghost" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </div>
      {items.length === 0 ? (
        <Typography variant="caption" tone="muted">
          No links.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-100 border border-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="px-md py-sm">
              <Typography variant="small">
                {item.code ? `${item.code} · ` : ''}
                {item.label}
              </Typography>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
