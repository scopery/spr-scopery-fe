'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, Minus, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Checkbox,
  DetailDrawer,
  PageSkeleton,
  Select,
  Typography,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { ApiError } from '@/shared/lib/api-types'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { cn } from '@/utils/cn'
import {
  NfrSpecificationPanel,
  qualityApi,
  qualityCasesHref,
  qualityRunsHref,
  type NfrSpecification,
  type VerificationCase,
} from '@/modules/quality'
import {
  requirementPriorityBadgeProps,
  requirementPriorityLabel,
} from '@/modules/projects/requirements/model/requirement-priority'
import {
  canMutateRequirementLinks,
  RequirementImmutableMessages,
} from '@/modules/projects/requirements/model/requirement-status'
import { useRequirementTraceDetail } from '../hooks/useRequirementTraceDetail'
import * as requirementTraceabilityApi from '../api/requirement-traceability.api'
import * as traceabilityApi from '../api/traceability.api'
import * as useCaseApi from '../api/use-case.api'
import { linkRequirementToFunctionWithCovers } from '../api/requirement-function-link.api'
import {
  invalidateSpecPackEntityCache,
  invalidateSpecPackPreviewCache,
} from '@/modules/projects/requirements/model/spec-pack-preview.cache'
import {
  buildLayerSteps,
  buildNfrLayerSteps,
  coverageStatusLabel,
  coverageStatusTone,
  isNfrRequirement,
  resolveDisplayCoverageStatus,
  type LayerStepState,
  type TracePreviewObject,
  type CoverageChainFunction,
} from '../model/requirement-traceability'

type DrawerMode = 'summary' | 'function' | 'useCase' | 'testCase' | 'manageFunction'
type LinkMode = Extract<DrawerMode, 'function' | 'useCase' | 'testCase'>

interface RequirementTraceDetailDrawerProps {
  open: boolean
  onClose: () => void
  projectId: string
  requirementId: string | null
  initialLinkMode?: 'function' | 'useCase' | null
  onChanged?: () => void
  /** Fallback when trace-detail API omits description/priority. */
  seedDescription?: string | null
  seedPriority?: string | null
}

interface PickerItem {
  id: string
  label: string
  status?: string | null
  type?: string | null
}

interface NextAction {
  type:
    | 'linkFunction'
    | 'linkUseCase'
    | 'manageImplementation'
    | 'linkTest'
    | 'editNfr'
    | 'addVerificationCase'
    | 'runVerification'
    | 'complete'
  label: string
  description: string
}

const MODE_COPY: Record<
  LinkMode,
  {
    title: string
    search: string
    available: string
    empty: string
    selected: string
    success: (count: number) => string
  }
> = {
  function: {
    title: 'Link Functions',
    search: 'Search functions by code or title…',
    available: 'Available Functions',
    empty: 'No linkable Functions are available.',
    selected: 'Link selected',
    success: (count) => `${count} Function${count === 1 ? '' : 's'} linked successfully.`,
  },
  useCase: {
    title: 'Link Use Cases',
    search: 'Search Use Cases by key or name…',
    available: 'Available Use Cases',
    empty: 'No Use Cases are available for the linked Functions.',
    selected: 'Link selected',
    success: (count) => `${count} Use Case${count === 1 ? '' : 's'} linked successfully.`,
  },
  testCase: {
    title: 'Link Test Cases',
    search: 'Search Test Cases by code or title…',
    available: 'Available Test Cases',
    empty: 'No linkable Test Cases are available.',
    selected: 'Link selected',
    success: (count) => `${count} Test Case${count === 1 ? '' : 's'} linked successfully.`,
  },
}

const STEP_STYLE: Record<LayerStepState['state'], string> = {
  ok: 'text-success',
  missing: 'text-error',
  blocked: 'text-neutral-400',
  na: 'text-neutral-400',
}

const STEP_LABEL: Record<LayerStepState['state'], string> = {
  ok: 'Linked',
  missing: 'Missing',
  blocked: 'Not evaluated',
  na: 'N/A',
}

function StageIcon({ state }: { state: LayerStepState['state'] }) {
  const className = 'size-4'
  if (state === 'ok') return <Check className={className} aria-hidden />
  if (state === 'missing') return <X className={className} aria-hidden />
  return <Minus className={className} aria-hidden />
}

