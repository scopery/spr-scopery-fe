'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Stack, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type { Deliverable } from '../../domain/model/deliverable'
import {
  acceptanceCriteriaStatusLabel,
  canAcceptDeliverable,
  canReopenDeliverable,
  deliverableStatusLabel,
} from '../../domain/rules/deliverable.rules'
import { useDeliverableDetail } from '../hooks/useDeliverableDetail'
import { EvidencePanel } from '@/modules/projects/acceptance-evidence'
import { DeliverableReviewPanel } from '@/modules/projects/deliverable-review'
import { DeliverableMappingPanel } from '@/modules/projects/scope-mappings'
import { CommentThreadsPanel } from '@/modules/projects/comments'

type DeliverableDrawerTab = 'criteria' | 'evidence' | 'review' | 'linked-tasks' | 'comments'

interface DeliverableDetailDrawerProps {
  projectId: string | null
  deliverable: Deliverable | null
  open: boolean
  onClose: () => void
  onUpdated: (deliverable: Deliverable) => void
}

export function DeliverableDetailDrawer({
  projectId,
  deliverable,
  open,
  onClose,
  onUpdated,
}: DeliverableDetailDrawerProps) {
  const [tab, setTab] = useState<DeliverableDrawerTab>('criteria')
  const { criteria, loading, acting, accept, reopen, archive } = useDeliverableDetail(
    projectId,
    deliverable?.id ?? null
  )

  if (!open || !deliverable) return null

  const handleAccept = async () => {
    try {
      const updated = await accept()
      if (updated) onUpdated(updated)
      toast.success('Deliverable accepted')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleReopen = async () => {
    try {
      const updated = await reopen()
      if (updated) onUpdated(updated)
      toast.success('Deliverable reopened')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleArchive = async () => {
    try {
      const updated = await archive()
      if (updated) onUpdated(updated)
      toast.success('Deliverable archived')
      onClose()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-neutral-900/[0.18] motion-drawer-backdrop" aria-hidden onClick={onClose} />
      <aside
        className="drawer fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-xl motion-drawer-panel"
        role="dialog"
        aria-label="Deliverable detail"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4">
          <div className="min-w-0">
            <Typography variant="small" className="font-mono text-neutral-500">
              {deliverable.code}
            </Typography>
            <Typography as="h2" weight="semibold" className="truncate">
              {deliverable.title}
            </Typography>
            <Stack direction="horizontal" spacing="sm" className="mt-2 items-center">
              <Badge tone={deliverable.status === 'ACCEPTED' ? 'success' : 'neutral'}>
                {deliverableStatusLabel(deliverable.status)}
              </Badge>
              <Badge tone="neutral">{deliverable.type}</Badge>
            </Stack>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Close"
            onClick={onClose}
            icon={<X size={16} />}
          />
        </div>

        <nav className="flex gap-1 border-b border-neutral-200 px-5">
          {(['criteria', 'evidence', 'review', 'linked-tasks', 'comments'] as DeliverableDrawerTab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'border-b-2 px-3 py-2 text-sm font-medium capitalize transition-colors',
                tab === t
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              )}
            >
              {t === 'criteria'
                ? 'Acceptance criteria'
                : t === 'evidence'
                  ? 'Evidence'
                  : t === 'review'
                    ? 'Review'
                    : t === 'linked-tasks'
                      ? 'Linked tasks'
                      : 'Comments'}
            </button>
          ))}
        </nav>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {tab === 'criteria' ? (
            <>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <Typography variant="small" tone="muted">
                    Acceptance required
                  </Typography>
                  <Typography>{deliverable.acceptanceRequired ? 'Yes' : 'No'}</Typography>
                </div>
                <div>
                  <Typography variant="small" tone="muted">
                    Accepted at
                  </Typography>
                  <Typography>{deliverable.acceptedAt ?? '—'}</Typography>
                </div>
              </div>

              <div>
                <Typography variant="small" tone="muted" className="mb-2">
                  Acceptance criteria
                </Typography>
                {loading ? (
                  <Typography variant="small" tone="muted">
                    Loading…
                  </Typography>
                ) : criteria.length === 0 ? (
                  <Typography variant="small" tone="muted">
                    No acceptance criteria defined
                  </Typography>
                ) : (
                  <ul className="space-y-2">
                    {criteria.map((c) => (
                      <li
                        key={c.id}
                        className="flex items-start justify-between gap-2 border border-neutral-200 p-3"
                      >
                        <div className="min-w-0">
                          <Typography weight="medium" className="truncate">
                            {c.title}
                          </Typography>
                          <Typography variant="small" tone="muted">
                            {c.type} {c.mandatory ? '· Mandatory' : ''}
                          </Typography>
                        </div>
                        <Badge tone={c.status === 'SATISFIED' ? 'success' : 'neutral'}>
                          {acceptanceCriteriaStatusLabel(c.status)}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : tab === 'evidence' ? (
            projectId ? (
              <EvidencePanel projectId={projectId} deliverableId={deliverable.id} />
            ) : null
          ) : tab === 'review' ? (
            <DeliverableReviewPanel projectId={projectId} deliverableId={deliverable.id} />
          ) : tab === 'linked-tasks' ? (
            <DeliverableMappingPanel deliverableId={deliverable.id} />
          ) : (
            projectId ? (
              <CommentThreadsPanel projectId={projectId} targetType="DELIVERABLE" targetId={deliverable.id} />
            ) : null
          )}
        </div>

        <div className="space-y-3 border-t border-neutral-200 px-5 py-4">
          <Stack direction="horizontal" spacing="sm" className="flex-wrap">
            {canAcceptDeliverable(deliverable) ? (
              <Button size="sm" variant="primary" disabled={acting} onClick={() => void handleAccept()}>
                Accept
              </Button>
            ) : null}
            {canReopenDeliverable(deliverable) ? (
              <Button size="sm" variant="secondary" disabled={acting} onClick={() => void handleReopen()}>
                Reopen
              </Button>
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              disabled={acting || deliverable.status === 'ARCHIVED'}
              onClick={() => void handleArchive()}
            >
              Archive
            </Button>
          </Stack>
        </div>
      </aside>
    </>
  )
}
