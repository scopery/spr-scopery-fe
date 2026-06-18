'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Eye, Pencil, Copy, CircleArrowOutUpLeft } from 'lucide-react'
import { Typography, Button, Badge, ContentLoader, Spinner, Select, Input } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import * as templateService from '@/services/template.service'
import { useAdminTemplates } from '@/hooks/useAdminTemplates'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

const STATUS_ALL = '__all__'
const STATUS_OPTIONS = [
  { value: STATUS_ALL, label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'deprecated', label: 'Deprecated' },
]

function statusBadgeTone(status: string): 'info' | 'success' | 'neutral' | 'warning' {
  switch (status) {
    case 'draft':
      return 'info'
    case 'published':
      return 'success'
    case 'deprecated':
      return 'warning'
    default:
      return 'neutral'
  }
}

export default function AdminTemplatesPage() {
  const router = useRouter()
  const { templates: items, loading, loadTemplates } = useAdminTemplates()
  const [statusFilter, setStatusFilter] = useState(STATUS_ALL)
  const [search, setSearch] = useState('')
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null)

  useEffect(() => {
    const params: { status?: string } = {}
    if (statusFilter && statusFilter !== STATUS_ALL) params.status = statusFilter
    loadTemplates(params)
  }, [statusFilter, loadTemplates])

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.trim().toLowerCase()
    return items.filter((t) => t.name.toLowerCase().includes(q))
  }, [items, search])

  const handleDuplicate = async (templateId: string) => {
    setDuplicatingId(templateId)
    try {
      const created = await templateService.duplicateTemplate(templateId)
      toast.success('Template duplicated')
      await loadTemplates()
      if (created?.id) {
        router.push(ROUTES.admin.template(created.id))
      }
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setDuplicatingId(null)
    }
  }

  return (
    <div className="p-6 mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-primary hover:underline mb-2"
          >
            <CircleArrowOutUpLeft size={20} />
          </Link>
          <Typography as="h1" size="xl" weight="bold">
            Templates
          </Typography>
          <Typography variant="small" tone="muted" className="mt-0.5">
            Manage questionnaire templates (draft, publish, duplicate)
          </Typography>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => router.push(ROUTES.admin.templateNew)}
          className="gap-2 bg-neutral-900"
        >
          <Plus size={18} />
          New template
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4">
        <div className="min-w-[180px]">
          <label className="block text-sm text-neutral-700 mb-2">Status</label>
          <Select
            options={STATUS_OPTIONS}
            value={statusFilter}
            onValueChange={(v: string) => setStatusFilter(v)}
            className="w-full"
            size="sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <Input
            type="search"
            label="Search by name"
            placeholder="Filter by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            size="sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <ContentLoader variant="easeOut" className="w-20" />
        </div>
      ) : (
        <div className="overflow-hidden bg-white">
          <table className="w-full text-left">
            <thead className="border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-sm font-normal text-neutral-700">Name</th>
                <th className="px-4 py-3 text-sm font-normal text-neutral-700">Version</th>
                <th className="px-4 py-3 text-sm font-normal text-neutral-700">Status</th>
                <th className="px-4 py-3 text-sm font-normal text-neutral-700">Created at</th>
                <th className="px-4 py-3 text-sm font-normal text-neutral-700 w-40">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                    No templates found.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/50">
                    <td className="px-4 py-3">
                      <Link
                        href={ROUTES.admin.template(t.id)}
                        className="font-medium text-primary hover:underline"
                      >
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">{t.version || '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusBadgeTone(t.status)} size="sm">
                        {t.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(ROUTES.admin.template(t.id))}
                          className="gap-1"
                          aria-label="View template"
                        >
                          <Eye size={14} />
                          View
                        </Button>
                        {t.status === 'draft' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(ROUTES.admin.template(t.id))}
                            className="gap-1"
                            aria-label="Edit template"
                          >
                            <Pencil size={14} />
                            Edit
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(t.id)}
                          disabled={duplicatingId === t.id}
                          className="gap-1"
                          aria-label="Duplicate template"
                        >
                          {duplicatingId === t.id ? (
                            <Spinner size="sm" />
                          ) : (
                            <Copy size={14} />
                          )}
                          Duplicate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
