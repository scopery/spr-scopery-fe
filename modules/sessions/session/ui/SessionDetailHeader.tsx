'use client'

import Link from 'next/link'
import { AlertCircle, CircleArrowOutUpLeft, CloudCheck, Download, Lock, RotateCcw, Save } from 'lucide-react'
import { Typography, Button, Badge } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { ProjectStepIndicator } from '@/modules/projects/project/ui/ProjectStepIndicator'
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
              href={ROUTES.workspace.project(orgId, projectId)}
              className="mb-2 block cursor-pointer text-sm text-primary hover:underline"
            >
              <CircleArrowOutUpLeft size={20} />
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              <Typography as="h1" size="lg" weight="semibold">
                {session.name}
              </Typography>
              <Badge
                variant="solid"
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
              <span className="flex items-center gap-1.5">
                {saving ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : null}
                <Typography
                  as="span"
                  variant="small"
                  tone="muted"
                  className={pendingSave && !saving ? 'animate-pulse' : ''}
                >
                  Saving…
                </Typography>
              </span>
            )}
            {!pendingSave && !saving && lastSaveSuccess && answersCount > 0 && (
              <span className="flex items-center gap-1.5">
                <CloudCheck size={16} className="shrink-0" />
                <Typography as="span" variant="small">
                  Saved
                </Typography>
              </span>
            )}
            <Button
              variant="outline"
              onClick={onExportExcel}
              aria-label="Export questions to Excel"
              icon={<Download size={16} />}
            >
              Export
            </Button>
            {canSave && (
              <>
                <Button variant="outline" onClick={onSave} loading={saving} icon={<Save size={16} />}>
                  Save
                </Button>
                {canLock && session.status !== 'locked' && (
                  <Button
                    variant="primary"
                    className="bg-neutral-900"
                    onClick={onLock}
                    loading={lockLoading}
                    icon={<Lock size={16} />}
                  >
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
            onClick={onReopen}
            loading={reopenLoading} icon={<RotateCcw size={16} />}>
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
