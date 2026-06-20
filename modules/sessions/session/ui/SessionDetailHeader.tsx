'use client'

import Link from 'next/link'
import { CloudCheck, AlertCircle, CircleArrowOutUpLeft, Download, Lock } from 'lucide-react'
import { Typography, Button, Badge } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { ProjectStepIndicator } from '@/modules/projects'
import { SESSION_STATUS_LABEL, type SessionDetail, type SessionProgress } from '../model/session'

export type SessionDetailHeaderProps = {
  orgId: string
  projectId: string
  session: SessionDetail
  progress: SessionProgress | null
  headerSteps: Array<{ id: number; label: string; active: boolean }>
  isLocked: boolean
  canSave: boolean
  canLock: boolean
  canReopen: boolean
  saving: boolean
  lockLoading: boolean
  reopenLoading: boolean
  pendingSave: boolean
  lastSaveSuccess: boolean
  answersCount: number
  onExportExcel: () => void
  onSave: () => void
  onLock: () => void
  onReopen: () => void
}

export function SessionDetailHeader({
  orgId,
  projectId,
  session,
  progress,
  headerSteps,
  isLocked,
  canSave,
  canLock,
  canReopen,
  saving,
  lockLoading,
  reopenLoading,
  pendingSave,
  lastSaveSuccess,
  answersCount,
  onExportExcel,
  onSave,
  onLock,
  onReopen,
}: SessionDetailHeaderProps) {
  return (
    <>
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
            {!pendingSave && !saving && lastSaveSuccess && answersCount > 0 && (
              <span className="flex items-center gap-1.5 text-sm">
                <CloudCheck size={16} className="shrink-0" />
                Saved
              </span>
            )}
            <Button
              variant="outline"
              size="md"
              onClick={onExportExcel}
              className="gap-1.5"
              aria-label="Export questions to Excel"
            >
              <Download size={16} />
              Export
            </Button>
            {canSave && (
              <>
                <Button variant="outline" onClick={onSave} loading={saving}>
                  Save
                </Button>
                {canLock && session.status !== 'locked' && (
                  <Button
                    variant="primary"
                    className="gap-1.5 bg-neutral-900"
                    onClick={onLock}
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
            onClick={onReopen}
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
    </>
  )
}
