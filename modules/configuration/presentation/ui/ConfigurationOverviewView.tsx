'use client'

import { useParams } from 'next/navigation'
import { Badge, Link, Typography, PageSkeleton } from '@/shared/ui'
import { useConfigurationOverview } from '../hooks/useConfigurationOverview'

export function ConfigurationOverviewView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { objectTypes, counts, loading, error } = useConfigurationOverview(workspaceId)
  const base = `/admin/workspaces/${workspaceId}/config`

  if (loading) {
    return (
      <PageSkeleton variant="cards" />
    )
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 p-4">
        <Typography variant="small" className="text-red-700">
          {error}
        </Typography>
      </div>
    )
  }

  const summaryCards = [
    { label: 'Custom fields', value: counts.customFields, href: `${base}/fields` },
    { label: 'Forms', value: counts.forms, href: `${base}/forms` },
    { label: 'Layouts', value: counts.layouts, href: `${base}/ui-metadata` },
    { label: 'Status sets', value: counts.statusSets, href: `${base}/ui-metadata` },
    { label: 'Tags', value: counts.tags, href: `${base}/ui-metadata` },
    { label: 'Taxonomies', value: counts.taxonomies, href: `${base}/ui-metadata` },
  ]

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Configuration
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Custom fields, forms, layouts, statuses, tags, and taxonomies for this workspace.
        </Typography>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {summaryCards.map((card) => (
          <Link key={card.label} href={card.href} className="block">
            <div className="border border-neutral-200 bg-white p-4 hover:border-neutral-300">
              <Typography size="xl" weight="bold">
                {card.value}
              </Typography>
              <Typography variant="small" tone="muted">
                {card.label}
              </Typography>
            </div>
          </Link>
        ))}
      </div>

      <Typography weight="semibold" className="mb-3">
        Object types
      </Typography>
      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-3 py-2 font-medium">Code</th>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Custom fields</th>
              <th className="px-3 py-2 font-medium">Forms</th>
              <th className="px-3 py-2 font-medium">Tags</th>
              <th className="px-3 py-2 font-medium">Custom status</th>
              <th className="px-3 py-2 font-medium">Enabled</th>
            </tr>
          </thead>
          <tbody>
            {objectTypes.map((type) => (
              <tr key={type.id} className="border-t border-neutral-100">
                <td className="px-3 py-2 font-mono text-xs">{type.code}</td>
                <td className="px-3 py-2">{type.name}</td>
                <td className="px-3 py-2">{type.customFieldsEnabled ? '✓' : '—'}</td>
                <td className="px-3 py-2">{type.formsEnabled ? '✓' : '—'}</td>
                <td className="px-3 py-2">{type.tagsEnabled ? '✓' : '—'}</td>
                <td className="px-3 py-2">{type.customStatusEnabled ? '✓' : '—'}</td>
                <td className="px-3 py-2">
                  <Badge variant="solid" tone={type.enabled ? 'success' : 'neutral'}>
                    {type.enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </td>
              </tr>
            ))}
            {objectTypes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center">
                  <Typography variant="small" tone="muted">
                    No object types configured.
                  </Typography>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
