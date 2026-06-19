'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Typography, Box, Stack, Button, Input } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/modules/auth'
import { useProfile } from '@/modules/auth'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'

export default function OnboardingProfilePage() {
  const router = useRouter()
  const { profile: authProfile, refreshBootstrap } = useAuth()
  const { updateProfile } = useProfile()
  const [displayName, setDisplayName] = useState(authProfile?.display_name ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = displayName.trim()
    if (!trimmed) {
      setError('Display name is required')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await updateProfile({ display_name: trimmed })
      await refreshBootstrap()
      router.replace(ROUTES.onboarding)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail
          : err instanceof Error
            ? err.message
            : 'Failed to update profile'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Box
        as="section"
        padding="xl"
        background="white"
        shadow="xl"
        className="w-full max-w-lg border border-neutral-100"
      >
        <Typography as="h1" size="lg" weight="bold" className="mb-2">
          Set up your profile
        </Typography>
        <Typography tone="muted" className="mb-6">
          Add your display name before creating or joining an organization.
        </Typography>
        <form onSubmit={handleSubmit}>
          <Stack direction="vertical" spacing="md">
            <Input
              label="Display name"
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={error ?? undefined}
              placeholder="Your name"
              fullWidth
              autoComplete="name"
            />
            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              disabled={!displayName.trim()}
            >
              Continue
            </Button>
          </Stack>
        </form>
      </Box>
    </main>
  )
}
