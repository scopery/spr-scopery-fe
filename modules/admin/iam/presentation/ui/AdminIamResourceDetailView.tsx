'use client'

import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Typography, PageSkeleton, Card } from '@/shared/ui'
import { IamStatusBadge } from './IamStatusBadge'
import { useIamResourceDetail } from '../hooks/useIamResourceDetail'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import { cn } from '@/utils/cn'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function AdminIamResourceDetailView() {
  const { resourceId } = useParams<{ resourceId: string }>()
  const { resource, loading, error } = useIamResourceDetail(resourceId)

  if (loading) {
    return <PageSkeleton variant="detail" />
  }

  if (error || !resource) {
    return (
      <div>
        <NextLink
          href={ADMIN_ROUTES.iamResources}
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
        >
          <ArrowLeft size={14} /> Back to Resources
        </NextLink>
        <div className="border border-red-200 bg-red-50 p-4">
          <Typography variant="small" className="text-red-700">
            {error ?? 'Resource not found'}
          </Typography>
        </div>
      </div>
    )
  }

  const fields = [
    { label: 'Code', value: resource.code, mono: true },
    { label: 'Type', value: resource.resourceType },
    { label: 'Name', value: resource.name },
    { label: 'Description', value: resource.description || '—' },
    { label: 'Status', value: resource.status },
    { label: 'Created', value: formatDate(resource.createdAt) },
    { label: 'Updated', value: formatDate(resource.updatedAt) },
  ]

  return (
    <div>
      <NextLink
        href={ADMIN_ROUTES.iamResources}
        className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft size={14} /> Back to Resources
      </NextLink>

      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Typography as="h1" size="lg" weight="semibold">
            {resource.name}
          </Typography>
          <IamStatusBadge status={resource.status} />
        </div>
        <Typography as="p" variant="small" tone="muted" className="mt-1 font-mono text-xs">
          {resource.code}
        </Typography>
      </div>

      <Card className="max-w-lg">
        <div className="divide-y divide-neutral-100">
          {fields.map(({ label, value, mono }) => (
            <div key={label} className="flex items-start gap-4 px-4 py-3">
              <Typography variant="small" tone="muted" className="w-28 shrink-0">
                {label}
              </Typography>
              <Typography
                variant="small"
                className={cn('flex-1 break-all', mono && 'font-mono text-xs')}
              >
                {value}
              </Typography>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
