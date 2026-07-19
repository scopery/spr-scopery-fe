'use client'

import { Ban, Check } from 'lucide-react'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Typography, Badge, Button, ConfirmDialog, Input, Modal, PageSkeleton, Skeleton, Select } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useWorkspaceAuthorization } from '@/modules/auth/iam'
import { toast } from 'sonner'
import { useWorkspaceJoinRequests } from '../hooks/useWorkspaceJoinRequests'
import * as joinRequestsApi from '../api/join-requests.api'
import { JoinRequestStatus } from '../model'
import type { JoinRequest } from '../model'

function statusTone(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case JoinRequestStatus.Approved:
      return 'success'
    case JoinRequestStatus.Pending:
      return 'warning'
    case JoinRequestStatus.Rejected:
      return 'error'
    default:
      return 'neutral'
  }
}

const STATUS_FILTERS = [
  { label: 'All statuses', value: '' },
  { label: 'Pending', value: JoinRequestStatus.Pending },
  { label: 'Approved', value: JoinRequestStatus.Approved },
  { label: 'Rejected', value: JoinRequestStatus.Rejected },
  { label: 'Cancelled', value: JoinRequestStatus.Cancelled },
] as const

export function WorkspaceJoinRequestsView({ embedded = false }: { embedded?: boolean } = {}) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { canManageJoinRequests, loading: authzLoading } = useWorkspaceAuthorization(workspaceId)
  const { items, loading, error, statusFilter, setStatusFilter, load } =
    useWorkspaceJoinRequests(workspaceId)
  const [approveTarget, setApproveTarget] = useState<JoinRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<JoinRequest | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (canManageJoinRequests) void load()
  }, [canManageJoinRequests, load])

  const handleApprove = async () => {
    if (!approveTarget) return
    setActionLoading(true)
    try {
      await joinRequestsApi.approveJoinRequest(workspaceId, approveTarget.id)
      toast.success('Join request approved')
      setApproveTarget(null)
      await load()
    } catch {
      /* global interceptor */
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    setActionLoading(true)
    try {
      await joinRequestsApi.rejectJoinRequest(workspaceId, rejectTarget.id, {
        reviewNote: rejectNote.trim() || undefined,
      })
      toast.success('Join request rejected')
      setRejectTarget(null)
      setRejectNote('')
      await load()
    } catch {
      /* global interceptor */
    } finally {
      setActionLoading(false)
    }
  }

  if (authzLoading) {
    return (
      <PageSkeleton variant="list" />
    )
  }

  if (!canManageJoinRequests) {
    return (
      <div>
        {!embedded ? (
          <WorkspaceHierarchyBreadcrumb
            workspaceId={workspaceId}
            current="Join requests"
            className="mb-4"
          />
        ) : null}
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          <Typography variant="small" tone="muted">
            You do not have permission to manage workspace join requests.
          </Typography>
        </div>
      </div>
    )
  }

  return (
    <div>
      {!embedded ? (
        <WorkspaceHierarchyBreadcrumb
          workspaceId={workspaceId}
          current="Join requests"
          className="mb-4"
        />
      ) : null}
      {!embedded ? (
        <div className="mb-6">
          <Typography as="h1" size="lg" weight="semibold">
            Join requests
          </Typography>
          <Typography as="p" variant="small" tone="muted" className="mt-1">
            Review requests from users who want to join this workspace.
          </Typography>
        </div>
      ) : null}

      <div className="mb-4 w-48">
        <Select
          value={statusFilter ?? ''}
          onValueChange={(v: string) => setStatusFilter(v || undefined)}
          options={[...STATUS_FILTERS]}
          placeholder="All statuses"
        />
      </div>

      {error && (
        <Typography tone="error" className="mb-4">
          {error}
        </Typography>
      )}

      <div className="overflow-hidden border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Requester</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Message</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Submitted</th>
              <th className="min-w-[16rem] whitespace-nowrap px-4 py-3 text-left font-medium text-neutral-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center">
                  <Skeleton variant="rectangular" width="100%" height={80} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                  No join requests
                </td>
              </tr>
            ) : (
              items.map((req) => (
                <tr key={req.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3 font-mono text-xs text-neutral-700">
                    {req.requestedByUserId.slice(0, 8)}…
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-neutral-700">
                    {req.message || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="solid" tone={statusTone(req.status)}>
                      {req.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {new Date(req.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    {req.status === JoinRequestStatus.Pending ? (
                      <div className="flex flex-nowrap items-center gap-2">
                        <Button variant="primary" onClick={() => setApproveTarget(req)} icon={<Check size={16} />}>
                          Approve
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setRejectNote('')
                            setRejectTarget(req)
                          }} icon={<Ban size={16} />}>
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <Typography variant="small" tone="muted">
                        —
                      </Typography>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        title="Approve join request?"
        message="The requester will be added as a workspace member."
        confirmLabel="Approve"
        loading={actionLoading}
        onConfirm={handleApprove}
      />

      <Modal
        open={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null)
          setRejectNote('')
        }}
        title="Reject join request?"
        size="sm"
        actions={[
          {
            label: 'Cancel',
            onClick: () => {
              setRejectTarget(null)
              setRejectNote('')
            },
            variant: 'ghost',
          },
          {
            label: 'Reject',
            onClick: () => void handleReject(),
            variant: 'primary',
            tone: 'error',
            loading: actionLoading,
          },
        ]}
      >
        <Typography className="mb-4">Optionally include a note for the requester.</Typography>
        <Input
          label="Review note"
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          fullWidth
          placeholder="Optional"
        />
      </Modal>
    </div>
  )
}
