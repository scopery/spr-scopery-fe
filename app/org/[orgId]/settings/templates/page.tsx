'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Box,
  Button,
  Input,
  Typography,
  Stack,
  Select,
  ContentLoader,
} from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/contexts/AuthContext'
import { DocumentTypeBadge } from '@/shared/components/documents/DocumentTypeBadge'
import { TemplateCategoryBadge } from '@/shared/components/document-templates/TemplateCategoryBadge'
import { TemplatePreviewDialog } from '@/shared/components/document-templates/TemplatePreviewDialog'
import { TemplateScopeBadge } from '@/shared/components/document-templates/TemplateScopeBadge'
import { TemplateStatusBadge } from '@/shared/components/document-templates/TemplateStatusBadge'
import { ConfirmDialog } from '@/shared/components/common/ConfirmDialog'
import * as documentTemplatesService from '@/services/document-templates.service'
import { useDocumentTemplates } from '@/hooks/useDocumentTemplates'
import type { DocumentTemplate, TemplateStatus } from '@/types/document-template'
import { DOCUMENT_TYPE_OPTIONS } from '@/types/document'
import {
  canArchiveTemplate,
  canDuplicateTemplate,
  canEditTemplate,
  canPublishTemplate,
  isPlatformAdmin,
} from '@/utils/template-permissions'
import { ApiError } from '@/types/api'

type ScopeTab = 'all' | 'system' | 'personal'

