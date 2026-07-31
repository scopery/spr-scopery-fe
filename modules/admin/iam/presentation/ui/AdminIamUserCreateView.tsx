'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { Typography, Button, Stack, Input, Card } from '@/shared/ui'
import { useIamUserCreate } from '../hooks/useIamUserCreate'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export function AdminIamUserCreateView() {
  const { createUser, submitting, error } = useIamUserCreate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
  })

  const canSubmit =
    form.username.trim() &&
    form.email.trim() &&
    form.fullName.trim() &&
    form.password.trim()

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      await createUser({
        username: form.username.trim(),
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        password: form.password,
      })
    } catch {
      // error already toasted in hook
    }
  }

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.iamUsers}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to Users
      </NextLink>

      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Create user
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Provision a new platform user. Status changes use activate / deactivate / suspend after
          create.
        </Typography>
      </div>

      <Card className="max-w-md p-6">
        <Stack direction="vertical" spacing="md">
          <Input
            label="Username"
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            placeholder="jsmith"
            autoComplete="off"
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="jane@example.com"
          />
          <Input
            label="Full name"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            placeholder="Jane Smith"
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            autoComplete="new-password"
          />

          {error && (
            <div className="border border-red-200 bg-red-50 p-3">
              <Typography variant="small" className="text-red-700">
                {error}
              </Typography>
            </div>
          )}

          <Stack direction="horizontal" spacing="sm">
            <Button
              variant="primary"
              disabled={submitting || !canSubmit}
              onClick={() => void handleSubmit()}
              icon={<Plus size={16} />}
            >
              {submitting ? 'Creating…' : 'Create user'}
            </Button>
            <NextLink
              href={ADMIN_ROUTES.iamUsers}
              className="inline-flex items-center px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              Cancel
            </NextLink>
          </Stack>
        </Stack>
      </Card>
    </div>
  )
}
