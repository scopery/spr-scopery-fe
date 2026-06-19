'use client'

import { useState, useCallback, useMemo } from 'react'
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
import { useSessionDetail } from '../hooks/useSessionDetail'
import { useSessionAnswerSave } from '../hooks/useSessionAnswerSave'
import { useSessionClarity } from '@/modules/sessions/clarity'
import { SESSION_STATUS_LABEL } from '../model/session'
import { useProject, type ProjectQuestion, ProjectStepIndicator } from '@/modules/projects'
import {
  canEditProject,
  isOrgReadonly,
  resolveProjectRole,
  buildDocumentSpacePermissions,
} from '@/modules/permissions'
import { useOrg } from '@/modules/org'
import { useEffectivePermissions } from '@/modules/permissions'
import { FEATURES } from '@/config/features'
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
import { EntityEvidenceDocumentsPanel } from '@/modules/documents'
import {
  SECTION_ORDER,
  sectionSortIndex,
} from '../lib/session-answer-utils'
import { SessionQuestionItem } from './SessionQuestionItem'

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
  const [aiImproveQuestion, setAiImproveQuestion] = useState<ProjectQuestion | null>(null)
  const [aiImproveAllOpen, setAiImproveAllOpen] = useState(false)
  const [rightPanelTab, setRightPanelTab] = useState<
    'progress' | 'outline' | 'clarity' | 'evidence'
  >('progress')

  const projectRole = resolveProjectRole(project?.my_role)
  const editable = project ? canEditProject(projectRole) : false
  const orgReadonly = org ? isOrgReadonly(org.my_role) : false
  const isOrgOwner = org?.my_role === 'owner'
  const canSaveBase = editable && session?.status === 'in_progress'
  const canLock = editable && (session?.status === 'in_progress' || session?.status === 'submitted')
  const canReopen = isOrgOwner && (session?.status === 'submitted' || session?.status === 'locked')
  const canAssessClarity = editable && !orgReadonly

  const {
    saving,
    lockLoading,
    reopenLoading,
    pendingSave,
    lastSaveSuccess,
    canSave,
    handleAnswerChange,
    handleSave,
    handleLock,
    handleReopen,
    markSessionLocked,
  } = useSessionAnswerSave({
    orgId,
    projectId,
    sessionId,
    session,
    canSaveBase: !!canSaveBase,
    canLock: !!canLock,
    canReopen: !!canReopen,
    answers,
    setAnswers,
    refetchSession,
    refetchProgress,
  })

  const readonly = !canSave

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

  const {
    claritySummary,
    claritySummaryLoading,
    claritySummaryError,
    assessmentsByOrder,
    loadingByOrder,
    featureDisabled,
    clarityModalOrder,
    setClarityModalOrder,
    bulkAssessLoading,
    loadClaritySummary,
    handleAssessClarity,
    handleBulkAssess,
  } = useSessionClarity({
    orgId,
    projectId,
    sessionId,
    sessionIdReady: !!session?.id,
    canAssessClarity,
    orderedQuestions,
    questionOrderMap,
    answers,
  })

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
                        <SessionQuestionItem
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
            markSessionLocked()
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
            markSessionLocked()
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
