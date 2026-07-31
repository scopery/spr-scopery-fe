'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, RefreshCw, Send } from 'lucide-react'
import { toast } from 'sonner'
import { UserIdentity, useResolveUsers } from '@/modules/platform'
import { Badge, Button, Card, Stack, Textarea, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useDeliverableReview } from '../hooks/useDeliverableReview'
import {
  canApproveReview,
  canRejectReview,
  canRequestRework,
  reviewStatusLabel,
  reviewStatusTone,
} from '../../domain/rules/review.rules'

interface DeliverableReviewPanelProps {
  projectId: string | null
  deliverableId: string | null
}

export function DeliverableReviewPanel({ projectId, deliverableId }: DeliverableReviewPanelProps) {
  const { review, acting, forbidden, submit, approve, reject, requestRework } =
    useDeliverableReview(projectId, deliverableId)
  const { peopleById } = useResolveUsers([review?.reviewerId])
  const [comment, setComment] = useState('')

  const handleSubmit = async () => {
    try {
      await submit(comment || undefined)
      toast.success('Submitted for review')
      setComment('')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleApprove = async () => {
    if (!review) return
    try {
      await approve(review.id, comment || undefined)
      toast.success('Review approved')
      setComment('')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleReject = async () => {
    if (!review) return
    try {
      await reject(review.id, comment || undefined)
      toast.success('Review rejected')
      setComment('')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleRequestRework = async () => {
    if (!review) return
    try {
      await requestRework(review.id, comment || undefined)
      toast.success('Rework requested')
      setComment('')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (forbidden) {
    return (
      <Typography variant="small" tone="muted">
        You do not have permission to view this review.
      </Typography>
    )
  }

  return (
    <div className="space-y-4">
      <Typography weight="semibold">Deliverable Review</Typography>

      {!review ? (
        <Card className="space-y-3 p-4">
          <Typography variant="small" tone="muted">
            Not submitted
          </Typography>
          <Typography variant="small" tone="muted">
            Submit this deliverable for review to get it approved.
          </Typography>
          <Textarea
            placeholder="Add a comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          <Button
            size="sm"
            variant="primary"
            icon={<Send size={14} />}
            disabled={acting}
            onClick={() => void handleSubmit()}
          >
            Submit for review
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <Typography variant="small" tone="muted">
                Status
              </Typography>
              <Badge tone={reviewStatusTone(review.status)}>
                {reviewStatusLabel(review.status)}
              </Badge>
            </div>
            <div>
              <Typography variant="small" tone="muted">
                Submitted at
              </Typography>
              <Typography>
                {review.submittedAt
                  ? new Date(review.submittedAt).toLocaleDateString()
                  : '—'}
              </Typography>
            </div>
            {review.reviewerId && (
              <div>
                <Typography variant="small" tone="muted">
                  Reviewer
                </Typography>
                <UserIdentity
                  userId={review.reviewerId}
                  person={peopleById[review.reviewerId]}
                  showEmail
                />
              </div>
            )}
            {review.reviewedAt && (
              <div>
                <Typography variant="small" tone="muted">
                  Reviewed at
                </Typography>
                <Typography>
                  {new Date(review.reviewedAt).toLocaleDateString()}
                </Typography>
              </div>
            )}
          </div>

          {review.comment && (
            <div>
              <Typography variant="small" tone="muted" className="mb-1">
                Comment
              </Typography>
              <Typography variant="small">{review.comment}</Typography>
            </div>
          )}

          {(canApproveReview(review) || canRejectReview(review) || canRequestRework(review)) && (
            <div className="space-y-3 border-t border-neutral-100 pt-4">
              <Textarea
                placeholder="Add a comment (optional)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
              <Stack direction="horizontal" spacing="sm" className="flex-wrap">
                {canApproveReview(review) && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<CheckCircle size={14} />}
                    disabled={acting}
                    onClick={() => void handleApprove()}
                  >
                    Approve
                  </Button>
                )}
                {canRejectReview(review) && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<XCircle size={14} />}
                    disabled={acting}
                    onClick={() => void handleReject()}
                  >
                    Reject
                  </Button>
                )}
                {canRequestRework(review) && (
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<RefreshCw size={14} />}
                    disabled={acting}
                    onClick={() => void handleRequestRework()}
                  >
                    Request rework
                  </Button>
                )}
              </Stack>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
