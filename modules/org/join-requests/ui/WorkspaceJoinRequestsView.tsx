'use client'

import { Ban, Check } from 'lucide-react'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Typography,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Input,
  Modal,
  PageSkeleton,
  Skeleton,
  Select,
} from '@/shared/ui'
import { UserIdentity, useResolveUsers } from '@/modules/platform'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
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
  const requesterIds = useMemo(() => items.map((item) => item.requestedByUserId), [items])
  const { peopleById } = useResolveUsers(requesterIds)

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
      /* Error toast is handled centrally. */
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
      /* Error toast is handled centrally. */
    } finally {
      setActionLoading(false)
    }
  }

  if (authzLoading) {
    return <PageSkeleton variant="list" />
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
        <Card className="bg-neutral-50 p-4">
          <Typography variant="small" tone="muted">
            You do not have permission to manage workspace join requests.
          </Typography>
        </Card>
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
          <Typography as="h1" size="md" weight="medium">
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

      <div className="border border-neutral-200 bg-white">
        {loading ? (
          <div className="p-4">
            <Skeleton variant="rectangular" width="100%" height={80} />
          </div>
        ) : (
          <DataTable
            ariaLabel="Workspace join requests"
            rows={items}
            rowKey={(req) => req.id}
            emptyMessage="No join requests"
            columns={[
              {
                id: 'requester',
                header: 'Requester',
                kind: 'reference',
                cell: (req) =>
                  peopleById[req.requestedByUserId] ? (
                    <UserIdentity
                      userId={req.requestedByUserId}
                      person={peopleById[req.requestedByUserId]}
                      showEmail
                      size="sm"
                    />
                  ) : (
                    '—'
                  ),
              },
              { id: 'message', header: 'Message', accessor: (req) => req.message || '—' },
              {
                id: 'status',
                header: 'Status',
                cell: (req) => (
                  <Badge variant="solid" tone={statusTone(req.status)}>
                    {req.status
                      .replace(/_/g, ' ')
                      .toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                ),
              },
              {
                id: 'submitted',
                header: 'Submitted',
                accessor: (req) => new Date(req.createdAt).toLocaleString(),
              },
              {
                id: 'actions',
                header: 'Actions',
                width: '16rem',
                cell: (req) =>
                  req.status === JoinRequestStatus.Pending ? (
                    <div className="flex flex-nowrap items-center gap-2">
                      <Button
                        variant="primary"
                        onClick={() => setApproveTarget(req)}
                        icon={<Check size={16} />}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          setRejectNote('')
                          setRejectTarget(req)
                        }}
                        icon={<Ban size={16} />}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : (
                    '—'
                  ),
              },
            ]}
          />
        )}
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
