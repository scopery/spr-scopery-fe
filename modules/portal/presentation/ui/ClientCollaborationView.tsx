'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Button, Input, PageSkeleton, Stack, Typography } from '@/shared/ui'

import { useClientCollaboration } from '../hooks/useClientCollaboration'

export function ClientCollaborationView() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string
    projectId: string
  }>()
  const {
    invites,
    policies,
    grants,
    reviews,
    feedback,
    comments,
    auditLogs,
    loading,
    error,
    actionError,
    invite,
    decideReview,
    revokeGrant,
    suspendAccount,
    deactivateAccount,
  } = useClientCollaboration(workspaceId, projectId)
  const [email, setEmail] = useState('')

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Client Collaboration</Typography>
      <Typography tone="muted">
        Staff console to invite portal clients, manage access grants, and decide client
        reviews. Client-facing portal lives under <code className="text-xs">/portal</code>.
      </Typography>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}

      <Typography variant="h4">Invites</Typography>
      <div className="flex flex-wrap gap-sm">
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="client@acme.com"
          aria-label="Invite email"
        />
        <Button
          size="sm"
          disabled={!email.trim()}
          onClick={() => {
            void invite(email.trim()).then(() => setEmail(''))
          }}
        >
          Send invite
        </Button>
      </div>
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {invites.map((i) => (
          <li key={i.id} className="p-md text-sm">
            {[i.email, i.status].filter(Boolean).join(' · ')}
          </li>
        ))}
      </ul>

      <Typography variant="h4">Permission policies</Typography>
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {policies.map((p) => (
          <li key={p.id} className="p-md text-sm">
            {[p.code, p.name].filter(Boolean).join(' · ')}
          </li>
        ))}
      </ul>

      <Typography variant="h4">Access grants</Typography>
      {grants.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No access grants.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {grants.map((g) => (
            <li key={g.id} className="flex items-center justify-between gap-md p-md">
              <Typography variant="small">
                {[g.portalAccountId, g.permissionPolicyCode, g.status]
                  .filter(Boolean)
                  .join(' · ')}
              </Typography>
              <div className="flex gap-xs">
                {g.portalAccountId ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void suspendAccount(g.portalAccountId!)}
                    >
                      Suspend
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void deactivateAccount(g.portalAccountId!)}
                    >
                      Deactivate
                    </Button>
                  </>
                ) : null}
                <Button size="sm" variant="ghost" onClick={() => void revokeGrant(g.id)}>
                  Revoke
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Client reviews</Typography>
      {reviews.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No reviews.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {reviews.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {r.title ?? r.id}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {r.status}
                </Typography>
              </div>
              <div className="flex gap-xs">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void decideReview(r.id, 'APPROVED')}
                >
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void decideReview(r.id, 'REVISION_REQUESTED')}
                >
                  Revision
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void decideReview(r.id, 'REJECTED')}
                >
                  Reject
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Typography variant="h4">Feedback</Typography>
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {feedback.map((f) => (
          <li key={f.id} className="p-md text-sm">
            {f.body ?? f.id}
          </li>
        ))}
      </ul>

      <Typography variant="h4">Comments</Typography>
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {comments.map((c) => (
          <li key={c.id} className="p-md text-sm">
            {c.body ?? c.id}
          </li>
        ))}
      </ul>

      <Typography variant="h4">Portal audit</Typography>
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {auditLogs.map((a) => (
          <li key={a.id} className="p-md text-sm">
            {[a.action, a.createdAt].filter(Boolean).join(' · ') || a.id}
          </li>
        ))}
      </ul>
    </Stack>
  )
}
