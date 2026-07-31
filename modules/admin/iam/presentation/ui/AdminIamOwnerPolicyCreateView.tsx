'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { Typography, Button, Stack, Input, Checkbox, Card } from '@/shared/ui'
import { useIamOwnerPolicyCreate } from '../hooks/useIamOwnerPolicyCreate'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export function AdminIamOwnerPolicyCreateView() {
  const { createOwnerPolicy, submitting, error } = useIamOwnerPolicyCreate()
  const [form, setForm] = useState({
    resourceType: '',
    name: '',
    description: '',
    canDelegate: false,
  })

  const canSubmit = form.resourceType.trim() && form.name.trim()

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      await createOwnerPolicy({
        resourceType: form.resourceType.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        canDelegate: form.canDelegate,
      })
    } catch {
      // error already toasted in hook
    }
  }

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.iamOwnerPolicies}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to Owner policies
      </NextLink>

      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Create owner policy
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Define ownership defaults for a resource type.
        </Typography>
      </div>

      <Card className="max-w-md p-6">
        <Stack direction="vertical" spacing="md">
          <Input
            label="Resource type"
            value={form.resourceType}
            onChange={(e) => setForm((f) => ({ ...f, resourceType: e.target.value }))}
            placeholder="e.g. WORKSPACE"
          />
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Policy name"
          />
          <Input
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <label className="flex cursor-pointer items-center gap-2">
            <Checkbox
              checked={form.canDelegate}
              onChange={() => setForm((f) => ({ ...f, canDelegate: !f.canDelegate }))}
            />
            <Typography size="sm">Can delegate</Typography>
          </label>

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
              {submitting ? 'Creating…' : 'Create policy'}
            </Button>
            <NextLink
              href={ADMIN_ROUTES.iamOwnerPolicies}
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
