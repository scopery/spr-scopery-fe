'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus } from 'lucide-react'
import { Typography, Button, Stack, Input, Select, Card } from '@/shared/ui'
import { useIamRoleCreate, type RoleCreateType } from '../hooks/useIamRoleCreate'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { AdminWorkspaceSearchSelect } from '@/modules/admin/workspaces'

const TYPE_OPTIONS = [
  { value: 'system', label: 'System role' },
  { value: 'workspace', label: 'Workspace role' },
]

export function AdminIamRoleCreateView() {
  const searchParams = useSearchParams()
  const initialType = useMemo<RoleCreateType>(() => {
    const raw = searchParams.get('type')
    return raw === 'workspace' ? 'workspace' : 'system'
  }, [searchParams])

  const { createRole, submitting, error } = useIamRoleCreate()
  const [type, setType] = useState<RoleCreateType>(initialType)
  const [form, setForm] = useState({
    code: '',
    name: '',
    description: '',
    workspaceId: '',
  })

  const canSubmit =
    form.code.trim() && form.name.trim() && (type !== 'workspace' || form.workspaceId.trim())

  const handleSubmit = async () => {
    if (!canSubmit) return
    try {
      await createRole(type, {
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        workspaceId: type === 'workspace' ? form.workspaceId.trim() : undefined,
      })
    } catch {
      // error already toasted in hook
    }
  }

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.iamRoles}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to Roles
      </NextLink>

      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Create role
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Create a system or workspace role that can be assigned to users.
        </Typography>
      </div>

      <Card className="max-w-md p-6">
        <Stack direction="vertical" spacing="md">
          <div>
            <Typography variant="small" tone="muted" className="mb-1.5">
              Role type
            </Typography>
            <Select
              value={type}
              onValueChange={(v: string) => setType(v === 'workspace' ? 'workspace' : 'system')}
              options={TYPE_OPTIONS}
            />
          </div>
          <Input
            label="Code"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            placeholder="e.g. WORKSPACE_ADMIN"
          />
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Workspace Administrator"
          />
          <Input
            label="Description (optional)"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          {type === 'workspace' && (
            <AdminWorkspaceSearchSelect
              value={form.workspaceId}
              onChange={(workspaceId) => setForm((current) => ({ ...current, workspaceId }))}
            />
          )}

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
              {submitting ? 'Creating…' : 'Create role'}
            </Button>
            <NextLink
              href={ADMIN_ROUTES.iamRoles}
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
