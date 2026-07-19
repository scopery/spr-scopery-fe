'use client'

import { useState } from 'react'
import NextLink from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'
import { Typography, Button, Stack, Input } from '@/shared/ui'
import { useAdminOrganizationCreate } from '../hooks/useAdminOrganizationCreate'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

function nameToCode(name: string) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20)
}

function sanitizeCode(raw: string) {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '')
    .slice(0, 20)
}

export function AdminOrganizationCreateView() {
  const { createOrganization, submitting, error } = useAdminOrganizationCreate()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [codeTouched, setCodeTouched] = useState(false)
  const [description, setDescription] = useState('')

  const canSubmit = name.trim() && code.trim()

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      await createOrganization({
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || undefined,
      })
    } catch {
      // toasted in hook
    }
  }

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.organizations}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to Organizations
      </NextLink>

      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Create organization
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Create a new organization. Code must be unique.
        </Typography>
      </div>

      <div className="max-w-md border border-neutral-200 bg-white p-6">
        <Stack direction="vertical" spacing="md">
          <Input
            label="Name"
            value={name}
            onChange={(e) => {
              const next = e.target.value
              setName(next)
              if (!codeTouched) setCode(nameToCode(next))
            }}
            placeholder="Acme Corporation"
            required
          />
          <Input
            label="Code"
            value={code}
            onChange={(e) => {
              setCodeTouched(true)
              setCode(sanitizeCode(e.target.value))
            }}
            placeholder="ACME"
            required
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
          {error && (
            <Typography variant="small" className="text-red-700">
              {error}
            </Typography>
          )}
          <Button
            variant="primary"
            disabled={!canSubmit || submitting}
            onClick={() => void handleSubmit()}
            icon={<Plus size={16} />}
          >
            {submitting ? 'Creating…' : 'Create organization'}
          </Button>
        </Stack>
      </div>
    </div>
  )
}
