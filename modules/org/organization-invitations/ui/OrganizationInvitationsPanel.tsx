'use client'

import { Plus } from 'lucide-react'

import { useCallback, useEffect, useState } from 'react'
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  Modal,
  Stack,
  Typography,
} from '@/shared/ui'
import { toast } from 'sonner'
import * as organizationInvitationsApi from '../api/organization-invitations.api'
import {
  clearTrackedOrgInvitationToken,
  listTrackedOrgInvitations,
  updateTrackedOrgInvitationStatus,
  upsertTrackedOrgInvitation,
} from '../lib/tracked-org-invitations'
import { OrgInvitationStatus } from '../model/organization-invitation'
import type { MyOrgInvitationRecord } from '../model/organization-invitation'
import { PLATFORM_ROUTES } from '@/modules/platform/lib/routes'

interface OrganizationInvitationsPanelProps {
  organizationId: string
  embedded?: boolean
}

export function OrganizationInvitationsPanel({
  organizationId,
  embedded = false,
}: OrganizationInvitationsPanelProps) {
  const [items, setItems] = useState<MyOrgInvitationRecord[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [createdToken, setCreatedToken] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<MyOrgInvitationRecord | null>(null)

  const refresh = useCallback(() => {
    setItems(listTrackedOrgInvitations(organizationId))
  }, [organizationId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const acceptUrl = (token: string) => {
    if (typeof window === 'undefined') return `${PLATFORM_ROUTES.orgInviteAccept(token)}`
    return `${window.location.origin}${PLATFORM_ROUTES.orgInviteAccept(token)}`
  }

  const handleCreate = async () => {
    const inviteeEmail = email.trim()
    if (!inviteeEmail) {
      toast.error('Email is required')
      return
    }
    setActionLoading(true)
    try {
      const created = await organizationInvitationsApi.createOrganizationInvitation(organizationId, {
        inviteeEmail,
        membershipType: 'MEMBER',
      })
      upsertTrackedOrgInvitation(created)
      setCreatedToken(created.token)
      setEmail('')
      refresh()
      toast.success('Invitation created')
    } catch {
      /* interceptor */
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!cancelTarget) return
    setActionLoading(true)
    try {
      await organizationInvitationsApi.cancelOrganizationInvitation(
        organizationId,
        cancelTarget.id
      )
      updateTrackedOrgInvitationStatus(cancelTarget.id, OrgInvitationStatus.Cancelled)
      setCancelTarget(null)
      refresh()
      toast.success('Invitation cancelled')
    } catch {
      /* interceptor */
    } finally {
      setActionLoading(false)
    }
  }

  const copyLink = async (token: string) => {
    try {
      await navigator.clipboard.writeText(acceptUrl(token))
      toast.success('Invite link copied')
    } catch {
      toast.error('Could not copy link')
    }
  }

  return (
    <div>
      {!embedded && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Typography as="h1" size="lg" weight="semibold">
              Organization invitations
            </Typography>
            <Typography as="p" variant="small" tone="muted" className="mt-1">
              Invite users by email. The accept link is shown once on create.
            </Typography>
          </div>
          <Button
            variant="primary"
            onClick={() => {
              setCreatedToken(null)
              setCreateOpen(true)
            }} icon={<Plus size={16} />}>
            Create invitation
          </Button>
        </div>
      )}
      {embedded && (
        <div className="mb-4 flex justify-end">
          <Button
            variant="primary"
            onClick={() => {
              setCreatedToken(null)
              setCreateOpen(true)
            }} icon={<Plus size={16} />}>
            Create invitation
          </Button>
        </div>
      )}

      <Typography variant="small" tone="muted" className="mb-4">
        BE does not expose a list endpoint yet — this table shows invitations created in this
        browser.
      </Typography>

      <div className="overflow-hidden border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Status</th>
              <th className="px-4 py-3 text-left font-medium text-neutral-600">Expires</th>
              <th className="min-w-[12rem] whitespace-nowrap px-4 py-3 text-left font-medium text-neutral-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                  No tracked invitations
                </td>
              </tr>
            ) : (
              items.map((inv) => (
                <tr key={inv.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-3">{inv.inviteeEmail}</td>
                  <td className="px-4 py-3">
                    <Badge variant="solid"
                      tone={
                        inv.status === OrgInvitationStatus.Pending
                          ? 'warning'
                          : inv.status === OrgInvitationStatus.Accepted
                            ? 'success'
                            : 'neutral'
                      }
                    >
                      {inv.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {inv.expiresAt ? new Date(inv.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {inv.status === OrgInvitationStatus.Pending && (
                      <Button
                        variant="ghost"
                        tone="error"
                        onClick={() => setCancelTarget(inv)}
                      >
                        Cancel
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={createOpen}
        onClose={() => {
          if (createdToken) {
            const match = items.find((i) => i.token === createdToken)
            if (match) clearTrackedOrgInvitationToken(match.id)
          }
          setCreateOpen(false)
          setCreatedToken(null)
          setEmail('')
          refresh()
        }}
        title={createdToken ? 'Invitation link' : 'Create invitation'}
        size="md"
        actions={
          createdToken
            ? [
                {
                  label: 'Copy link & close',
                  onClick: () => {
                    void copyLink(createdToken).then(() => {
                      setCreateOpen(false)
                      setCreatedToken(null)
                      refresh()
                    })
                  },
                  variant: 'primary',
                },
              ]
            : [
                {
                  label: 'Cancel',
                  onClick: () => {
                    setCreateOpen(false)
                    setEmail('')
                  },
                  variant: 'ghost',
                },
                {
                  label: 'Create',
                  onClick: () => void handleCreate(),
                  variant: 'primary',
                  loading: actionLoading,
                },
              ]
        }
      >
        {createdToken ? (
          <Stack direction="vertical" spacing="sm">
            <Typography variant="small" tone="warning">
              Copy this link now — the raw token is only returned on create.
            </Typography>
            <code className="block break-all bg-neutral-100 p-3 text-xs">{acceptUrl(createdToken)}</code>
          </Stack>
        ) : (
          <Input
            label="Invitee email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            placeholder="user@example.com"
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Cancel invitation?"
        message={`Cancel the invitation for ${cancelTarget?.inviteeEmail ?? 'this user'}?`}
        confirmLabel="Cancel invitation"
        variant="danger"
        loading={actionLoading}
        onConfirm={handleCancel}
      />
    </div>
  )
}
