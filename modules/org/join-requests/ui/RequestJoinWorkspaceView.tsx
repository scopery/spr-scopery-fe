'use client'

import { Send } from 'lucide-react'

import { useState } from 'react'
import NextLink from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Input, Link as DesignLink, Stack, Typography } from '@/shared/ui'
import { ACCOUNT_ROUTES } from '@/modules/auth/lib/routes'
import { toast } from 'sonner'
import { useMyJoinRequests } from '../hooks/useMyJoinRequests'

export function RequestJoinWorkspaceView() {
  const router = useRouter()
  const { submit } = useMyJoinRequests()
  const [workspaceCode, setWorkspaceCode] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    const code = workspaceCode.trim()
    if (!code) {
      toast.error('Enter a workspace code')
      return
    }
    setSubmitting(true)
    try {
      await submit({
        workspaceCode: code || undefined,
        message: message.trim() || undefined,
      })
      toast.success('Join request submitted')
      router.push(ACCOUNT_ROUTES.joinRequests)
    } catch {
      /* Error toast is handled centrally. */
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <Typography as="h1" size="md" weight="medium" className="mb-1">
        Request to join a workspace
      </Typography>
      <Typography as="p" variant="small" tone="muted" className="mb-8">
        Enter the workspace code shared by its administrator. An admin will review your request.
      </Typography>

      <Stack direction="vertical" spacing="md">
        <Input
          label="Workspace code"
          value={workspaceCode}
          onChange={(e) => setWorkspaceCode(e.target.value)}
          fullWidth
          placeholder="e.g. SCOPERY"
        />
        <Input
          label="Message (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          fullWidth
          placeholder="Why you want to join"
        />
        <Button
          variant="primary"
          loading={submitting}
          onClick={() => void handleSubmit()}
          icon={<Send size={16} />}
        >
          Submit request
        </Button>
        <Typography variant="small" tone="muted">
          Track and cancel pending requests in{' '}
          <DesignLink as={NextLink} href={ACCOUNT_ROUTES.joinRequests}>
            My join requests
          </DesignLink>
          .
        </Typography>
      </Stack>
    </div>
  )
}
