'use client'

import { Save } from 'lucide-react'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button, Card, Input, Stack, Typography, PageSkeleton } from '@/shared/ui'
import { useAuth } from '@/modules/auth/auth'
import { useProfile } from '@/modules/auth/profile'

export function AccountProfileView() {
  const { session } = useAuth()
  const { profile, loading, getProfile, updateProfile } = useProfile()
  const [displayName, setDisplayName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    void getProfile()
  }, [getProfile])

  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name)
    else if (session?.user.fullName) setDisplayName(session.user.fullName)
  }, [profile, session])

  const handleSave = async () => {
    const trimmed = displayName.trim()
    if (!trimmed) {
      toast.error('Display name is required')
      return
    }
    setSaving(true)
    try {
      await updateProfile({ display_name: trimmed })
      toast.success('Profile updated')
    } catch (err) {
      if (err instanceof Error) toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading && !profile) {
    return <PageSkeleton variant="form" />
  }

  return (
    <Card className="border border-neutral-200 bg-white p-3">
      <Typography as="h2" size="md" weight="medium" className="mb-1">
        Profile
      </Typography>
      <Typography as="p" variant="small" tone="muted" className="mb-2">
        Update how your name appears across Scopery.
      </Typography>
      <Stack direction="vertical" spacing="md" className="max-w-md">
        <Input
          label="Email"
          value={session?.user.email ?? profile?.email ?? ''}
          disabled
          fullWidth
        />
        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          fullWidth
        />
        <Button
          variant="primary"
          loading={saving}
          onClick={() => void handleSave()}
          icon={<Save size={16} />}
        >
          Save changes
        </Button>
      </Stack>
    </Card>
  )
}
