'use client'

import Image from 'next/image'
import { Typography, Badge } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { FEATURES } from '@/config/features'
import { ClarityPanel } from '@/modules/sessions/clarity/ui/ClarityPanel'
import { EntityEvidenceDocumentsPanel } from '@/modules/documents'
import type { ClaritySummary } from '@/modules/sessions/clarity'
import type { ProjectQuestion } from '@/modules/projects'
import type { SessionProgress } from '../model/session'

export type SessionRightPanelTab = 'progress' | 'outline' | 'clarity' | 'evidence'

export type SessionDetailRightPanelProps = {
  orgId: string
  projectId: string
  sessionId: string
  progress: SessionProgress | null
  orderedSectionEntries: [string, ProjectQuestion[]][]
  rightPanelTab: SessionRightPanelTab
  onTabChange: (tab: SessionRightPanelTab) => void
  claritySummary: ClaritySummary | null
  claritySummaryLoading: boolean
  claritySummaryError: boolean
  canAssessClarity: boolean
  featureDisabled: boolean
  bulkAssessLoading: boolean
  onScrollToQuestion: (order: number) => void
  onBulkAssess: () => void
  linkPerms: {
    canView: boolean
    canCreate: boolean
    canRemove: boolean
    canRestoreDocument: boolean
    canExport: boolean
    canCreateDeliverable: boolean
  }
}

export function SessionDetailRightPanel({
  orgId,
  projectId,
  sessionId,
  progress,
  orderedSectionEntries,
  rightPanelTab,
  onTabChange,
  claritySummary,
  claritySummaryLoading,
  claritySummaryError,
  canAssessClarity,
  featureDisabled,
  bulkAssessLoading,
  onScrollToQuestion,
  onBulkAssess,
  linkPerms,
}: SessionDetailRightPanelProps) {
  if (!progress && orderedSectionEntries.length === 0) return null

  const tabs: SessionRightPanelTab[] = [
    'progress',
    'outline',
    'evidence',
    ...(FEATURES.aiClarityAssessment ? (['clarity'] as const) : []),
  ]

  return (
    <div className="fixed right-0 top-[64px] hidden h-[calc(100%-64px)] w-[320px] lg:block">
      <div className="relative flex h-[100%] flex-col overflow-hidden">
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
                    <path
                      stroke="#E5E7EB"
                      strokeWidth="6"
                      strokeLinecap="butt"
                      fill="none"
                      d="M 18 3.5 A 14.5 14.5 0 0 1 18 32.5 A 14.5 14.5 0 0 1 18 3.5"
                    />
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
                    document.getElementById(`section-${section}`)?.scrollIntoView({ behavior: 'smooth' })
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
              onScrollToQuestion={onScrollToQuestion}
              onBulkAssess={onBulkAssess}
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
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => onTabChange(tab)}
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
  )
}
