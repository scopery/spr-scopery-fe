'use client'

import { useState } from 'react'
import { Button, Input, Stack, Typography } from '@/shared/ui'
import { usePortalLogin } from '../hooks/usePortalLogin'

export function PortalLoginView() {
  const { login, submitting, error } = usePortalLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  return (
    <Stack direction="vertical" spacing="md" className="mx-auto max-w-md p-lg">
      <Typography variant="h2">Client Portal</Typography>
      <Typography tone="muted">Sign in to review project artifacts shared with you.</Typography>
      {error ? <Typography tone="error">{error}</Typography> : null}
      <Input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        aria-label="Email"
      />
      <Input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        aria-label="Password"
      />
      <Button
        disabled={submitting || !email || !password}
        onClick={() => void login(email, password)}
      >
        Sign in
      </Button>
    </Stack>
  )
}