function CoveragePipeline({ steps }: { steps: LayerStepState[] }) {
  return (
    <section>
      <Typography variant="small" weight="semibold" className="mb-2">
        Coverage path
      </Typography>
      <div className="grid grid-cols-2 border border-neutral-200 sm:grid-cols-4">
        {steps.map((step) => {
          const blockedMessage =
            step.state === 'blocked'
              ? `${step.label} coverage cannot be evaluated until a Function is linked.`
              : undefined
          return (
            <div
              key={step.key}
              className="min-w-0 border-b border-r border-neutral-200 px-3 py-3 last:border-r-0 sm:border-b-0"
              title={blockedMessage}
            >
              <div className={cn('flex items-center gap-1.5', STEP_STYLE[step.state])}>
                <StageIcon state={step.state} />
                <Typography variant="small" weight="medium">
                  {step.label}
                </Typography>
              </div>
              <Typography variant="caption" className={cn('mt-1 block', STEP_STYLE[step.state])}>
                {STEP_LABEL[step.state]}
              </Typography>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function objectLabel(item: TracePreviewObject): string {
  return [item.code, item.name].filter(Boolean).join(' · ') || item.name || item.id
}

function CoverageChainTree({ chain }: { chain: CoverageChainFunction[] }) {
  if (chain.length === 0) {
    return (
      <Typography variant="small" tone="muted" className="px-3 py-3">
        No Function → Use Case → Test Case chain yet. Link a Function to start.
      </Typography>
    )
  }

  return (
    <ul className="divide-y divide-neutral-100">
      {chain.map((fnNode) => (
        <li key={fnNode.function.id} className="px-3 py-3">
          <Typography variant="small" weight="semibold">
            Function · {objectLabel(fnNode.function)}
          </Typography>
          {fnNode.useCases.length === 0 ? (
            <Typography variant="caption" tone="muted" className="mt-1 block pl-3">
              No Use Case under this Function
            </Typography>
          ) : (
            <ul className="mt-2 space-y-2 border-l border-neutral-200 pl-3">
              {fnNode.useCases.map((ucNode) => (
                <li key={ucNode.useCase.id}>
                  <Typography variant="small">
                    Use Case · {objectLabel(ucNode.useCase)}
                  </Typography>
                  {ucNode.testCases.length === 0 ? (
                    <Typography variant="caption" tone="muted" className="mt-0.5 block pl-3">
                      No Test Case
                    </Typography>
                  ) : (
                    <ul className="mt-1 space-y-0.5 border-l border-neutral-100 pl-3">
                      {ucNode.testCases.map((tc) => (
                        <li key={tc.id}>
                          <Typography variant="caption" className="text-neutral-700">
                            TC · {objectLabel(tc)}
                            {tc.latestResult ? ` · ${tc.latestResult}` : ''}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ul>
  )
}

function LinkedObjectRow({
  label,
  items,
  count = items.length,
  emptyLabel = 'None linked',
  note,
  actionLabel,
  actionDisabled,
  onAction,
}: {
  label: string
  items: TracePreviewObject[]
  count?: number
  emptyLabel?: string
  note?: string
  actionLabel: string
  actionDisabled?: boolean
  onAction: () => void
}) {
  const visible = items.slice(0, 2)
  const more = Math.max(0, count - visible.length)

  return (
    <div className="border-b border-neutral-100 px-3 py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <Typography variant="small" weight="semibold">
          {label} <span className="font-normal text-neutral-400">{count}</span>
        </Typography>
        <Button
          size="sm"
          variant="ghost"
          className="h-auto px-0 font-normal"
          disabled={actionDisabled}
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      </div>
      {visible.length > 0 ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {visible.map((item) => (
            <span
              key={`${item.objectType}-${item.id}`}
              className="max-w-full truncate bg-neutral-100 px-2 py-1 text-xs text-neutral-800"
              title={[item.code, item.name].filter(Boolean).join(' · ')}
            >
              {[item.code, item.name].filter(Boolean).join(' · ')}
            </span>
          ))}
          {more > 0 ? <span className="text-xs text-neutral-500">+{more} more</span> : null}
        </div>
      ) : (
        <Typography variant="small" tone="muted" className="mt-1">
          {emptyLabel}
        </Typography>
      )}
      {note ? (
        <Typography variant="caption" tone="muted" className="mt-1 block">
          {note}
        </Typography>
      ) : null}
    </div>
  )
}

function implementationLabel(items: TracePreviewObject[]): string {
  const counts = new Map<string, number>()
  for (const item of items) {
    const raw = item.objectType || 'Object'
    const label = raw
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/^\w/, (char) => char.toUpperCase())
    counts.set(label, (counts.get(label) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([label, count]) => `${count} ${label}${count === 1 ? '' : 's'}`)
    .join(' · ')
}

export function RequirementTraceDetailDrawer({
  open,
  onClose,
  projectId,
  requirementId,
  initialLinkMode = null,
  onChanged,
  seedDescription = null,
  seedPriority = null,
}: RequirementTraceDetailDrawerProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const router = useRouter()
  const { data, loading, error, refetch } = useRequirementTraceDetail(
    projectId,
    open ? requirementId : null,
    seedDescription,
    seedPriority
  )
  const [mode, setMode] = useState<DrawerMode>('summary')
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<PickerItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [pickerLoading, setPickerLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [nfrSpecification, setNfrSpecification] = useState<NfrSpecification | null>(null)
  const [nfrTargetCount, setNfrTargetCount] = useState(0)
  const [verificationCases, setVerificationCases] = useState<VerificationCase[]>([])
  const [nfrLoading, setNfrLoading] = useState(false)
  const [nfrError, setNfrError] = useState<string | null>(null)
  const [nfrRefreshKey, setNfrRefreshKey] = useState(0)
  const [unlinkingFunctionId, setUnlinkingFunctionId] = useState<string | null>(null)

  const title = data
    ? [data.requirement.code, data.requirement.title].filter(Boolean).join(' · ')
    : 'Requirement coverage'
  const functionCount = data?.functions.length ?? 0
  const useCaseCount = data?.useCases.length ?? 0
  const implementationCount = data?.implementationObjects.length ?? 0
  const testCount = data?.testCases.length ?? 0
  const isNfr = isNfrRequirement(data?.requirement.requirementType)
  const linksLocked = data ? !canMutateRequirementLinks(data.requirement.status) : false

  const displayStatus = data
    ? isNfr
      ? data.coverageStatus
      : resolveDisplayCoverageStatus({
          coverageStatus: data.coverageStatus,
          functionCount,
          useCaseCount,
          implementationCount,
          testCaseCount: testCount,
        })
    : null

  const steps = data
    ? isNfr
      ? buildNfrLayerSteps({
          specificationConfigured: Boolean(nfrSpecification),
          verificationTargetCount: nfrTargetCount,
          verificationCaseCount: verificationCases.length,
          verificationResultCount: undefined,
        })
      : buildLayerSteps({
          functionCount,
          useCaseCount,
          implementationCount,
          testCaseCount: testCount,
          requiresUseCaseResolved: data.requirement.requiresUseCaseResolved,
        })
    : []

  const nextAction: NextAction | null = data
    ? isNfr
      ? !nfrSpecification
        ? {
            type: 'editNfr',
            label: 'Define NFR Specification',
            description: 'Define a measurable quality attribute and target value.',
          }
        : nfrTargetCount === 0
          ? {
              type: 'editNfr',
              label: 'Add Verification Target',
              description: 'Identify the system, module, API, or component to verify.',
            }
          : verificationCases.length === 0
            ? {
                type: 'addVerificationCase',
                label: 'Add Verification Case',
                description: 'Create an executable verification procedure for this NFR.',
              }
            : {
                type: 'runVerification',
                label: 'Open Verification Runs',
                description: 'Record a measured result for the linked Verification Cases.',
              }
      : functionCount === 0
        ? {
            type: 'linkFunction',
            label: 'Link Function',
            description: 'This Requirement has no linked Function.',
          }
        : data.requirement.requiresUseCaseResolved && useCaseCount === 0
          ? {
              type: 'linkUseCase',
              label: 'Manage Function → Use Case Links',
              description: 'The linked Functions do not yet lead to a Use Case.',
            }
          : implementationCount === 0
            ? {
                type: 'manageImplementation',
                label: 'Manage Function Relations',
                description: 'The linked Functions have no implementation evidence.',
              }
            : testCount === 0
              ? {
                  type: 'linkTest',
                  label: 'Create Test Case from Use Case',
                  description:
                    'Create a Test Case under one of the linked Use Cases so traceability remains complete.',
                }
              : {
                  type: 'complete',
                  label: 'Coverage complete',
                  description: 'All required traceability layers are covered.',
                }
    : null

  const enterMode = (nextMode: DrawerMode) => {
    if (isNfr && nextMode !== 'summary') return
    if (nextMode === 'useCase' && functionCount === 0) return
    if (
      linksLocked &&
      (nextMode === 'function' || nextMode === 'useCase' || nextMode === 'testCase')
    ) {
      toast.error(RequirementImmutableMessages.LINK_LOCKED)
      return
    }
    setMode(nextMode)
    setQuery('')
    setOptions([])
    setSelected(new Set())
    setStatusFilter('')
    setTypeFilter('')
  }

  useEffect(() => {
    if (open && initialLinkMode && data) enterMode(initialLinkMode)
    // Open the requested picker only when a new requirement drawer opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialLinkMode, data?.requirement.id])

  useEffect(() => {
    if (!open) {
      setMode('summary')
      setSelected(new Set())
    }
  }, [open])

  useEffect(() => {
    if (!open || !requirementId || !isNfr) {
      setNfrSpecification(null)
      setNfrTargetCount(0)
      setVerificationCases([])
      setNfrError(null)
      return
    }

    let cancelled = false
    const loadNfrTrace = async () => {
      setNfrLoading(true)
      setNfrError(null)
      try {
        const [specification, targets, cases] = await Promise.all([
          qualityApi.getNfrSpecification(projectId, requirementId).catch((error) => {
            if (error instanceof ApiError && error.status === 404) return null
            throw error
          }),
          qualityApi.getNfrTargets(projectId, requirementId).catch((error) => {
            if (error instanceof ApiError && error.status === 404) {
              return { requirementId, targets: [] }
            }
            throw error
          }),
          qualityApi.listVerificationCases(projectId, {
            requirementId,
            page: 0,
            size: 100,
          }),
        ])
        if (cancelled) return
        setNfrSpecification(specification)
        setNfrTargetCount(targets.targets.length)
        setVerificationCases(cases.items)
      } catch (error) {
        if (!cancelled) setNfrError(getProblemToastMessage(error))
      } finally {
        if (!cancelled) setNfrLoading(false)
      }
    }

    void loadNfrTrace()
    return () => {
      cancelled = true
    }
  }, [isNfr, nfrRefreshKey, open, projectId, requirementId])

  useEffect(() => {
    if (!open || !requirementId || !['function', 'useCase', 'testCase'].includes(mode)) return
    let cancelled = false
    const timer = window.setTimeout(async () => {
      setPickerLoading(true)
      try {
        let items: PickerItem[]
        if (mode === 'function') {
          const result = await requirementTraceabilityApi.listLinkableFunctions(
            projectId,
            requirementId,
            { q: query.trim() || undefined, limit: 200 }
          )
          items = result.map((item) => ({
            id: item.id,
            label: `${item.code} · ${item.title}`,
            status: item.status,
            type: item.type,
          }))
        } else if (mode === 'useCase') {
          const result = await requirementTraceabilityApi.listLinkableUseCases(
            projectId,
            requirementId,
            { q: query.trim() || undefined, limit: 200 }
          )
          items = result.map((item) => ({
            id: item.id,
            label: `${item.key} · ${item.name}`,
            status: item.status,
            type: item.completenessStatus,
          }))
        } else {
          const result = await traceabilityApi.listLinkableTestCases(projectId, requirementId, {
            q: query.trim() || undefined,
            limit: 200,
          })
          items = result.items.map((item) => ({
            id: item.id,
            label: [item.code, item.title].filter(Boolean).join(' · '),
            status: item.status,
            type: item.type,
          }))
        }
        if (!cancelled) setOptions(items)
      } catch (err) {
        if (!cancelled) toast.error(getProblemToastMessage(err))
      } finally {
        if (!cancelled) setPickerLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [open, mode, projectId, query, requirementId])

  const filteredOptions = useMemo(
    () =>
      options.filter(
        (item) =>
          (!statusFilter || item.status === statusFilter) &&
          (!typeFilter || item.type === typeFilter)
      ),
    [options, statusFilter, typeFilter]
  )
  const statusOptions = useMemo(
    () => [
      { value: '', label: 'All statuses' },
      ...[...new Set(options.map((item) => item.status).filter(Boolean))].map((value) => ({
        value: String(value),
        label: String(value).replace(/_/g, ' '),
      })),
    ],
    [options]
  )
  const typeOptions = useMemo(
    () => [
      { value: '', label: 'All types' },
      ...[...new Set(options.map((item) => item.type).filter(Boolean))].map((value) => ({
        value: String(value),
        label: String(value).replace(/_/g, ' '),
      })),
    ],
    [options]
  )

  const toggleSelected = (id: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allFilteredSelected =
    filteredOptions.length > 0 && filteredOptions.every((item) => selected.has(item.id))

  const toggleSelectAllFiltered = () => {
    setSelected((current) => {
      const next = new Set(current)
      if (allFilteredSelected) {
        for (const item of filteredOptions) next.delete(item.id)
      } else {
        for (const item of filteredOptions) next.add(item.id)
      }
      return next
    })
  }

  const saveLinks = async () => {
    if (
      !requirementId ||
      !['function', 'useCase', 'testCase'].includes(mode) ||
      selected.size === 0
    ) {
      return
    }
    if (linksLocked) {
      toast.error(RequirementImmutableMessages.LINK_LOCKED)
      return
    }
    const linkMode = mode as LinkMode
    const ids = [...selected]
    setSaving(true)
    try {
      if (linkMode === 'function') {
        await Promise.all(
          ids.map(async (id) => {
            await linkRequirementToFunctionWithCovers(projectId, id, requirementId)
          })
        )
      } else if (linkMode === 'useCase') {
        await Promise.all(
          ids.map((id) => useCaseApi.linkRequirementToUseCase(projectId, id, { requirementId }))
        )
      } else {
        await traceabilityApi.linkTestCasesToRequirement(projectId, requirementId, ids)
      }
      toast.success(MODE_COPY[linkMode].success(ids.length))
      await refetch()
      // Spec Pack preview caches trace indices; invalidate to reflect the latest links immediately.
      invalidateSpecPackPreviewCache()
      invalidateSpecPackEntityCache(projectId)
      onChanged?.()
      setMode('summary')
      setSelected(new Set())
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const openFunctionRelations = (functionId: string) => {
    onClose()
    router.push(
      `${ROUTES.workspace.projectFunctionalCatalog(workspaceId, projectId)}?fr=${encodeURIComponent(functionId)}`
    )
  }

  const unlinkFunction = async (functionId: string) => {
    if (!requirementId || linksLocked) return
    setUnlinkingFunctionId(functionId)
    try {
      await useCaseApi.unlinkRequirementFromFunction(projectId, functionId, requirementId)
      await refetch()
      invalidateSpecPackPreviewCache()
      invalidateSpecPackEntityCache(projectId)
      onChanged?.()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setUnlinkingFunctionId(null)
    }
  }

  const manageFunctions = () => {
    if (!data?.functions.length) {
      enterMode('function')
    } else {
      enterMode('manageFunction')
    }
  }

  const openTestCaseCatalog = () => {
    const useCaseId = data?.useCases.length === 1 ? data.useCases[0].id : null
    onClose()
    router.push(
      qualityCasesHref(workspaceId, projectId, {
        type: 'functional',
        query: useCaseId ? `create=1&useCaseId=${encodeURIComponent(useCaseId)}` : undefined,
      })
    )
  }

  const openUseCaseLinks = () => {
    const base = ROUTES.workspace.projectUseCases(workspaceId, projectId)
    const functionId = data?.functions.length === 1 ? data.functions[0].id : null
    const query = new URLSearchParams({ tab: 'links' })
    if (functionId) query.set('functionId', functionId)
    onClose()
    router.push(`${base}?${query.toString()}`)
  }

  const handleNextAction = () => {
    if (!nextAction) return
    if (nextAction.type === 'linkFunction') enterMode('function')
    else if (nextAction.type === 'linkUseCase') openUseCaseLinks()
    else if (nextAction.type === 'manageImplementation') manageFunctions()
    else if (nextAction.type === 'linkTest') openTestCaseCatalog()
    else if (nextAction.type === 'editNfr') {
      document.getElementById('nfr-trace-editor')?.scrollIntoView({ behavior: 'smooth' })
    } else if (nextAction.type === 'addVerificationCase') {
      onClose()
      router.push(qualityCasesHref(workspaceId, projectId, { type: 'nfr' }))
    } else if (nextAction.type === 'runVerification') {
      onClose()
      router.push(qualityRunsHref(workspaceId, projectId))
    }
  }

  const closeDrawer = () => {
    setMode('summary')
    onClose()
  }

  const catalogHref =
    mode === 'useCase'
      ? ROUTES.workspace.projectUseCases(workspaceId, projectId)
      : mode === 'testCase'
        ? qualityCasesHref(workspaceId, projectId, { type: 'functional' })
        : ROUTES.workspace.projectFunctionalCatalog(workspaceId, projectId)

  const footer = ['function', 'useCase', 'testCase'].includes(mode) ? (
    <div className="flex items-center justify-between gap-3">
      <Typography variant="small" tone="muted">
        Selected: {selected.size}
      </Typography>
      <div className="flex gap-2">
        <Button variant="ghost" onClick={() => setMode('summary')} disabled={saving}>
          Cancel
        </Button>
        <Button
          variant="primary"
          loading={saving}
          disabled={selected.size === 0}
          onClick={() => void saveLinks()}
        >
          {MODE_COPY[mode as LinkMode].selected}
        </Button>
      </div>
    </div>
  ) : undefined

  return (
    <DetailDrawer
      open={open}
      onClose={closeDrawer}
      size="lg"
      panelClassName="sm:max-w-[600px] sm:w-[42vw]"
      backdropClassName="bg-neutral-900/25 backdrop-blur-none"
      title={
        mode === 'summary'
          ? title
          : mode === 'manageFunction'
            ? 'Manage Function Relations'
            : MODE_COPY[mode as LinkMode].title
      }
      subtitle={
        mode === 'summary'
          ? isNfr
            ? 'NFR verification path'
            : 'Functional coverage path'
          : 'Requirement linking'
      }
      footer={footer}
    >
      {loading ? <PageSkeleton variant="list" /> : null}
      {error ? (
        <div>
          <Typography tone="error">{error}</Typography>
          <Button className="mt-3" size="sm" variant="ghost" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : null}

      {data && mode === 'summary' && displayStatus ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              size="sm"
              variant="soft"
              tone={coverageStatusTone(displayStatus)}
              className="border-0"
            >
              {coverageStatusLabel(displayStatus)}
            </Badge>
            <Badge size="sm" variant="soft" tone="neutral" className="border-0">
              {data.requirement.requirementType}
            </Badge>
            {data.requirement.priority
              ? (() => {
                  const badge = requirementPriorityBadgeProps(data.requirement.priority)
                  return (
                    <Badge
                      size="sm"
                      variant={badge.variant}
                      tone={badge.tone}
                      className={cn('border-0', badge.className)}
                    >
                      {requirementPriorityLabel(data.requirement.priority)}
                    </Badge>
                  )
                })()
              : null}
            {!isNfr ? (
              <Typography variant="caption" tone="muted">
                Use Case required: {data.requirement.requiresUseCaseResolved ? 'Yes' : 'No'}
              </Typography>
            ) : null}
          </div>

          <section>
            <Typography variant="caption" tone="muted">
              Description
            </Typography>
            <Typography variant="small" className="mt-1 whitespace-pre-wrap text-neutral-800">
              {data.requirement.description?.trim() || 'No description.'}
            </Typography>
          </section>

          {linksLocked ? (
            <Typography variant="small" tone="error">
              {RequirementImmutableMessages.LINK_LOCKED}
            </Typography>
          ) : null}

          {isNfr && nfrLoading ? (
            <PageSkeleton variant="list" />
          ) : (
            <CoveragePipeline steps={steps} />
          )}

          {isNfr ? (
            <div className="space-y-4">
              {nfrError ? (
                <div className="border-error/30 bg-error/5 border px-3 py-2">
                  <Typography variant="small" tone="error">
                    {nfrError}
                  </Typography>
                </div>
              ) : null}

              <section className="border border-neutral-200">
                <div className="border-b border-neutral-100 px-3 py-3">
                  <Typography variant="small" weight="semibold">
                    Verification Cases{' '}
                    <span className="font-normal text-neutral-400">{verificationCases.length}</span>
                  </Typography>
                  {verificationCases.length === 0 ? (
                    <Typography variant="small" tone="muted" className="mt-1">
                      No executable verification procedure exists yet.
                    </Typography>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {verificationCases.slice(0, 5).map((verificationCase) => (
                        <li
                          key={verificationCase.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="min-w-0 truncate">
                            {[verificationCase.code, verificationCase.title]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                          <span className="shrink-0 text-xs text-neutral-500">
                            {verificationCase.lifecycleStatus}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 h-auto px-0 font-normal"
                    onClick={() => {
                      onClose()
                      router.push(qualityCasesHref(workspaceId, projectId, { type: 'nfr' }))
                    }}
                  >
                    Open Verification Cases
                  </Button>
                </div>
                <div className="px-3 py-3">
                  <Typography variant="small" weight="semibold">
                    Measured results
                  </Typography>
                  <Typography variant="small" tone="muted" className="mt-1">
                    Results are recorded per NON_FUNCTIONAL or MIXED Test Run.
                  </Typography>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-2 h-auto px-0 font-normal"
                    onClick={() => {
                      onClose()
                      router.push(qualityRunsHref(workspaceId, projectId))
                    }}
                  >
                    Open Verification Runs
                  </Button>
                </div>
              </section>

              <div id="nfr-trace-editor">
                <NfrSpecificationPanel
                  projectId={projectId}
                  requirementId={data.requirement.id}
                  onSaved={() => {
                    setNfrRefreshKey((current) => current + 1)
                    onChanged?.()
                  }}
                />
              </div>
            </div>
          ) : (
            <section className="border border-neutral-200">
              <div className="border-b border-neutral-100 px-3 py-2.5">
                <Typography variant="small" weight="semibold">
                  Coverage chain
                </Typography>
                <Typography variant="caption" tone="muted" className="mt-0.5 block">
                  Requirement → Function → Use Case → Test Case (including links through Functions /
                  Use Cases, not only direct Requirement links).
                </Typography>
              </div>
              <CoverageChainTree chain={data.coverageChain ?? []} />
              <LinkedObjectRow
                label="Functions"
                items={data.functions}
                actionLabel="Link"
                onAction={() => enterMode('function')}
              />
              <LinkedObjectRow
                label="Use Cases"
                items={data.useCases}
                actionLabel="Manage"
                actionDisabled={functionCount === 0}
                note={functionCount === 0 ? 'Link a Function before linking Use Cases.' : undefined}
                onAction={openUseCaseLinks}
              />
              <LinkedObjectRow
                label="Implementation"
                items={data.implementationObjects}
                emptyLabel={functionCount === 0 ? 'Not evaluated' : 'No implementation evidence'}
                note={
                  implementationCount > 0
                    ? implementationLabel(data.implementationObjects)
                    : 'Derived through linked Functions'
                }
                actionLabel="Manage"
                actionDisabled={functionCount === 0}
                onAction={manageFunctions}
              />
              <LinkedObjectRow
                label="Test Cases"
                items={data.testCases}
                actionLabel="Open Catalog"
                note="Includes Test Cases linked via Use Case (FK / coverage), not only direct TESTED_BY."
                onAction={openTestCaseCatalog}
              />
            </section>
          )}

          <section className="border border-neutral-200 bg-neutral-50 px-4 py-3">
            <Typography variant="small" weight="semibold">
              Next action
            </Typography>
            <Typography variant="small" tone="muted" className="mt-1">
              {nextAction?.description}
            </Typography>
            {nextAction?.type !== 'complete' ? (
              <Button size="sm" variant="primary" className="mt-3" onClick={handleNextAction}>
                {nextAction?.label}
              </Button>
            ) : (
              <Typography variant="small" className="mt-2 text-success">
                Coverage complete
              </Typography>
            )}
          </section>
        </div>
      ) : null}

      {data && ['function', 'useCase', 'testCase'].includes(mode) ? (
        <div className="space-y-4">
          <Button
            size="sm"
            variant="ghost"
            icon={<ArrowLeft size={14} />}
            className="h-auto px-0 font-normal"
            onClick={() => setMode('summary')}
          >
            Back to coverage
          </Button>
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Requirement
            </Typography>
            <Typography weight="medium">{title}</Typography>
          </div>

          <div className="flex items-center gap-2 border border-neutral-200 bg-white px-2.5 py-2">
            <Search size={14} className="shrink-0 text-neutral-400" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={MODE_COPY[mode as LinkMode].search}
              className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              aria-label={MODE_COPY[mode as LinkMode].search}
            />
          </div>

          {mode === 'testCase' ? (
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                options={statusOptions}
              />
              <Select value={typeFilter} onValueChange={setTypeFilter} options={typeOptions} />
            </div>
          ) : null}

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <Typography variant="small" weight="semibold">
                {MODE_COPY[mode as LinkMode].available}
              </Typography>
              {filteredOptions.length > 0 ? (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-auto px-0 font-normal"
                  disabled={saving || pickerLoading}
                  onClick={toggleSelectAllFiltered}
                >
                  {allFilteredSelected ? 'Clear all' : 'Select all'}
                </Button>
              ) : null}
            </div>
            {pickerLoading ? (
              <Typography variant="small" tone="muted">
                Loading…
              </Typography>
            ) : filteredOptions.length === 0 ? (
              <div className="border border-neutral-200 px-4 py-5">
                <Typography variant="small" weight="medium">
                  {options.length > 0
                    ? 'No items match the selected filters.'
                    : MODE_COPY[mode as LinkMode].empty}
                </Typography>
                {options.length === 0 && mode === 'useCase' ? (
                  <Typography variant="small" tone="muted" className="mt-1">
                    Create or manage Use Cases from the Use Case Catalog.
                  </Typography>
                ) : null}
                {options.length === 0 ? (
                  <Button
                    as="a"
                    href={catalogHref}
                    target="_blank"
                    rel="noreferrer"
                    size="sm"
                    variant="ghost"
                    className="mt-2 h-auto px-0 font-normal"
                  >
                    {mode === 'useCase'
                      ? 'Open Use Case Catalog'
                      : mode === 'testCase'
                        ? 'Open Test Case Catalog'
                        : 'Open Functional Catalog'}
                  </Button>
                ) : null}
              </div>
            ) : (
              <ul className="max-h-[48vh] overflow-y-auto border border-neutral-200">
                {filteredOptions.map((item) => (
                  <li key={item.id} className="border-b border-neutral-100 last:border-b-0">
                    <div
                      role="button"
                      tabIndex={0}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-neutral-50',
                        selected.has(item.id) && 'bg-neutral-50'
                      )}
                      onClick={() => toggleSelected(item.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          toggleSelected(item.id)
                        }
                      }}
                    >
                      <Checkbox
                        size="sm"
                        checked={selected.has(item.id)}
                        onChange={() => toggleSelected(item.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-0.5"
                        aria-label={item.label}
                      />
                      <span className="min-w-0">
                        <Typography variant="small" className="whitespace-normal break-words">
                          {item.label}
                        </Typography>
                        {item.status || item.type ? (
                          <Typography variant="caption" tone="muted" className="mt-0.5 block">
                            {[item.status, item.type].filter(Boolean).join(' · ')}
                          </Typography>
                        ) : null}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      {data && mode === 'manageFunction' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <Button
              size="sm"
              variant="ghost"
              icon={<ArrowLeft size={14} />}
              className="h-auto px-0 font-normal"
              onClick={() => setMode('summary')}
            >
              Back to coverage
            </Button>
            {!linksLocked ? (
              <Button size="sm" variant="ghost" onClick={() => enterMode('function')}>
                + Link more
              </Button>
            ) : null}
          </div>
          <ul className="border border-neutral-200">
            {data.functions.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 border-b border-neutral-100 px-3 py-2.5 last:border-b-0"
              >
                <Typography variant="small" className="min-w-0 truncate">
                  {[item.code, item.name].filter(Boolean).join(' · ')}
                </Typography>
                <div className="flex shrink-0 items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => openFunctionRelations(item.id)}>
                    Manage
                  </Button>
                  {!linksLocked ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={unlinkingFunctionId === item.id}
                      loading={unlinkingFunctionId === item.id}
                      onClick={() => void unlinkFunction(item.id)}
                    >
                      Unlink
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DetailDrawer>
  )
}