function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function OrgTemplatesPage() {
  const params = useParams()
  const router = useRouter()
  const orgId = (params?.orgId as string) ?? ''
  const { profile } = useAuth()
  const userId = profile?.user_id
  const isAdmin = isPlatformAdmin(profile?.role)

  const { templates, loading, loadTemplates } = useDocumentTemplates(orgId || null)
  const [scopeTab, setScopeTab] = useState<ScopeTab>('all')
  const [search, setSearch] = useState('')
  const [documentType, setDocumentType] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sort, setSort] = useState<'updated_at' | 'title'>('updated_at')
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null)
  const [archiveTarget, setArchiveTarget] = useState<DocumentTemplate | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    void loadTemplates({
      q: search.trim() || undefined,
      scope: scopeTab,
      document_type: documentType || undefined,
      status: (statusFilter as TemplateStatus) || undefined,
      sort,
    })
  }, [orgId, search, scopeTab, documentType, statusFilter, sort, loadTemplates])

  const filteredEmpty = !loading && templates.length === 0

  const emptyMessage = useMemo(() => {
    if (search.trim() || documentType || statusFilter) {
      return 'No templates match your filters.'
    }
    if (scopeTab === 'personal') {
      return 'Create your first template to reuse your favorite document structure.'
    }
    if (scopeTab === 'system') {
      return 'No system templates are available yet.'
    }
    return 'No templates found.'
  }, [search, documentType, statusFilter, scopeTab])

  const handleDuplicate = async (template: DocumentTemplate) => {
    if (!canDuplicateTemplate(template)) return
    setActionLoading(true)
    try {
      const copy = await documentTemplatesService.duplicateTemplate(orgId, template.id)
      toast.success('Template duplicated')
      router.push(ROUTES.org.settingsTemplate(orgId, copy.id))
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'Duplicate failed'
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handleArchive = async () => {
    if (!archiveTarget) return
    setActionLoading(true)
    try {
      await documentTemplatesService.archiveTemplate(orgId, archiveTarget.id)
      toast.success('Template archived')
      setArchiveTarget(null)
      void loadTemplates()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'Archive failed'
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  const handlePublishToggle = async (template: DocumentTemplate) => {
    setActionLoading(true)
    try {
      if (template.is_published && template.status === 'published') {
        await documentTemplatesService.unpublishTemplate(orgId, template.id)
        toast.success('Template unpublished')
      } else {
        await documentTemplatesService.publishTemplate(orgId, template.id)
        toast.success('Template published')
      }
      void loadTemplates()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'Action failed'
      toast.error(msg)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <Box className="max-w-5xl mx-auto">
      <Stack direction="row" justify="between" align="start" className="mb-6 gap-4 flex-wrap">
        <div>
          <Typography as="h1" size="2xl" weight="semibold">
            Templates
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1 max-w-2xl">
            Create reusable document structures for project notes, meetings, decisions, research, and summaries.
          </Typography>
        </div>
        <Button variant="primary" onClick={() => router.push(ROUTES.org.settingsTemplateNew(orgId))}>
          New template
        </Button>
      </Stack>

      <Box
        padding="lg"
        background="white"
        radius="lg"
        shadow="sm"
        className="border border-neutral-200 space-y-4"
      >
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Template scope">
          {(['all', 'system', 'personal'] as ScopeTab[]).map((tab) => (
            <Button
              key={tab}
              variant={scopeTab === tab ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setScopeTab(tab)}
            >
              {tab === 'all' ? 'All' : tab === 'system' ? 'System' : 'My templates'}
            </Button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Title, description, content…"
            fullWidth
          />
          <div>
            <Typography variant="small" weight="medium" className="mb-1 block">
              Document type
            </Typography>
            <Select
              value={documentType}
              onValueChange={setDocumentType}
              options={[{ value: '', label: 'All types' }, ...DOCUMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))]}
            />
          </div>
          <div>
            <Typography variant="small" weight="medium" className="mb-1 block">
              Status
            </Typography>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={[
                { value: '', label: 'Active (default)' },
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
          </div>
          <div>
            <Typography variant="small" weight="medium" className="mb-1 block">
              Sort
            </Typography>
            <Select
              value={sort}
              onValueChange={(v: string) => setSort(v as 'updated_at' | 'title')}
              options={[
                { value: 'updated_at', label: 'Recently updated' },
                { value: 'title', label: 'Title A–Z' },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <ContentLoader variant="easeOut" className="w-20" />
          </div>
        ) : filteredEmpty ? (
          <Box
            padding="lg"
            className="border border-dashed border-neutral-300 rounded-lg bg-neutral-50 text-center"
          >
            <Typography tone="muted">{emptyMessage}</Typography>
          </Box>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => {
              const editable = canEditTemplate(template, userId, isAdmin)
              const publishable = canPublishTemplate(template, userId, isAdmin)
              const archivable = canArchiveTemplate(template, userId, isAdmin)

              return (
                <Box
                  key={template.id}
                  padding="md"
                  className="border border-neutral-200 rounded-lg hover:border-neutral-300 transition-colors"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <Typography weight="semibold">{template.title}</Typography>
                      {template.description && (
                        <Typography variant="small" tone="muted" className="mt-1 line-clamp-2">
                          {template.description}
                        </Typography>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <TemplateScopeBadge scope={template.scope} />
                        <TemplateStatusBadge
                          status={template.status}
                          isPublished={template.is_published}
                        />
                        <DocumentTypeBadge type={template.document_type} />
                        <TemplateCategoryBadge category={template.category} />
                      </div>
                      <Typography variant="small" tone="muted" className="mt-2">
                        Updated {formatUpdatedAt(template.updated_at)}
                      </Typography>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate(template)}>
                        Preview
                      </Button>
                      {editable && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(ROUTES.org.settingsTemplate(orgId, template.id))}
                        >
                          Edit
                        </Button>
                      )}
                      {canDuplicateTemplate(template) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={actionLoading}
                          onClick={() => void handleDuplicate(template)}
                        >
                          Duplicate
                        </Button>
                      )}
                      {publishable && template.status !== 'archived' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={actionLoading}
                          onClick={() => void handlePublishToggle(template)}
                        >
                          {template.is_published && template.status === 'published'
                            ? 'Unpublish'
                            : 'Publish'}
                        </Button>
                      )}
                      {archivable && template.status !== 'archived' && (
                        <Button variant="ghost" size="sm" onClick={() => setArchiveTarget(template)}>
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                </Box>
              )
            })}
          </div>
        )}
      </Box>

      <TemplatePreviewDialog
        template={previewTemplate}
        open={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        orgId={orgId}
      />

      <ConfirmDialog
        open={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => void handleArchive()}
        title="Archive template"
        message={`Archive "${archiveTarget?.title}"? It will be hidden from the template picker.`}
        confirmLabel="Archive"
        loading={actionLoading}
      />
    </Box>
  )
}
