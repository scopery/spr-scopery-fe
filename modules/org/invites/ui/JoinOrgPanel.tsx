'use client'

import { Typography, Stack, Button, Input } from '@/shared/ui'
import { useJoinOrgPanel } from '../hooks/useJoinOrgPanel'

export interface JoinOrgPanelProps {
  initialValue?: string
}

export function JoinOrgPanel({ initialValue = '' }: JoinOrgPanelProps) {
  const { token, setToken, loading, error, handleSubmit } = useJoinOrgPanel(initialValue)

  return (
    <form onSubmit={handleSubmit}>
      <Stack direction="vertical" spacing="md">
        <Input
          label="Invite link or token"
          type="text"
          required
          value={token}
          onChange={(e) => setToken(e.target.value)}
          error={error ?? undefined}
          placeholder="Paste your invite link or token"
          fullWidth
        />
        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={loading}
          disabled={!token.trim()}
        >
          Join organization
        </Button>
        <Typography tone="muted" variant="small">
          Ask an organization owner for an invite link if you do not have one yet.
        </Typography>
      </Stack>
    </form>
  )
}
