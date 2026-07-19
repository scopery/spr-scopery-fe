'use client'

import { UserPlus } from 'lucide-react'

import { useState } from 'react'
import NextLink from 'next/link'
import { Badge, Button, ConfirmDialog, Link as DesignLink, Typography, PageSkeleton } from '@/shared/ui'
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
      /* global interceptor */
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <PageSkeleton variant="list" />
    )
  }

  return (
    <div className="border border-neutral-200 bg-white p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
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
        <div className="border border-neutral-200 bg-neutral-50 p-6 text-center">
          <Typography variant="small" tone="muted" className="mb-3">
            No join requests tracked yet. Submit one with a workspace code to get started.
          </Typography>
          <DesignLink as={NextLink} href={PLATFORM_ROUTES.join}>
            Go to request form
          </DesignLink>
        </div>
      ) : (
        <div className="overflow-hidden border border-neutral-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Workspace</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-600">Submitted</th>
                <th className="min-w-[14rem] whitespace-nowrap px-4 py-3 text-left font-medium text-neutral-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((req) => (
                <tr key={req.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">
                    <Typography weight="medium">
                      {req.workspaceCode || req.workspaceId.slice(0, 8) + '…'}
                    </Typography>
                    {req.message && (
                      <Typography variant="small" tone="muted" className="mt-0.5">
                        {req.message}
                      </Typography>
                    )}
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
                      <Button
                        variant="ghost"
                        tone="error"
                        onClick={() => setCancelTarget(req)}
                      >
                        Cancel
                      </Button>
                    ) : (
                      <Typography variant="small" tone="muted">
                        —
                      </Typography>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </div>
  )
}
