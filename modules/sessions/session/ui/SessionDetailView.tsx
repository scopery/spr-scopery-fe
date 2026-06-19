'use client'

import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import Link from 'next/link'
import { CloudCheck, AlertCircle, CircleArrowOutUpLeft } from 'lucide-react'
import {
  Typography,
  Button,
  Badge,
  Input,
  Textarea,
  Switch,
  Select,
  ContentLoader,
  Divider,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import * as sessionsApi from '@/modules/sessions/session/api/sessions.api'
import * as aiClarityApi from '@/modules/sessions/clarity/api/ai-clarity.api'
import { useSessionDetail } from '../hooks/useSessionDetail'
import { SESSION_STATUS_LABEL, type AnswerItem } from '../model/session'
import type { ClarityAssessment, ClaritySummary } from '@/modules/sessions/clarity'
import { useProject, type ProjectQuestion, ProjectStepIndicator } from '@/modules/projects'
import {
  canEditProject,
  isOrgReadonly,
  resolveProjectRole,
  buildDocumentSpacePermissions,
} from '@/utils/permissions'
import { ApiError, getProblemCode } from '@/shared/lib/api-types'
import { useOrg } from '@/modules/org'
import { useEffectivePermissions } from '@/modules/permissions'
import { FEATURES } from '@/config/features'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { toAnswerText } from '@/utils/answerText'
import { toast } from 'sonner'
import { cn } from '@/utils/cn'
import { AIImproveModal } from '@/modules/sessions/ai-improve/ui/AIImproveModal'
import { AIImproveAllModal } from '@/modules/sessions/ai-improve/ui/AIImproveAllModal'
import { ClarityBadge } from '@/modules/sessions/clarity/ui/ClarityBadge'
import { ClarityPanel } from '@/modules/sessions/clarity/ui/ClarityPanel'
import { ClarityDetailsModal } from '@/modules/sessions/clarity/ui/ClarityDetailsModal'
import { Lock, Sparkles, ClipboardCheck, Download } from 'lucide-react'
import Image from 'next/image'
import * as XLSX from 'xlsx'
import { EntityEvidenceDocumentsPanel, AnswerEvidenceStrip } from '@/modules/documents'

type AnswerStatus = 'answered' | 'skipped' | 'na'

/** Compare answer values so we don't overwrite user input with stale save response. */
function answerValuesEqual(local: unknown, server: unknown): boolean {
  if (local === server) return true
  if (local == null && server == null) return true
  if (local == null || server == null) return false
  const toStr = (v: unknown): string => {
    if (typeof v === 'string') return v
    if (v !== null && typeof v === 'object' && 'text' in v)
      return String((v as { text?: unknown }).text ?? '')
    try {
      return JSON.stringify(v)
    } catch {
      return String(v)
    }
  }
  return toStr(local) === toStr(server)
}

/** Display order of sections (same as admin template — not alphabetical). */
const SECTION_ORDER = ['overview', 'scope', 'risks', 'timeline', 'assumptions', 'general']

function sectionSortIndex(section: string): number {
  const i = SECTION_ORDER.indexOf(section || 'general')
  return i >= 0 ? i : SECTION_ORDER.length
}

/** Default value shape per q_type when switching back to "Answered" so we never send empty by mistake */
function getDefaultValueForType(qType: string): unknown {
  switch (qType) {
    case 'text':
    case 'textarea':
      return { text: '' }
    case 'number':
      return { number: undefined }
    case 'boolean':
      return { boolean: false }
    case 'date':
      return { date: '' }
    case 'select':
    case 'single_select':
      return ''
    default:
      return {}
  }
}

function QuestionItem({
  q,
  answer,
  onChange,
  readonly,
  onAiImprove,
  showAiButton,
  questionOrder: _questionOrder,
  clarityAssessment,
  onAssessClarity,
  assessClarityLoading,
  onOpenClarityModal,
  showAssessClarityButton,
  clarityFeatureDisabled,
  orgId,
  projectId,
  sessionId,
  linkPermissions,
}: {
  q: ProjectQuestion
  answer: AnswerItem | undefined
  onChange: (status: AnswerStatus, value: unknown, skipReason?: string) => void
  readonly: boolean
  onAiImprove?: (q: ProjectQuestion) => void
  showAiButton?: boolean
  questionOrder?: number
  clarityAssessment?: ClarityAssessment | null
  onAssessClarity?: () => void
  assessClarityLoading?: boolean
  onOpenClarityModal?: () => void
  showAssessClarityButton?: boolean
  clarityFeatureDisabled?: boolean
  orgId?: string
  projectId?: string
  sessionId?: string
  linkPermissions?: {
    canView: boolean
    canCreate: boolean
    canRemove: boolean
    canRestoreDocument?: boolean
    canExport?: boolean
  }
}) {
  const status = (answer?.answer_status ?? 'answered') as AnswerStatus
  const value = answer?.value
  const skipReason = answer?.skip_reason ?? ''
  const isAnswered = status === 'answered'
  // Preserve last typed value when user toggles Skipped/N/A then back to Answered (otherwise we'd send value: null → empty)
  const lastAnsweredValueRef = useRef<unknown>(null)

  const handleStatusChange = (s: AnswerStatus) => {
    if (readonly) return
    if (s === 'skipped' || s === 'na') {
      onChange(s, null, '')
    } else {
      // When switching back to "Answered", use current value or last typed value so we don't send empty
      const valueToUse = value ?? lastAnsweredValueRef.current ?? getDefaultValueForType(q.q_type)
      onChange('answered', valueToUse, undefined)
    }
  }

  const handleValueChange = (v: unknown) => {
    if (readonly) return
    lastAnsweredValueRef.current = v
    onChange('answered', v, undefined)
  }

  const renderInput = () => {
    if (status === 'skipped' || status === 'na') return null
    const disabled = readonly
    switch (q.q_type) {
      case 'text':
        return (
          <Input
            value={(value as { text?: string })?.text ?? (typeof value === 'string' ? value : '')}
            onChange={(e) => handleValueChange({ text: e.target.value })}
            placeholder="Your answer"
            fullWidth
            disabled={disabled}
          />
        )
      case 'textarea':
        return (
          <Textarea
            value={(value as { text?: string })?.text ?? (typeof value === 'string' ? value : '')}
            onChange={(e) => handleValueChange({ text: e.target.value })}
            placeholder="Your answer"
            fullWidth
            disabled={disabled}
            className="border-none"
          />
        )
      case 'number':
        return (
          <Input
            type="number"
            value={
              (value as { number?: number })?.number ?? (typeof value === 'number' ? value : '')
            }
            onChange={(e) => handleValueChange({ number: e.target.valueAsNumber || undefined })}
            placeholder="Number"
            fullWidth
            disabled={disabled}
          />
        )
      case 'boolean':
        return (
          <Switch
            checked={!!(value as { boolean?: boolean })?.boolean || value === true}
            onChange={(e) => handleValueChange({ boolean: e.target.checked })}
            disabled={disabled}
          />
        )
      case 'date':
        return (
          <Input
            type="date"
            value={(value as { date?: string })?.date ?? (typeof value === 'string' ? value : '')}
            onChange={(e) => handleValueChange({ date: e.target.value })}
            fullWidth
            disabled={disabled}
          />
        )
      case 'select':
      case 'single_select': {
        const schema = (q.answer_schema || {}) as {
          enum?: string[]
          options?: Array<{ value: string; label?: string }>
        }
        const options =
          schema.options?.map((o) => ({ value: o.value, label: o.label ?? o.value })) ??
          schema.enum?.map((v) => ({ value: v, label: v })) ??
          []
        const selectValue =
          typeof value === 'string' ? value : ((value as { select?: string })?.select ?? '')
        return (
          <Select
            options={options}
            value={selectValue || undefined}
            placeholder="Select an option"
            disabled={disabled}
            onValueChange={(v: string) => handleValueChange(v)}
            className="w-full"
          />
        )
      }
      default:
        return (
          <Textarea
            value={typeof value === 'object' ? JSON.stringify(value) : String(value ?? '')}
            onChange={(e) => {
              try {
                const parsed = e.target.value ? JSON.parse(e.target.value) : null
                handleValueChange(parsed)
              } catch {
                // invalid json, keep as-is
              }
            }}
            placeholder="JSON"
            fullWidth
            disabled={disabled}
          />
        )
    }
  }

  return (
    <div className="bg-white">
      <div className="mb-3 flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          {q.required && (
            <Badge variant="solid" tone="warning" size="sm" className="shrink-0">
              Required
            </Badge>
          )}
          <Typography weight="semibold">{q.prompt}</Typography>
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          {FEATURES.aiClarityAssessment &&
            showAssessClarityButton &&
            onAssessClarity != null &&
            !clarityFeatureDisabled && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onAssessClarity}
                loading={assessClarityLoading}
                disabled={!isAnswered}
                className="gap-1"
                title={!isAnswered ? 'Answer required to assess' : undefined}
                aria-label={!isAnswered ? 'Answer required to assess' : 'Assess clarity'}
              >
                <ClipboardCheck size={14} />
                Assess clarity
              </Button>
            )}
          {FEATURES.aiClarityAssessment && clarityAssessment && (
            <ClarityBadge
              label={clarityAssessment.clarity_label}
              score={clarityAssessment.clarity_score}
              onClick={onOpenClarityModal}
            />
          )}
          {FEATURES.aiImproveAnswer && showAiButton && onAiImprove && (
            <Button variant="ghost" size="sm" onClick={() => onAiImprove(q)} className="gap-1">
              <Sparkles size={14} />
              AI Improve
            </Button>
          )}
        </div>
      </div>
      {q.help_text && (
        <Typography variant="small" tone="muted" className="mb-1">
          {q.help_text}
        </Typography>
      )}
      {clarityAssessment && clarityAssessment.ambiguity_tags.length > 0 && (
        <Typography variant="small" tone="muted" className="mb-3">
          {clarityAssessment.ambiguity_tags[0]}
        </Typography>
      )}
      <div className="mb-3 flex gap-2">
        {(['answered', 'skipped', 'na'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStatusChange(s)}
            disabled={readonly}
            className={cn(
              'px-3 py-1.5 text-sm',
              status === s
                ? 'bg-primary text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            )}
          >
            {{ answered: 'Answered', skipped: 'Skipped', na: 'N/A' }[s]}
          </button>
        ))}
      </div>
      {(status === 'skipped' || status === 'na') && (
        <Input
          label="Reason (optional)"
          value={skipReason}
          onChange={(e) => onChange(status, null, e.target.value)}
          placeholder="Why skipped?"
          fullWidth
          disabled={readonly}
        />
      )}
      <Divider />
      {renderInput()}
      {orgId && projectId && sessionId && linkPermissions && (
        <AnswerEvidenceStrip
          orgId={orgId}
          projectId={projectId}
          sessionId={sessionId}
          questionId={q.id}
          canView={linkPermissions.canView}
          canCreateLink={linkPermissions.canCreate}
          canRemoveLink={linkPermissions.canRemove}
          canRestoreDocument={linkPermissions.canRestoreDocument}
        />
      )}
    </div>
  )
}

