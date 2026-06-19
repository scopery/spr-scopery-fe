'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Typography, Box, Stack, Button, Input } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/modules/auth'
import { useOrgActions } from '@/modules/org'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import { getPendingInviteToken } from '@/utils/inviteToken'
import { JoinOrgPanel } from '@/modules/org'
import { cn } from '@/utils/cn'

type TabId = 'create' | 'join'

/**
 * Onboarding — create first org or join by invite when user has no orgs.
 */
export default function OnboardingPage() {
  const router = useRouter()
  const { refreshBootstrap, profile, orgs, bootstrapStatus } = useAuth()
  const { createOrg, setDefaultOrg } = useOrgActions()
  const [activeTab, setActiveTab] = useState<TabId>(() =>
    getPendingInviteToken() ? 'join' : 'create'
  )
  const [joinInitialValue] = useState(() => getPendingInviteToken() ?? '')
  const [name, setName] = useState('')
  const [createLoading, setCreateLoading] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  useEffect(() => {
    if (bootstrapStatus === 'loading') return
    if (orgs.length > 0) {
      const orgId = orgs[0].id
      router.replace(ROUTES.org.projects(orgId))
    }
  }, [orgs, router])

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setCreateError('Organization name is required')
      return
    }
    setCreateLoading(true)
    setCreateError(null)
    try {
      const org = await createOrg(name.trim())
      await setDefaultOrg(org.id)
      await refreshBootstrap()
      router.replace(ROUTES.org.projects(org.id))
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail
          : err instanceof Error
            ? err.message
            : 'Failed to create organization'
      setCreateError(msg)
      toast.error(msg)
    } finally {
      setCreateLoading(false)
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
          Get started
        </Typography>
        <Typography tone="muted" className="mb-6">
          Create an organization or join one with an invite link.
        </Typography>

        <div className="mb-6 flex border-b border-neutral-200">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={cn(
              '-mb-px border-b-2 px-4 py-4 text-sm font-normal transition-colors',
              activeTab === 'create'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            )}
          >
            Create new organization
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('join')}
            className={cn(
              '-mb-px border-b-2 px-4 py-4 text-sm font-normal transition-colors',
              activeTab === 'join'
                ? 'border-primary text-primary'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            )}
          >
            Join by invite
          </button>
        </div>

        {activeTab === 'create' && (
          <form onSubmit={handleCreateSubmit}>
            <Stack direction="vertical" spacing="md">
              <Input
                label="Organization name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={createError ?? undefined}
                placeholder="e.g. Acme Inc"
                fullWidth
                autoComplete="organization"
              />
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={createLoading}
                disabled={!name.trim()}
              >
                Create organization
              </Button>
            </Stack>
          </form>
        )}

        {activeTab === 'join' && <JoinOrgPanel initialValue={joinInitialValue} />}

        {profile?.status === 'suspended' && (
          <Typography tone="error" variant="small" className="mt-4">
            Your account is suspended. You cannot create or join organizations.
          </Typography>
        )}
      </Box>
    </main>
  )
}
