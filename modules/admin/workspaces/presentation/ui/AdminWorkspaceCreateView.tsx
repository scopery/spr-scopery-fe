'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'
import { Typography, Button, Stack, Input, Select } from '@/shared/ui'
import { useAdminWorkspaceCreate } from '../hooks/useAdminWorkspaceCreate'
import { useAdminOrganizations } from '@/modules/admin/organizations'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import {
  WorkspaceJoinPolicy,
  WorkspaceVisibility,
} from '../../domain/enums/workspace.enum'

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

const VISIBILITY_OPTIONS = [
  { value: WorkspaceVisibility.Private, label: 'Private' },
  { value: WorkspaceVisibility.Public, label: 'Public' },
]

const JOIN_POLICY_OPTIONS = [
  { value: WorkspaceJoinPolicy.InviteOnly, label: 'Invite only' },
  { value: WorkspaceJoinPolicy.RequestToJoin, label: 'Request to join' },
  { value: WorkspaceJoinPolicy.InviteOrRequest, label: 'Invite or request' },
  { value: WorkspaceJoinPolicy.Disabled, label: 'Disabled' },
]

export function AdminWorkspaceCreateView() {
  const searchParams = useSearchParams()
  const presetOrgId = searchParams.get('organizationId') ?? ''
  const { createWorkspace, submitting, error } = useAdminWorkspaceCreate()
  const { items: orgs, loading: orgsLoading } = useAdminOrganizations()

  const [organizationId, setOrganizationId] = useState(presetOrgId)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [codeTouched, setCodeTouched] = useState(false)
  const [description, setDescription] = useState('')
  const [defaultVisibility, setDefaultVisibility] = useState<string>(WorkspaceVisibility.Private)
  const [joinPolicy, setJoinPolicy] = useState<string>(WorkspaceJoinPolicy.InviteOnly)

  useEffect(() => {
    if (presetOrgId) setOrganizationId(presetOrgId)
  }, [presetOrgId])

  const orgOptions = [
    { value: '', label: orgsLoading ? 'Loading organizations…' : 'Select organization…' },
    ...orgs.map((o) => ({ value: o.id, label: `${o.name} (${o.code})` })),
  ]

  const canSubmit = organizationId.trim() && name.trim() && code.trim()

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      await createWorkspace({
        organizationId: organizationId.trim(),
        name: name.trim(),
        code: code.trim(),
        description: description.trim() || undefined,
        defaultVisibility: defaultVisibility as (typeof WorkspaceVisibility)[keyof typeof WorkspaceVisibility],
        joinPolicy: joinPolicy as (typeof WorkspaceJoinPolicy)[keyof typeof WorkspaceJoinPolicy],
      })
    } catch {
      // toasted
    }
  }

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.workspaces}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to Workspaces
      </NextLink>

      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Create workspace
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Create a workspace under an existing organization.
        </Typography>
      </div>

      <div className="max-w-md border border-neutral-200 bg-white p-6">
        <Stack direction="vertical" spacing="md">
          <div>
            <Typography variant="small" tone="muted" className="mb-1.5">
              Organization
            </Typography>
            <Select
              value={organizationId}
              onValueChange={setOrganizationId}
              options={orgOptions}
              className="w-full"
            />
          </div>
          <Input
            label="Name"
            value={name}
            onChange={(e) => {
              const next = e.target.value
              setName(next)
              if (!codeTouched) setCode(nameToCode(next))
            }}
            placeholder="Product Team"
            required
          />
          <Input
            label="Code"
            value={code}
            onChange={(e) => {
              setCodeTouched(true)
              setCode(sanitizeCode(e.target.value))
            }}
            placeholder="PRODUCT_TEAM"
            required
          />
          <Input
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description"
          />
          <div>
            <Typography variant="small" tone="muted" className="mb-1.5">
              Default visibility
            </Typography>
            <Select
              value={defaultVisibility}
              onValueChange={setDefaultVisibility}
              options={VISIBILITY_OPTIONS}
              className="w-full"
            />
          </div>
          <div>
            <Typography variant="small" tone="muted" className="mb-1.5">
              Join policy
            </Typography>
            <Select
              value={joinPolicy}
              onValueChange={setJoinPolicy}
              options={JOIN_POLICY_OPTIONS}
              className="w-full"
            />
          </div>
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
            {submitting ? 'Creating…' : 'Create workspace'}
          </Button>
        </Stack>
      </div>
    </div>
  )
}