export type SessionDetailViewProps = {
  orgId: string
  projectId: string
  sessionId: string
}

export function SessionDetailView({ orgId, projectId, sessionId }: SessionDetailViewProps) {
  const { project } = useProject(orgId, projectId)
  const { org } = useOrg(orgId)
  const { permissions: effectivePermissions } = useEffectivePermissions(orgId, projectId)
  const {
    session,
    answers,
    setAnswers,
    progress,
    loading,
    refetch: refetchSession,
    refetchProgress,
  } = useSessionDetail(orgId, projectId, sessionId)
  const [saving, setSaving] = useState(false)
  const [lockLoading, setLockLoading] = useState(false)
  const [reopenLoading, setReopenLoading] = useState(false)
  const [pendingSave, setPendingSave] = useState(false)
  const [lastSaveSuccess, setLastSaveSuccess] = useState(false)
  const [sessionLockedFrom409, setSessionLockedFrom409] = useState(false)
  const [aiImproveQuestion, setAiImproveQuestion] = useState<ProjectQuestion | null>(null)
  const [aiImproveAllOpen, setAiImproveAllOpen] = useState(false)
  const [rightPanelTab, setRightPanelTab] = useState<
    'progress' | 'outline' | 'clarity' | 'evidence'
  >('progress')
  const [claritySummary, setClaritySummary] = useState<ClaritySummary | null>(null)
  const [claritySummaryLoading, setClaritySummaryLoading] = useState(false)
  const [claritySummaryError, setClaritySummaryError] = useState(false)
  const [assessmentsByOrder, setAssessmentsByOrder] = useState<Record<number, ClarityAssessment>>(
    {}
  )
  const [loadingByOrder, setLoadingByOrder] = useState<Record<number, boolean>>({})
  const [featureDisabled, setFeatureDisabled] = useState(false)
  const [clarityModalOrder, setClarityModalOrder] = useState<number | null>(null)
  const [bulkAssessLoading, setBulkAssessLoading] = useState(false)
  const bulkAssessAbortRef = useRef(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveIdRef = useRef(0)
  const answersRef = useRef(answers)
  answersRef.current = answers

  const projectRole = resolveProjectRole(project?.my_role)
  const editable = project ? canEditProject(projectRole) : false
  const orgReadonly = org ? isOrgReadonly(org.my_role) : false
  const isOrgOwner = org?.my_role === 'owner'
  const canSave = editable && session?.status === 'in_progress' && !sessionLockedFrom409
  const canLock = editable && (session?.status === 'in_progress' || session?.status === 'submitted')
  const canReopen = isOrgOwner && (session?.status === 'submitted' || session?.status === 'locked')
  const readonly = !canSave
  const canAssessClarity = editable && !orgReadonly

  const linkPerms = useMemo(() => {
    const fallback = canEditProject(projectRole)
    if (effectivePermissions) {
      const docPerms = buildDocumentSpacePermissions(effectivePermissions, fallback)
      return {
        canView: docPerms.canViewDocumentLinks,
        canCreate: docPerms.canCreateDocumentLinks,
        canRemove: docPerms.canDeleteDocumentLinks,
        canRestoreDocument: docPerms.canArchiveDocument,
        canExport: docPerms.canExportDocuments,
        canCreateDeliverable: docPerms.canCreateDocument && docPerms.canCreateFromTemplate,
      }
    }
    return {
      canView: true,
      canCreate: editable,
      canRemove: editable,
      canRestoreDocument: editable,
      canExport: editable,
      canCreateDeliverable: editable,
    }
  }, [effectivePermissions, projectRole, editable])

  const sortedQuestions = useMemo(
    () =>
      (session?.questions ?? []).slice().sort((a, b) => {
        const orderA = sectionSortIndex(a.section || '')
        const orderB = sectionSortIndex(b.section || '')
        if (orderA !== orderB) return orderA - orderB
        const posA = (a as { position?: number }).position ?? 0
        const posB = (b as { position?: number }).position ?? 0
        if (posA !== posB) return posA - posB
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }),
    [session?.questions]
  )

  const orderedQuestions = sortedQuestions
  const questionOrderMap = useMemo(() => {
    const map: Record<string, number> = {}
    orderedQuestions.forEach((q, idx) => {
      map[q.id] = idx + 1
    })
    return map
  }, [orderedQuestions])

  const questionsBySection = useMemo(
    () =>
      sortedQuestions.reduce(
        (acc, q) => {
          const s = q.section || 'general'
          if (!acc[s]) acc[s] = []
          acc[s].push(q)
          return acc
        },
        {} as Record<string, ProjectQuestion[]>
      ),
    [sortedQuestions]
  )

  /** Iterate section keys in SECTION_ORDER so content order is consistent. */
  const orderedSectionEntries = useMemo((): [string, ProjectQuestion[]][] => {
    const bySection = questionsBySection
    const order = [...SECTION_ORDER]
    const rest = Object.keys(bySection).filter((k) => !SECTION_ORDER.includes(k))
    rest.sort()
    for (const k of rest) order.push(k)
    return order.filter((k) => bySection[k]?.length).map((k) => [k, bySection[k]])
  }, [questionsBySection])

  const loadClaritySummary = useCallback(() => {
    if (!FEATURES.aiClarityAssessment) return
    if (!orgId || !projectId || !sessionId) return
    setClaritySummaryLoading(true)
    setClaritySummaryError(false)
    aiClarityApi
      .getClaritySummary(orgId, projectId, sessionId)
      .then(setClaritySummary)
      .catch(() => setClaritySummaryError(true))
      .finally(() => setClaritySummaryLoading(false))
  }, [orgId, projectId, sessionId])

  useEffect(() => {
    if (session?.id && FEATURES.aiClarityAssessment) loadClaritySummary()
  }, [session?.id, loadClaritySummary])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const saveAnswers = useCallback(
    async (
      newAnswers: Array<{
        question_id: string
        answer_status: AnswerStatus
        value: unknown
        skip_reason?: string | null
      }>
    ) => {
      if (!canSave || newAnswers.length === 0) return
      saveIdRef.current += 1
      const thisSaveId = saveIdRef.current
      setSaving(true)
      try {
        // API expects value as plain string for text/textarea (validation: "must be string"), not { text: "..." }
        const serializeValueForApi = (a: (typeof newAnswers)[0]): unknown => {
          const question = session?.questions?.find((q) => q.id === a.question_id)
          if (question && (question.q_type === 'text' || question.q_type === 'textarea')) {
            if (typeof a.value === 'string') return a.value
            if (a.value !== null && typeof a.value === 'object' && 'text' in a.value)
              return (a.value as { text?: string }).text ?? ''
            return ''
          }
          return a.value
        }
        const res = await sessionsApi.putAnswers(orgId, projectId, sessionId, {
          answers: newAnswers.map((a) => ({
            question_id: a.question_id,
            answer_status: a.answer_status,
            value: serializeValueForApi(a),
            skip_reason: a.skip_reason ?? null,
          })),
        })
        if (thisSaveId !== saveIdRef.current) return
        setAnswers((prev) => {
          const next = { ...prev }
          res.answers.forEach((a) => {
            const existing = prev[a.question_id]
            if (!existing) {
              next[a.question_id] = a
              return
            }
            // If user kept typing after we sent save, server returns older value — don't overwrite local
            if (answerValuesEqual(existing.value, a.value)) {
              next[a.question_id] = a
            } else {
              next[a.question_id] = { ...a, value: existing.value }
            }
          })
          return next
        })
        setLastSaveSuccess(true)
        refetchProgress()
      } catch (err) {
        if (thisSaveId !== saveIdRef.current) return
        if (
          err instanceof ApiError &&
          (getProblemCode(err) === 'SESSION_LOCKED' || err.problem.type?.includes('session-locked'))
        ) {
          setSessionLockedFrom409(true)
          toast.error('Session locked')
          refetchSession()
        } else {
          toast.error('Failed to save')
        }
        setLastSaveSuccess(false)
      } finally {
        if (thisSaveId === saveIdRef.current) {
          setSaving(false)
          setPendingSave(false)
        }
      }
    },
    [orgId, projectId, sessionId, canSave, session?.questions, refetchSession, refetchProgress]
  )

  const handleAnswerChange = useCallback(
    (questionId: string, status: AnswerStatus, value: unknown, skipReason?: string) => {
      const newAnswer = {
        question_id: questionId,
        answer_status: status,
        value,
        skip_reason: status === 'skipped' || status === 'na' ? (skipReason ?? null) : null,
      }
      setAnswers((prev) => ({
        ...prev,
        [questionId]: {
          ...prev[questionId],
          ...newAnswer,
          answered_by: '',
          answered_at: new Date().toISOString(),
        } as AnswerItem,
      }))
      setPendingSave(true)
      setLastSaveSuccess(false)
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        // Use current state at save time so we never send stale/empty value (e.g. closure had old value)
        const current = answersRef.current[questionId]
        const toSave = current
          ? {
              question_id: current.question_id,
              answer_status: current.answer_status as AnswerStatus,
              value: current.value,
              skip_reason: current.skip_reason ?? null,
            }
          : newAnswer
        saveAnswers([toSave])
        saveTimerRef.current = null
        setPendingSave(false)
      }, 3000)
    },
    [saveAnswers]
  )

  const cancelPendingAutosave = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    setPendingSave(false)
  }, [])

  const handleAssessClarity = useCallback(
    async (order: number, q: ProjectQuestion, answer: AnswerItem | undefined) => {
      if (!orgId || !projectId || !sessionId || featureDisabled) return
      const answerText = toAnswerText(
        q.q_type,
        answer?.value,
        q.answer_schema as Record<string, unknown>
      )
      setLoadingByOrder((prev) => ({ ...prev, [order]: true }))
      try {
        const res = await aiClarityApi.assessOne(orgId, projectId, sessionId, {
          question_order: order,
          section: q.section || 'general',
          question_text: q.prompt,
          answer_text: answerText,
          q_type: q.q_type || null,
          required: !!q.required,
        })
        setAssessmentsByOrder((prev) => ({ ...prev, [res.question_order]: res.assessment }))
        loadClaritySummary()
      } catch (err) {
        const code = getProblemCode(err)
        if (err instanceof ApiError && err.status === 409 && code === 'AI_FEATURE_DISABLED') {
          setFeatureDisabled(true)
          toast.error(getProblemToastMessage(err))
        } else if (err instanceof ApiError && err.status === 403) {
          toast.error(getProblemToastMessage(err))
        } else {
          toast.error(getProblemToastMessage(err))
        }
      } finally {
        setLoadingByOrder((prev) => ({ ...prev, [order]: false }))
      }
    },
    [orgId, projectId, sessionId, featureDisabled, loadClaritySummary]
  )

  const scrollToQuestion = useCallback((order: number) => {
    const el = document.getElementById(`question-order-${order}`)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('ring-2', 'ring-primary', 'ring-offset-2')
    setTimeout(() => {
      el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2')
    }, 2000)
  }, [])

  const handleExportExcel = useCallback(() => {
    const headers = ['Section', 'Position', 'Question', 'Type', 'Required', 'Status', 'Answer']
    const rows = orderedQuestions.map((q) => {
      const order = questionOrderMap[q.id]
      const ans = answers[q.id]
      const status = ans?.answer_status ?? '—'
      const answerText = toAnswerText(
        q.q_type,
        ans?.value,
        q.answer_schema as Record<string, unknown>
      )
      return [
        q.section || 'general',
        order ?? '',
        q.prompt,
        q.q_type,
        q.required ? 'Yes' : 'No',
        status,
        answerText || (status !== 'answered' ? status : ''),
      ]
    })
    const sheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, sheet, 'Questions')
    const safeName = (session?.name || 'session').replace(/[/\\?*\[\]:]/g, '-').slice(0, 80)
    XLSX.writeFile(wb, `${safeName}-questions.xlsx`)
    toast.success('Export downloaded')
  }, [orderedQuestions, questionOrderMap, answers, session?.name])

  const handleBulkAssess = useCallback(() => {
    if (
      !session?.questions ||
      !orgId ||
      !projectId ||
      !sessionId ||
      featureDisabled ||
      !canAssessClarity
    )
      return
    const toAssess = orderedQuestions.filter((q) => {
      const order = questionOrderMap[q.id]
      if (!order || !q.required) return false
      const ans = answers[q.id]
      if (ans?.answer_status !== 'answered') return false
      if (assessmentsByOrder[order]) return false
      return true
    })
    if (toAssess.length === 0) {
      toast.info('No missing required answers to assess.')
      return
    }
    bulkAssessAbortRef.current = false
    setBulkAssessLoading(true)
    let done = 0
    const run = async () => {
      for (const q of toAssess) {
        if (bulkAssessAbortRef.current) break
        const order = questionOrderMap[q.id]!
        const ans = answers[q.id]
        try {
          const res = await aiClarityApi.assessOne(orgId, projectId, sessionId, {
            question_order: order,
            section: q.section || 'general',
            question_text: q.prompt,
            answer_text: toAnswerText(
              q.q_type,
              ans?.value,
              q.answer_schema as Record<string, unknown>
            ),
            q_type: q.q_type || null,
            required: !!q.required,
          })
          setAssessmentsByOrder((prev) => ({ ...prev, [res.question_order]: res.assessment }))
        } catch (err) {
          const code = getProblemCode(err)
          if (err instanceof ApiError && err.status === 409 && code === 'AI_FEATURE_DISABLED') {
            setFeatureDisabled(true)
            toast.error(getProblemToastMessage(err))
            break
          }
          toast.error(getProblemToastMessage(err))
        }
        done += 1
      }
      setBulkAssessLoading(false)
      if (done > 0) loadClaritySummary()
    }
    run()
  }, [
    session?.questions,
    orgId,
    projectId,
    sessionId,
    featureDisabled,
    canAssessClarity,
    orderedQuestions,
    questionOrderMap,
    answers,
    assessmentsByOrder,
    loadClaritySummary,
  ])

  const handleSave = useCallback(() => {
    cancelPendingAutosave()
    const toSave = Object.values(answersRef.current).map((a) => ({
      question_id: a.question_id,
      answer_status: a.answer_status as AnswerStatus,
      value: a.value,
      skip_reason: a.skip_reason ?? null,
    }))
    if (toSave.length > 0) saveAnswers(toSave)
    else toast.info('No answers to save')
  }, [saveAnswers])

  const handleLock = async () => {
    if (!canLock) return
    cancelPendingAutosave()
    setLockLoading(true)
    try {
      await sessionsApi.lockSession(orgId, projectId, sessionId)
      toast.success('Session locked')
      setSessionLockedFrom409(false)
      void refetchSession()
      void refetchProgress()
    } catch {
      toast.error('Failed to lock session')
    } finally {
      setLockLoading(false)
    }
  }

  const handleReopen = async () => {
    if (!canReopen) return
    cancelPendingAutosave()
    setSessionLockedFrom409(false)
    setReopenLoading(true)
    try {
      await sessionsApi.reopenSession(orgId, projectId, sessionId)
      toast.success('Session reopened')
      void refetchSession()
      void refetchProgress()
    } catch {
      toast.error('Failed to reopen session')
    } finally {
      setReopenLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
    )
  }
  if (!session) {
    return (
      <div>
        <Typography tone="error">Session not found</Typography>
      </div>
    )
  }

  const isLocked = session.status === 'submitted' || session.status === 'locked'
  const inAiPhase = !!aiImproveQuestion || aiImproveAllOpen
  const headerSteps = [
    {
      id: 1,
      label: 'Answer questions',
      active: !isLocked && !inAiPhase,
    },
    {
      id: 3,
      label: 'Lock session',
      active: isLocked,
    },
  ]

  return (
    <div>
      <div className="flex">
        <div className="min-w-0 flex-[3] border-r border-neutral-200 pr-8 lg:mr-[290px]">
          <ProjectStepIndicator
            steps={headerSteps}
            leftMeta={
              <div className="mb-10">
                <Link
                  href={ROUTES.org.project(orgId, projectId)}
                  className="mb-2 block cursor-pointer text-sm text-primary hover:underline"
                >
                  <CircleArrowOutUpLeft size={20} />
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <Typography as="h1" size="xl" weight="bold">
                    {session.name}
                  </Typography>
                  <Badge
                    variant="solid"
                    size="sm"
                    tone={
                      session.status === 'in_progress'
                        ? 'info'
                        : session.status === 'submitted'
                          ? 'success'
                          : 'neutral'
                    }
                  >
                    {SESSION_STATUS_LABEL[session.status]}
                  </Badge>
                  {progress && (
                    <Badge
                      variant="outline"
                      tone={
                        progress.coverage_label === 'Ready for Review'
                          ? 'success'
                          : progress.coverage_label === 'In Progress'
                            ? 'warning'
                            : 'error'
                      }
                      size="sm"
                    >
                      {progress.coverage_percent}% coverage
                    </Badge>
                  )}
                </div>
                <Typography variant="small" tone="muted">
                  Created {new Date(session.created_at).toLocaleString()}
                </Typography>
              </div>
            }
            rightContent={
              <>
                {(pendingSave || saving) && (
                  <span className="flex items-center gap-1.5 text-sm text-neutral-600">
                    {saving ? (
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : null}
                    <span className={pendingSave && !saving ? 'animate-pulse' : ''}>Saving…</span>
                  </span>
                )}
                {!pendingSave && !saving && lastSaveSuccess && Object.keys(answers).length > 0 && (
                  <span className="flex items-center gap-1.5 text-sm">
                    <CloudCheck size={16} className="shrink-0" />
                    Saved
                  </span>
                )}
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleExportExcel}
                  className="gap-1.5"
                  aria-label="Export questions to Excel"
                >
                  <Download size={16} />
                  Export
                </Button>
                {canSave && (
                  <>
                    <Button variant="outline" onClick={handleSave} loading={saving}>
                      Save
                    </Button>
                    {canLock && session?.status !== 'locked' && (
                      <Button
                        variant="primary"
                        className="gap-1.5 bg-neutral-900"
                        onClick={handleLock}
                        loading={lockLoading}
                      >
                        <Lock size={16} />
                        Lock session
                      </Button>
                    )}
                  </>
                )}
              </>
            }
          />

          {canReopen && (
            <div className="mb-6 flex gap-2">
              <Button
                variant="outline"
                tone="success"
                size="sm"
                onClick={handleReopen}
                loading={reopenLoading}
              >
                Reopen session
              </Button>
            </div>
          )}

          {isLocked && (
            <div className="border-warning/50 bg-warning/10 mb-6 flex items-center gap-2 border p-4">
              <AlertCircle size={20} className="shrink-0 text-warning" />
              <Typography>Session locked. No further edits allowed.</Typography>
            </div>
          )}

          <div className="space-y-8">
            {orderedSectionEntries.map(([section, questions]) => (
              <div key={section} id={`section-${section}`} className="scroll-mt-24">
                <Typography
                  as="h2"
                  size="lg"
                  weight="semibold"
                  className="mb-4 capitalize text-neutral-400"
                >
                  {section}
                </Typography>
                <div className="space-y-4">
                  {questions.map((q) => {
                    const order = questionOrderMap[q.id]
                    return (
                      <div key={q.id} id={order != null ? `question-order-${order}` : undefined}>
                        <QuestionItem
                          q={q}
                          answer={answers[q.id]}
                          onChange={(status, value, skipReason) =>
                            handleAnswerChange(q.id, status, value, skipReason)
                          }
                          readonly={readonly}
                          showAiButton={canSave}
                          onAiImprove={
                            canSave ? (question) => setAiImproveQuestion(question) : undefined
                          }
                          questionOrder={order}
                          clarityAssessment={order != null ? assessmentsByOrder[order] : undefined}
                          onAssessClarity={
                            order != null && canAssessClarity
                              ? () => handleAssessClarity(order, q, answers[q.id])
                              : undefined
                          }
                          assessClarityLoading={order != null ? loadingByOrder[order] : false}
                          onOpenClarityModal={
                            order != null && assessmentsByOrder[order]
                              ? () => setClarityModalOrder(order)
                              : undefined
                          }
                          showAssessClarityButton={canAssessClarity}
                          clarityFeatureDisabled={featureDisabled}
                          orgId={orgId}
                          projectId={projectId}
                          sessionId={sessionId}
                          linkPermissions={linkPerms}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {(progress || orderedSectionEntries.length > 0) && (
          <div className="fixed right-0 top-[64px] hidden h-[calc(100%-64px)] w-[320px] lg:block">
            <div className="relative flex h-[100%] flex-col overflow-hidden">
              {/* Decorative corner pattern (Figma) */}
              <div className="pointer-events-none absolute bottom-0 right-0 flex flex-col gap-0.5">
                <Image
                  src="/illustrations/corner_pattern.svg"
                  alt="Corner pattern"
                  width={150}
                  height={150}
                />
              </div>

              <div className="relative z-10 flex flex-1 flex-col overflow-auto p-6">
                {rightPanelTab === 'progress' && progress && (
                  <>
                    <div className="mb-6 flex flex-col items-center">
                      <div className="relative h-28 w-28">
                        <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                          {/* Full circle track */}
                          <path
                            stroke="#E5E7EB"
                            strokeWidth="6"
                            strokeLinecap="butt"
                            fill="none"
                            d="M 18 3.5 A 14.5 14.5 0 0 1 18 32.5 A 14.5 14.5 0 0 1 18 3.5"
                          />
                          {/* Coverage arc; circumference ≈ 91 */}
                          <path
                            stroke="#03A67D"
                            strokeWidth="6"
                            strokeLinecap="butt"
                            fill="none"
                            className="transition-all duration-500"
                            strokeDasharray={`${(progress.coverage_percent / 100) * 91}, 91`}
                            d="M 18 3.5 A 14.5 14.5 0 0 1 18 32.5 A 14.5 14.5 0 0 1 18 3.5"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-neutral-900">
                          {progress.coverage_percent}%
                        </span>
                      </div>
                      <Badge
                        variant="solid"
                        tone={
                          progress.coverage_label === 'Ready for Review'
                            ? 'success'
                            : progress.coverage_label === 'In Progress'
                              ? 'warning'
                              : 'error'
                        }
                        size="sm"
                        className="mt-3"
                      >
                        {progress.coverage_label}
                      </Badge>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Required answered</span>
                        <span className="text-neutral-900">
                          {progress.required_answered} / {progress.required_total}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-neutral-600">Optional answered</span>
                        <span className="text-neutral-900">
                          {progress.optional_answered} / {progress.optional_total}
                        </span>
                      </div>
                      <div className="space-y-3 border-t border-neutral-200 pt-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Answered</span>
                          <span className="text-neutral-900">{progress.answered}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Skipped</span>
                          <span className="text-neutral-900">{progress.skipped}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">N/A</span>
                          <span className="text-neutral-900">{progress.na}</span>
                        </div>
                        {progress.required_missing > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-error">Missing required</span>
                            <span className="text-error">{progress.required_missing}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Total</span>
                          <span className="text-neutral-900">{progress.total}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
                {rightPanelTab === 'outline' && (
                  <div className="space-y-0">
                    <Typography
                      variant="small"
                      weight="medium"
                      className="mb-3 block text-neutral-500"
                    >
                      Jump to section
                    </Typography>
                    {orderedSectionEntries.map(([section]) => (
                      <button
                        key={section}
                        type="button"
                        onClick={() =>
                          document
                            .getElementById(`section-${section}`)
                            ?.scrollIntoView({ behavior: 'smooth' })
                        }
                        className="w-full px-0 py-2.5 text-left text-sm capitalize text-neutral-900 hover:bg-neutral-100"
                      >
                        {section}
                      </button>
                    ))}
                  </div>
                )}
                {FEATURES.aiClarityAssessment && rightPanelTab === 'clarity' && (
                  <ClarityPanel
                    summary={claritySummary}
                    summaryLoading={claritySummaryLoading}
                    summaryError={claritySummaryError}
                    canAssess={canAssessClarity}
                    featureDisabled={featureDisabled}
                    missingCount={
                      claritySummary?.missing_assessments ??
                      claritySummary?.stats?.missing_assessments ??
                      0
                    }
                    onScrollToQuestion={scrollToQuestion}
                    onBulkAssess={handleBulkAssess}
                    bulkAssessLoading={bulkAssessLoading}
                  />
                )}
                {rightPanelTab === 'evidence' && (
                  <EntityEvidenceDocumentsPanel
                    orgId={orgId}
                    projectId={projectId}
                    linkedEntityType="session"
                    linkedEntityId={sessionId}
                    canView={linkPerms.canView}
                    canCreateLink={linkPerms.canCreate}
                    canRemoveLink={linkPerms.canRemove}
                    canRestoreDocument={linkPerms.canRestoreDocument}
                    canExport={linkPerms.canExport}
                    canCreateDeliverable={linkPerms.canCreateDeliverable}
                    deliverableType="elicitation_summary"
                    title="Session documents"
                    emptyStateText="No evidence documents linked to this session yet."
                  />
                )}
              </div>

              <div className="relative z-10 flex shrink-0 flex-wrap gap-1 p-6">
                {(
                  [
                    'progress',
                    'outline',
                    'evidence',
                    ...(FEATURES.aiClarityAssessment ? ['clarity'] : []),
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() =>
                      setRightPanelTab(tab as 'progress' | 'outline' | 'clarity' | 'evidence')
                    }
                    className={cn(
                      'px-4 py-2.5 text-sm transition-opacity',
                      rightPanelTab === tab
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                    )}
                  >
                    {tab === 'progress'
                      ? 'Progress'
                      : tab === 'outline'
                        ? 'Outline'
                        : tab === 'evidence'
                          ? 'Evidence'
                          : 'Clarity'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {FEATURES.aiImproveAnswer && aiImproveQuestion && (
        <AIImproveModal
          open={!!aiImproveQuestion}
          onClose={() => setAiImproveQuestion(null)}
          orgId={orgId}
          projectId={projectId}
          sessionId={sessionId}
          question={aiImproveQuestion}
          currentAnswer={answers[aiImproveQuestion.id]}
          onSessionLocked={() => {
            setSessionLockedFrom409(true)
            refetchSession()
          }}
          onSuccess={() => {
            refetchSession()
            refetchProgress()
          }}
        />
      )}

      {FEATURES.aiImproveAnswer && (
        <AIImproveAllModal
          open={aiImproveAllOpen}
          onClose={() => setAiImproveAllOpen(false)}
          orgId={orgId}
          projectId={projectId}
          sessionId={sessionId}
          questions={orderedQuestions}
          answers={answers}
          onSessionLocked={() => {
            setSessionLockedFrom409(true)
            refetchSession()
          }}
          onSuccess={() => {
            refetchSession()
            refetchProgress()
          }}
        />
      )}

      {FEATURES.aiClarityAssessment && clarityModalOrder != null && (
        <ClarityDetailsModal
          open={true}
          onClose={() => setClarityModalOrder(null)}
          assessment={assessmentsByOrder[clarityModalOrder] ?? null}
          questionPrompt={
            orderedQuestions.find((q) => questionOrderMap[q.id] === clarityModalOrder)?.prompt
          }
          onReAssess={
            canAssessClarity
              ? () => {
                  const q = orderedQuestions.find(
                    (q) => questionOrderMap[q.id] === clarityModalOrder
                  )
                  if (q) handleAssessClarity(clarityModalOrder, q, answers[q.id])
                }
              : undefined
          }
          reAssessLoading={loadingByOrder[clarityModalOrder]}
        />
      )}
    </div>
  )
}
