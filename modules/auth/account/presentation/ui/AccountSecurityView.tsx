'use client'

import { Ban, Save } from 'lucide-react'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Card, Input, Stack, Typography, Skeleton } from '@/shared/ui'
import { useAccountSecurity } from '../hooks/useAccountSecurity'

export function AccountSecurityView() {
  const { changing, revoking, changePassword, revokeAllSessions, me, meLoading } =
    useAccountSecurity()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      toast.error('Current and new password are required')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    try {
      await changePassword({ currentPassword, newPassword })
      toast.success('Password changed')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  const handleRevokeAll = async () => {
    try {
      await revokeAllSessions()
      toast.success('All other sessions revoked')
    } catch (err) {
      if (err instanceof Error) toast.error(err.message)
    }
  }

  return (
    <Stack direction="vertical" spacing="md">
      <Card className="border border-neutral-200 bg-white p-3">
        <Typography as="h2" size="md" weight="medium" className="mb-1">
          Security status
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mb-2">
          From your current IAM identity.
        </Typography>
        {meLoading ? (
          <Skeleton variant="rectangular" width="100%" height={80} />
        ) : me ? (
          <dl className="grid max-w-md gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Account status</dt>
              <dd className="font-medium">{me.status}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">MFA</dt>
              <dd className="font-medium">
                {me.securityState.mfaEnabled ? 'Enabled' : 'Not enabled'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Password change required</dt>
              <dd className="font-medium">
                {me.securityState.passwordChangeRequired ? 'Yes' : 'No'}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-neutral-500">Organizations</dt>
              <dd className="text-right font-medium">
                {me.organizationMemberships.length
                  ? me.organizationMemberships
                      .map((m) => `${m.organizationName} (${m.membershipType})`)
                      .join(', ')
                  : '—'}
              </dd>
            </div>
          </dl>
        ) : (
          <Typography variant="small" tone="muted">
            Unable to load IAM profile (`GET /iam/me`).
          </Typography>
        )}
      </Card>

      <Card className="border border-neutral-200 bg-white p-3">
        <Typography as="h2" size="md" weight="medium" className="mb-1">
          Change password
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mb-2">
          Use a strong password you do not reuse elsewhere.
        </Typography>
        <Stack direction="vertical" spacing="md" className="max-w-md">
          <Input
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
            autoComplete="current-password"
          />
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
            autoComplete="new-password"
          />
          <Input
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
            autoComplete="new-password"
          />
          <Button
            variant="primary"
            loading={changing}
            onClick={() => void handleChangePassword()}
            icon={<Save size={16} />}
          >
            Update password
          </Button>
        </Stack>
      </Card>

      <Card className="border border-neutral-200 bg-white p-3">
        <Typography as="h2" size="md" weight="medium" className="mb-1">
          Sign out everywhere
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mb-4">
          Revoke all active sessions except the current one.
        </Typography>
        <Button
          variant="outline"
          tone="error"
          loading={revoking}
          onClick={() => void handleRevokeAll()}
          icon={<Ban size={16} />}
        >
          Revoke all sessions
        </Button>
      </Card>
    </Stack>
  )
}
