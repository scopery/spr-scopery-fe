'use client'

import { Archive, Check, Save } from 'lucide-react'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { Typography, Button, Stack, Input, PageSkeleton } from '@/shared/ui'
import { useAdminOrganizationDetail } from '../hooks/useAdminOrganizationDetail'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { OrganizationStatus } from '../../domain/enums/organization.enum'

export function AdminOrganizationDetailView() {
  const { orgId } = useParams<{ orgId: string }>()
  const { data, loading, error, acting, saving, save, runAction } = useAdminOrganizationDetail(orgId)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (!data) return
    setName(data.name)
    setDescription(data.description ?? '')
  }, [data])

  if (loading) {
    return (
      <PageSkeleton variant="detail" />
    )
  }

  if (error || !data) {
    return (
      <div className="border border-red-200 bg-red-50 p-4">
        <Typography variant="small" className="text-red-700">
          {error ?? 'Organization not found'}
        </Typography>
      </div>
    )
  }

  const dirty =
    name.trim() !== data.name || (description.trim() || '') !== (data.description ?? '')

  return (
    <div>
      <div className="mb-4 flex justify-end gap-2">
        {data.status === OrganizationStatus.Archived ? (
          <Button
            variant="outline"
            disabled={acting}
            onClick={() => void runAction('activate')} icon={<Check size={16} />}>
            Activate
          </Button>
        ) : (
          <Button
            variant="outline"
            disabled={acting}
            onClick={() => void runAction('archive')} icon={<Archive size={16} />}>
            Archive
          </Button>
        )}
        <NextLink
          href={ADMIN_ROUTES.organizationWorkspaces(data.id)}
          className="inline-flex items-center border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50"
        >
          View workspaces
        </NextLink>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-neutral-200 bg-white p-6">
          <Typography as="h2" size="lg" weight="semibold" className="mb-4">
            Overview
          </Typography>
          <Stack direction="vertical" spacing="md">
            <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Button
              variant="primary"
              disabled={!dirty || !name.trim() || saving}
              onClick={() =>
                void save({
                  name: name.trim(),
                  description: description.trim() || undefined,
                })
              } icon={<Save size={16} />}>
              {saving ? 'Saving…' : 'Save changes'}
            </Button>
          </Stack>
        </div>

        <div className="border border-neutral-200 bg-white p-6">
          <Typography as="h2" size="lg" weight="semibold" className="mb-4">
            Metadata
          </Typography>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-neutral-500">Organization ID</dt>
              <dd className="mt-0.5 font-mono text-xs">{data.id}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Owner user ID</dt>
              <dd className="mt-0.5 font-mono text-xs">{data.ownerUserId ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Created</dt>
              <dd className="mt-0.5">{new Date(data.createdAt).toLocaleDateString()}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Updated</dt>
              <dd className="mt-0.5">{new Date(data.updatedAt).toLocaleDateString()}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
