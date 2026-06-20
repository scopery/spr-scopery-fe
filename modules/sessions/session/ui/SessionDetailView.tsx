'use client'

import { useState, useCallback, useMemo } from 'react'
import { ContentLoader, Typography } from '@/shared/ui'
import { useSessionDetail } from '../hooks/useSessionDetail'
import { useSessionAnswerSave } from '../hooks/useSessionAnswerSave'
import { useSessionExportExcel } from '../hooks/useSessionExportExcel'
import { useSessionClarity } from '@/modules/sessions/clarity'
import { useProject, type ProjectQuestion } from '@/modules/projects'
import {
  canEditProject,
  isOrgReadonly,
  resolveProjectRole,
  buildDocumentSpacePermissions,
} from '@/modules/permissions'
import { useOrg } from '@/modules/org'
import { useEffectivePermissions } from '@/modules/permissions'
import { FEATURES } from '@/config/features'
import { AIImproveModal } from '@/modules/sessions/ai-improve/ui/AIImproveModal'
import { AIImproveAllModal } from '@/modules/sessions/ai-improve/ui/AIImproveAllModal'
import { ClarityDetailsModal } from '@/modules/sessions/clarity/ui/ClarityDetailsModal'
import { SECTION_ORDER, sectionSortIndex } from '../lib/session-answer-utils'
import { SessionDetailHeader } from './SessionDetailHeader'
import { SessionDetailQuestions } from './SessionDetailQuestions'
import {
  SessionDetailRightPanel,
  type SessionRightPanelTab,
} from './SessionDetailRightPanel'

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
  const [rightPanelTab, setRightPanelTab] = useState<SessionRightPanelTab>('progress')

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

  const { exportExcel } = useSessionExportExcel({
    sessionName: session?.name,
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
    { id: 1, label: 'Answer questions', active: !isLocked && !inAiPhase },
    { id: 3, label: 'Lock session', active: isLocked },
  ]

  return (
    <div>
      <div className="flex">
        <div className="min-w-0 flex-[3] border-r border-neutral-200 pr-8 lg:mr-[290px]">
          <SessionDetailHeader
            orgId={orgId}
            projectId={projectId}
            session={session}
            progress={progress}
            headerSteps={headerSteps}
            isLocked={isLocked}
            canSave={canSave}
            canLock={!!canLock}
            canReopen={!!canReopen}
            saving={saving}
            lockLoading={lockLoading}
            reopenLoading={reopenLoading}
            pendingSave={pendingSave}
            lastSaveSuccess={lastSaveSuccess}
            answersCount={Object.keys(answers).length}
            onExportExcel={exportExcel}
            onSave={handleSave}
            onLock={handleLock}
            onReopen={handleReopen}
          />

          <SessionDetailQuestions
            orgId={orgId}
            projectId={projectId}
            sessionId={sessionId}
            orderedSectionEntries={orderedSectionEntries}
            questionOrderMap={questionOrderMap}
            answers={answers}
            assessmentsByOrder={assessmentsByOrder}
            loadingByOrder={loadingByOrder}
            readonly={readonly}
            canSave={canSave}
            canAssessClarity={canAssessClarity}
            featureDisabled={featureDisabled}
            linkPerms={linkPerms}
            onAnswerChange={handleAnswerChange}
            onAiImprove={setAiImproveQuestion}
            onAssessClarity={handleAssessClarity}
            onOpenClarityModal={setClarityModalOrder}
          />
        </div>

        <SessionDetailRightPanel
          orgId={orgId}
          projectId={projectId}
          sessionId={sessionId}
          progress={progress}
          orderedSectionEntries={orderedSectionEntries}
          rightPanelTab={rightPanelTab}
          onTabChange={setRightPanelTab}
          claritySummary={claritySummary}
          claritySummaryLoading={claritySummaryLoading}
          claritySummaryError={claritySummaryError}
          canAssessClarity={canAssessClarity}
          featureDisabled={featureDisabled}
          bulkAssessLoading={bulkAssessLoading}
          onScrollToQuestion={scrollToQuestion}
          onBulkAssess={handleBulkAssess}
          linkPerms={linkPerms}
        />
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
