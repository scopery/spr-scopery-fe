'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Button,
  Input,
  LifecycleStepState,
  LifecycleTimeline,
  PageSkeleton,
  Stack,
  Typography,
} from '@/shared/ui'
import { useSupportCaseDetail } from '../hooks/useSupportCases'

function caseLifecycleState(status: string | undefined) {
  const s = (status ?? '').toUpperCase()
  if (s === 'CLOSED') {
    return {
      new: LifecycleStepState.Completed,
      triage: LifecycleStepState.Completed,
      progress: LifecycleStepState.Completed,
      resolve: LifecycleStepState.Completed,
    }
  }
  if (s === 'RESOLVED') {
    return {
      new: LifecycleStepState.Completed,
      triage: LifecycleStepState.Completed,
      progress: LifecycleStepState.Completed,
      resolve: LifecycleStepState.Current,
    }
  }
  if (s === 'IN_PROGRESS' || s === 'PROGRESS') {
    return {
      new: LifecycleStepState.Completed,
      triage: LifecycleStepState.Completed,
      progress: LifecycleStepState.Current,
      resolve: LifecycleStepState.Upcoming,
    }
  }
  if (s === 'TRIAGED') {
    return {
      new: LifecycleStepState.Completed,
      triage: LifecycleStepState.Current,
      progress: LifecycleStepState.Upcoming,
      resolve: LifecycleStepState.Upcoming,
    }
  }
  return {
    new: LifecycleStepState.Current,
    triage: LifecycleStepState.Upcoming,
    progress: LifecycleStepState.Upcoming,
    resolve: LifecycleStepState.Upcoming,
  }
}

export function SupportCaseWorkbenchView() {
  const { workspaceId, caseId } = useParams<{ workspaceId: string; caseId: string }>()
  const {
    item,
    comments,
    loading,
    error,
    actionError,
    triage,
    resolve,
    close,
    addComment,
  } = useSupportCaseDetail(workspaceId, caseId)
  const [comment, setComment] = useState('')
  const steps = caseLifecycleState(item?.status)

  if (loading) return <PageSkeleton variant="detail" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Support case</Typography>
      {item ? (
        <>
          <Typography variant="h4">{item.title}</Typography>
          <Typography tone="muted">
            {[item.status, item.priority, item.queue].filter(Boolean).join(' · ')}
          </Typography>
          <LifecycleTimeline
            aria-label="Case lifecycle"
            steps={[
              { id: 'new', label: 'New', state: steps.new },
              { id: 'triage', label: 'Triaged', state: steps.triage },
              { id: 'progress', label: 'In progress', state: steps.progress },
              { id: 'resolve', label: 'Resolved', state: steps.resolve },
            ]}
          />
          {actionError ? <Typography tone="error">{actionError}</Typography> : null}
          <Typography tone="muted" variant="caption">
            Resolve/close are not optimistic — confirm before mutation.
          </Typography>
          <div className="flex flex-wrap gap-sm">
            <Button size="sm" variant="outline" onClick={() => void triage()}>
              Triage
            </Button>
            <Button size="sm" variant="outline" onClick={() => void resolve()}>
              Resolve
            </Button>
            <Button size="sm" onClick={() => void close()}>
              Close
            </Button>
          </div>
          <Typography variant="h4">Comments</Typography>
          <div className="flex gap-sm">
            <Input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add comment"
              aria-label="Case comment"
            />
            <Button
              size="sm"
              disabled={!comment.trim()}
              onClick={() => {
                void addComment(comment).then(() => setComment(''))
              }}
            >
              Post
            </Button>
          </div>
          {comments.length === 0 ? (
            <Typography tone="muted" variant="caption">
              No comments.
            </Typography>
          ) : (
            <ul className="divide-y divide-neutral-200 border border-neutral-200">
              {comments.map((c) => (
                <li key={c.id} className="p-sm text-sm">
                  {c.body}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <Typography tone="muted">Case {caseId} not found.</Typography>
      )}
    </Stack>
  )
}
