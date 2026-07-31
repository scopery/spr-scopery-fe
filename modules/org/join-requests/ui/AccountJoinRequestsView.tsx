'use client'

import { UserPlus } from 'lucide-react'

import { useState } from 'react'
import NextLink from 'next/link'
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  DataTable,
  Link as DesignLink,
  Typography,
  PageSkeleton,
} from '@/shared/ui'
import { PLATFORM_ROUTES } from '@/modules/platform/lib/routes'
import { toast } from 'sonner'
import { useMyJoinRequests } from '../hooks/useMyJoinRequests'
import { JoinRequestStatus } from '../model'
import type { MyJoinRequestRecord } from '../model'

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

export function AccountJoinRequestsView() {
  const { items, loading, cancel } = useMyJoinRequests()
  const [cancelTarget, setCancelTarget] = useState<MyJoinRequestRecord | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const handleCancel = async () => {
    if (!cancelTarget) return
    setActionLoading(true)
    try {
      await cancel(cancelTarget.workspaceId, cancelTarget.id)
      toast.success('Join request cancelled')
      setCancelTarget(null)
    } catch {
      /* Error toast is handled centrally. */
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <PageSkeleton variant="list" />
  }

  return (
    <Card className="p-6">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <Typography as="h2" size="lg" weight="bold" className="mb-1">
            Join requests
          </Typography>
          <Typography as="p" variant="small" tone="muted">
            Requests you submitted from this browser. Cancel pending ones anytime.
          </Typography>
        </div>
        <DesignLink as={NextLink} href={PLATFORM_ROUTES.join}>
          <Button variant="primary" icon={<UserPlus size={16} />}>
            Request to join
          </Button>
        </DesignLink>
      </div>

      {items.length === 0 ? (
        <Card className="bg-neutral-50 p-6 text-center">
          <Typography variant="small" tone="muted" className="mb-3">
            No join requests tracked yet. Submit one with a workspace code to get started.
          </Typography>
          <DesignLink as={NextLink} href={PLATFORM_ROUTES.join}>
            Go to request form
          </DesignLink>
        </Card>
      ) : (
        <div className="border border-neutral-200">
          <DataTable
            ariaLabel="My workspace join requests"
            rows={items}
            rowKey={(req) => req.id}
            columns={[
              {
                id: 'workspace',
                header: 'Workspace',
                kind: 'code',
                cell: (req) => (
                  <div>
                    <Typography weight="medium">{req.workspaceCode || '—'}</Typography>
                    {req.message ? (
                      <Typography variant="small" tone="muted" className="mt-0.5">
                        {req.message}
                      </Typography>
                    ) : null}
                  </div>
                ),
              },
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
                width: '14rem',
                cell: (req) =>
                  req.status === JoinRequestStatus.Pending ? (
                    <Button variant="ghost" tone="error" onClick={() => setCancelTarget(req)}>
                      Cancel
                    </Button>
                  ) : (
                    '—'
                  ),
              },
            ]}
          />
        </div>
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel join request?"
        message="This withdraws your pending request to join the workspace."
        confirmLabel="Cancel request"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleCancel}
      />
    </Card>
  )
}
