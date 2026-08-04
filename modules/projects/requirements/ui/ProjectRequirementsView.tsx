'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ExternalLink, Pencil, Search, SquareArrowOutUpRight, Trash2 } from 'lucide-react'
import {
  Typography,
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  DataTable,
  PageSkeleton,
} from '@/shared/ui'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { documentLinksApi } from '@/modules/documents'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import { useRequirements } from '@/modules/projects/requirements/hooks/useRequirements'
import { useOrg } from '@/modules/org/org/hooks/useOrg'
import { useEffectivePermissions } from '@/modules/permissions/access/hooks/useEffectivePermissions'
import {
  buildDocumentSpacePermissions,
  resolveProjectRole,
  canManageProjectContentFallback,
} from '@/modules/permissions/access/lib/permissions'
import { EntityEvidenceDocumentsPanel } from '@/modules/documents'
import { NfrSpecificationPanel } from '@/modules/quality'
import {
  getFunctionalItem,
  getNonFunctionalItem,
} from '@/modules/projects/traceability/api/functional-catalog.api'
import { getScopeItem } from '@/modules/projects/scope/infrastructure/api/scope.api'
import type {
  FunctionalItem,
  NonFunctionalItem,
} from '@/modules/projects/traceability/model/functional-catalog'
import type { ScopeItem } from '@/modules/projects/scope/domain/model/scope'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import type { CreateRequirementPayload, Requirement } from '../model/requirements'
import { getRequirement } from '../api/requirements.api'
import {
  canArchiveRequirement,
  RequirementDeleteMessages,
} from '../model/requirement-delete.rules'
import {
  requirementPriorityBadgeProps,
  requirementPriorityLabel,
} from '../model/requirement-priority'
import {
  normalizeRequirementStatus,
  RequirementStatus,
  requirementStatusBadgeProps,
  requirementStatusLabel,
} from '../model/requirement-status'
import { EditRequirementModal, type EditRequirementSubmit } from './EditRequirementModal'
import { RequirementAddBar } from './RequirementAddBar'
import { SpecPacksView } from './SpecPacksView'

type ListFilter = 'all' | 'with' | 'missing' | 'archived'
type RequirementsMainTab = 'catalog' | 'spec-packs'

function isArchivedRequirement(r: { status?: string | null }): boolean {
  return normalizeRequirementStatus(r.status) === RequirementStatus.Archived
}

function reqTypeLabel(type: string | null | undefined): string {
  switch ((type ?? '').toUpperCase()) {
    case 'FR':
    case 'FUNCTIONAL':
      return 'Functional'
    case 'NFR':
    case 'NON_FUNCTIONAL':
      return 'Non-functional'
    case 'BO':
    case 'BUSINESS':
      return 'Business'
    case 'BR':
      return 'Business rule'
    case 'TECHNICAL':
      return 'Technical'
    case 'CONSTRAINT':
      return 'Constraint'
    default:
      return type || 'Requirement'
  }
}


function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function RequirementStatusBadge({ status }: { status: string | null | undefined }) {
  const badge = requirementStatusBadgeProps(status)
  return (
    <Badge variant={badge.variant} tone={badge.tone} className={badge.className}>
      {requirementStatusLabel(status)}
    </Badge>
  )
}

function RequirementPriorityBadge({ priority }: { priority: string | null | undefined }) {
  const label = requirementPriorityLabel(priority)
  if (label === '—') {
    return (
      <Typography as="span" size="xs" tone="muted">
        —
      </Typography>
    )
  }
  const badge = requirementPriorityBadgeProps(priority)
  return (
    <Badge variant={badge.variant} tone={badge.tone} className={badge.className}>
      {label}
    </Badge>
  )
}

export function ProjectRequirementsView() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = params.workspaceId as string
  const projectId = params.projectId as string

  const { project, loading: projectLoading } = useProject(orgId, projectId)
  const { org, loading: orgLoading } = useOrg(orgId)
  const { permissions, loading: permsLoading } = useEffectivePermissions(orgId, projectId)
  const {
    requirements,
    loading: reqLoading,
    createRequirement,
    updateRequirement,
    submitRequirementsBulk,
    archiveRequirement,
    transitionRequirementStatus,
    refetch,
  } = useRequirements(orgId, projectId)

  const loading = projectLoading || orgLoading || permsLoading || reqLoading
  const [selectedId, setSelectedId] = useState<string | null>(
    () => searchParams.get('requirementId')
  )
  const [evidenceCounts, setEvidenceCounts] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ListFilter>('all')
  const [approvedOnly, setApprovedOnly] = useState(false)
  const [mainTab, setMainTab] = useState<RequirementsMainTab>('catalog')
  const [resolvedFunctionalItem, setResolvedFunctionalItem] = useState<FunctionalItem | null>(null)
  const [resolvedNfr, setResolvedNfr] = useState<NonFunctionalItem | null>(null)
  const [resolvedScopeItem, setResolvedScopeItem] = useState<ScopeItem | null>(null)
  const [detailDescription, setDetailDescription] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const catalogHref = ROUTES.workspace.projectFunctionalCatalog(orgId, projectId)
  const documentHubHref = ROUTES.workspace.projectDocuments(orgId, projectId)

  const linkPerms = useMemo(() => {
    if (!project)
      return {
        canView: true,
        canCreate: false,
        canRemove: false,
        canRestoreDocument: false,
        canExport: false,
        canCreateDeliverable: false,
      }
    const fallback = canManageProjectContentFallback(
      org?.my_role ?? 'member',
      resolveProjectRole(project.my_role)
    )
    const docPerms = buildDocumentSpacePermissions(permissions, fallback)
    return {
      canView: docPerms.canViewDocumentLinks,
      canCreate: docPerms.canCreateDocumentLinks,
      canRemove: docPerms.canDeleteDocumentLinks,
      canRestoreDocument: docPerms.canArchiveDocument,
      canExport: docPerms.canExportDocuments,
      canCreateDeliverable: docPerms.canCreateDocument && docPerms.canCreateFromTemplate,
    }
  }, [project, org, permissions])

  const canManageRequirements = useMemo(() => {
    if (!project) return false
    return canManageProjectContentFallback(
      org?.my_role ?? 'member',
      resolveProjectRole(project.my_role)
    )
  }, [project, org])
  const canCreateRequirement = canManageRequirements

  useEffect(() => {
    if (requirements.length === 0) {
      setEvidenceCounts({})
      return
    }
    const ids = requirements.map((r) => r.id)
    let cancelled = false
    documentLinksApi
      .getEntityLinkCounts(orgId, {
        linked_entity_type: 'requirement',
        project_id: projectId,
        linked_entity_ids: ids,
      })
      .then((res) => {
        if (!cancelled) setEvidenceCounts(res.counts)
      })
      .catch(() => {
        if (!cancelled) setEvidenceCounts({})
      })
    return () => {
      cancelled = true
    }
  }, [orgId, projectId, requirements])

  const refreshEvidenceCounts = useCallback(() => {
    if (requirements.length === 0) {
      setEvidenceCounts({})
      return
    }
    const ids = requirements.map((r) => r.id)
    documentLinksApi
      .getEntityLinkCounts(orgId, {
        linked_entity_type: 'requirement',
        project_id: projectId,
        linked_entity_ids: ids,
      })
      .then((res) => setEvidenceCounts(res.counts))
      .catch(() => setEvidenceCounts({}))
  }, [orgId, projectId, requirements])

  const activeRequirements = useMemo(
    () => requirements.filter((r) => !isArchivedRequirement(r)),
    [requirements]
  )
  const archivedRequirements = useMemo(
    () => requirements.filter((r) => isArchivedRequirement(r)),
    [requirements]
  )

  const missingEvidenceCount = useMemo(
    () => activeRequirements.filter((r) => (evidenceCounts[r.id] ?? 0) === 0).length,
    [activeRequirements, evidenceCounts]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const pool = filter === 'archived' ? archivedRequirements : activeRequirements
    return pool.filter((r) => {
      if (filter !== 'archived') {
        const count = evidenceCounts[r.id] ?? 0
        if (filter === 'with' && count === 0) return false
        if (filter === 'missing' && count > 0) return false
        if (
          approvedOnly &&
          normalizeRequirementStatus(r.status) !== RequirementStatus.Approved
        ) {
          return false
        }
      }
      if (!q) return true
      const hay = `${r.code} ${r.title} ${r.req_type ?? r.type ?? ''} ${r.status ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [
    activeRequirements,
    archivedRequirements,
    evidenceCounts,
    filter,
    search,
    approvedOnly,
  ])

  useEffect(() => {
    const fromQuery = searchParams.get('requirementId')
    if (fromQuery) setSelectedId(fromQuery)
  }, [searchParams])

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !filtered.some((r) => r.id === selectedId)) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  const selected = requirements.find((r) => r.id === selectedId) ?? null

  useEffect(() => {
    setConfirmDelete(false)
    setEditOpen(false)
    setResolvedFunctionalItem(null)
    setResolvedNfr(null)
    setResolvedScopeItem(null)
    setDetailDescription(null)
    if (!selected) return

    setDetailDescription(selected.description ?? null)

    let cancelled = false
    void getRequirement(orgId, projectId, selected.id)
      .then((full) => {
        if (cancelled) return
        if (full.description != null) {
          setDetailDescription(full.description)
        }
      })
      .catch(() => undefined)

    if (selected.functionalItemId) {
      getFunctionalItem(projectId, selected.functionalItemId)
        .then(setResolvedFunctionalItem)
        .catch(() => setResolvedFunctionalItem(null))
    }
    if (selected.nonFunctionalItemId) {
      getNonFunctionalItem(projectId, selected.nonFunctionalItemId)
        .then(setResolvedNfr)
        .catch(() => setResolvedNfr(null))
    }
    if (selected.scopeItemId) {
      getScopeItem(projectId, selected.scopeItemId)
        .then(setResolvedScopeItem)
        .catch(() => setResolvedScopeItem(null))
    }

    return () => {
      cancelled = true
    }
  }, [
    orgId,
    projectId,
    selected?.id,
    selected?.description,
    selected?.functionalItemId,
    selected?.nonFunctionalItemId,
    selected?.scopeItemId,
  ])

  if (loading) {
    return <PageSkeleton variant="list" className="h-full p-4" />
  }

  const selectedEvidenceCount = selected ? (evidenceCounts[selected.id] ?? 0) : 0
  const selectedIsArchived = selected ? isArchivedRequirement(selected) : false
  const metaBits = [
    project?.name,
    activeRequirements.length
      ? `${activeRequirements.length} requirement${activeRequirements.length === 1 ? '' : 's'}`
      : null,
    missingEvidenceCount ? `${missingEvidenceCount} missing evidence` : null,
    archivedRequirements.length
      ? `${archivedRequirements.length} archived`
      : null,
  ].filter(Boolean)

  const createHandlers = {
    onCreate: async (body: CreateRequirementPayload, opts?: { quiet?: boolean }) => {
      try {
        const created = await createRequirement(body, opts)
        if (!opts?.quiet) toast.success('Requirement created')
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    onSubmitBulk: submitRequirementsBulk,
    onBatchComplete: async () => {
      await refetch()
    },
    onCreated: (id: string | null) => {
      if (id) setSelectedId(id)
    },
  }

  const handleSaveEdit = async (body: EditRequirementSubmit) => {
    if (!selected) return
    const { status: nextStatus, contentLocked, ...patch } = body
    try {
      const currentStatus = normalizeRequirementStatus(selected.status)
      const normalizedNext = nextStatus ? normalizeRequirementStatus(nextStatus) : null

      // Approved bodies are immutable — skip PATCH. Otherwise include current
      // status so BE validators that require `status` on PATCH succeed.
      if (!contentLocked) {
        await updateRequirement(selected.id, {
          ...patch,
          status: currentStatus,
        })
      }

      if (normalizedNext && normalizedNext !== currentStatus) {
        if (normalizedNext === RequirementStatus.Archived) {
          await archiveRequirement(selected.id)
        } else {
          await transitionRequirementStatus(selected.id, normalizedNext)
        }
        if (
          currentStatus === RequirementStatus.Archived &&
          normalizedNext !== RequirementStatus.Archived
        ) {
          setFilter('all')
        }
      }
      toast.success(contentLocked ? 'Status updated' : 'Requirement updated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      throw err
    }
  }

  const handleRequestDelete = () => {
    if (!selected || !canManageRequirements) return
    if (!canArchiveRequirement(selected)) {
      toast.error(RequirementDeleteMessages.LINKED_TO_FUNCTION)
      return
    }
    setConfirmDelete(true)
  }

  const handleConfirmDelete = async () => {
    if (!selected) return
    if (!canArchiveRequirement(selected)) {
      toast.error(RequirementDeleteMessages.LINKED_TO_FUNCTION)
      setConfirmDelete(false)
      return
    }
    setDeleting(true)
    try {
      await archiveRequirement(selected.id)
      toast.success('Requirement archived')
      setConfirmDelete(false)
      setSelectedId(null)
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.problem.detail || err.message)
      } else {
        toast.error(getProblemToastMessage(err))
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white px-3 py-3 lg:px-4 lg:py-3">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1400px] flex-1 flex-col overflow-hidden">
        <header className="shrink-0">
          <Link
            href={ROUTES.workspace.project(orgId, projectId)}
            className="text-xs text-neutral-500 hover:text-neutral-800"
          >
            ← Project
          </Link>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-200 pb-2">
            <div className="min-w-0">
              <Typography as="h1" size="md" weight="medium" className="truncate">
                Requirements
              </Typography>
              <Typography variant="caption" tone="muted" className="mt-0.5">
                {metaBits.join(' · ') || 'Review requirements and supporting evidence'}
              </Typography>
            </div>
            <Button
              as={Link}
              href={`${catalogHref}?tab=map`}
              size="sm"
              variant="outline"
              icon={<SquareArrowOutUpRight size={14} />}
            >
              Requirement → Function
            </Button>
          </div>
          <div className="mt-2 flex gap-0.5">
            {(
              [
                { id: 'catalog', label: 'Catalog' },
                { id: 'spec-packs', label: 'Spec Packs' },
              ] as const
            ).map((tab) => {
              const active = mainTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMainTab(tab.id)}
                  className={cn(
                    'border-b-2 px-3 py-1.5 text-sm transition-colors',
                    active
                      ? 'border-neutral-900 text-neutral-900'
                      : 'border-transparent text-neutral-500 hover:text-neutral-800'
                  )}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </header>

        <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden">
          {mainTab === 'spec-packs' ? (
            <SpecPacksView
              workspaceId={orgId}
              projectId={projectId}
              requirements={activeRequirements}
              canCreate={canCreateRequirement}
            />
          ) : (
          <div className="grid h-full min-h-0 grid-cols-1 overflow-hidden border border-neutral-300 bg-white lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
            <div className="flex min-h-0 min-w-0 flex-col overflow-hidden border-b border-neutral-200 lg:border-b-0 lg:border-r">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-100 px-3 py-2">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                  <div className="flex w-48 items-center gap-1.5 border border-neutral-200 bg-white px-2 py-1.5">
                    <Search size={13} className="shrink-0 text-neutral-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search requirements…"
                      className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
                    />
                  </div>
                  <div className="flex flex-wrap gap-0.5">
                    {(
                      [
                        { id: 'all', label: 'All' },
                        { id: 'with', label: 'With evidence' },
                        { id: 'missing', label: 'Missing' },
                        {
                          id: 'archived',
                          label:
                            archivedRequirements.length > 0
                              ? `Archived (${archivedRequirements.length})`
                              : 'Archived',
                        },
                      ] as const
                    ).map((f) => {
                      const active = filter === f.id
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setFilter(f.id)}
                          className={cn(
                            'border-b-2 px-2 py-1 text-xs transition-colors',
                            active
                              ? 'border-primary text-primary'
                              : 'border-transparent text-neutral-500 hover:text-neutral-800'
                          )}
                        >
                          {f.label}
                        </button>
                      )
                    })}
                  </div>
                  {filter !== 'archived' ? (
                    <Checkbox
                      size="sm"
                      checked={approvedOnly}
                      onChange={(e) => setApprovedOnly(e.target.checked)}
                      label="Approved only"
                    />
                  ) : null}
                </div>
                {canCreateRequirement && filter !== 'archived' ? (
                  <RequirementAddBar {...createHandlers} />
                ) : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                {filter === 'archived' && archivedRequirements.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
                    <Typography weight="medium">No archived requirements</Typography>
                    <Typography variant="small" tone="muted" className="mt-1 max-w-sm">
                      Archived items appear here. Open Edit on one to change its status and restore
                      it to the active register.
                    </Typography>
                  </div>
                ) : activeRequirements.length === 0 && filter !== 'archived' ? (
                  <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
                    <Typography weight="medium">No requirements yet</Typography>
                    <Typography variant="small" tone="muted" className="mt-1 max-w-sm">
                      Use Add requirement above to create one, or manage FR/NFR catalog items in
                      Functional Catalog.
                    </Typography>
                  </div>
                ) : filtered.length === 0 ? (
                  <Typography tone="muted" className="py-8 text-center" variant="small">
                    No requirements match this filter.
                  </Typography>
                ) : (
                  <DataTable
                    ariaLabel="Requirements"
                    rows={filtered}
                    rowKey={(row) => row.id}
                    selectedRowKey={selectedId}
                    onRowClick={(row) => setSelectedId(row.id)}
                    columns={[
                      {
                        id: 'code',
                        header: 'Code',
                        accessor: 'code',
                        kind: 'code',
                        width: '16%',
                      },
                      {
                        id: 'title',
                        header: 'Title',
                        accessor: 'title',
                        width: '26%',
                      },
                      {
                        id: 'type',
                        header: 'Type',
                        width: '12%',
                        accessor: (row) =>
                          reqTypeLabel(row.requirementType ?? row.req_type ?? row.type),
                        cellClassName: 'text-neutral-500',
                      },
                      {
                        id: 'status',
                        header: 'Status',
                        width: '14%',
                        accessor: (row) => requirementStatusLabel(row.status),
                      },
                      {
                        id: 'priority',
                        header: 'Priority',
                        width: '12%',
                        accessor: (row) => requirementPriorityLabel(row.priority),
                      },
                      {
                        id: 'evidence',
                        header: 'Evidence',
                        width: '16%',
                        cell: (row) => {
                          const count = evidenceCounts[row.id] ?? 0
                          if (count > 0) {
                            return (
                              <Typography as="span" size="xs" className="text-neutral-600">
                                {count} doc{count === 1 ? '' : 's'}
                              </Typography>
                            )
                          }
                          return (
                            <span className="inline-block bg-orange-600 px-1.5 py-0.5 text-[11px] font-medium text-white">
                              Missing
                            </span>
                          )
                        },
                      },
                    ]}
                  />
                )}
              </div>
            </div>

            <aside className="bg-neutral-50/50 flex min-h-0 min-w-0 flex-col overflow-hidden">
              {!selected ? (
                <div className="flex h-full flex-col items-center justify-center px-4 py-8 text-center">
                  <Typography weight="medium">Select a requirement</Typography>
                  <Typography variant="small" tone="muted" className="mt-1 max-w-xs">
                    Choose a requirement from the list to review catalog links and supporting
                    documents.
                  </Typography>
                </div>
              ) : (
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="border-b border-neutral-200 px-5 py-4">
                    <div className="mb-1">
                      <Typography size="xs" tone="muted" className="truncate" title={selected.code}>
                        {selected.code}
                      </Typography>
                    </div>
                    <Typography as="h2" size="sm" weight="semibold" className="break-words">
                      {selected.title}
                    </Typography>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {(selected.functionalItemId || selected.nonFunctionalItemId) && (
                        <Button
                          as={Link}
                          href={catalogHref}
                          size="sm"
                          variant="neutral-flat"
                          icon={<ExternalLink size={14} />}
                        >
                          Open in Functional Catalog
                        </Button>
                      )}
                      {canManageRequirements ? (
                        <>
                          <Button
                            size="sm"
                            variant="neutral-flat"
                            icon={<Pencil size={14} />}
                            onClick={() => setEditOpen(true)}
                          >
                            Edit
                          </Button>
                          {!selectedIsArchived ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              tone="error"
                              icon={<Trash2 size={14} />}
                              onClick={handleRequestDelete}
                              disabled={!canArchiveRequirement(selected)}
                              title={
                                canArchiveRequirement(selected)
                                  ? 'Archive requirement'
                                  : RequirementDeleteMessages.LINKED_TO_FUNCTION
                              }
                            >
                              Archive
                            </Button>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                    {selectedIsArchived ? (
                      <Typography variant="caption" tone="muted" className="mt-2 block">
                        Archived — hidden from the active list. You can still edit, or change status
                        to restore it.
                      </Typography>
                    ) : canManageRequirements && !canArchiveRequirement(selected) ? (
                      <Typography variant="caption" tone="muted" className="mt-2 block">
                        {RequirementDeleteMessages.LINKED_TO_FUNCTION}
                      </Typography>
                    ) : null}
                  </div>

                  <div className="space-y-4 px-5 py-4">
                    <div>
                      <Typography
                        variant="caption"
                        tone="muted"
                        className="mb-1 block uppercase tracking-wide"
                      >
                        Description
                      </Typography>
                      {detailDescription?.trim() ? (
                        <Typography
                          size="sm"
                          className="whitespace-pre-wrap text-neutral-900 [overflow-wrap:anywhere]"
                        >
                          {detailDescription}
                        </Typography>
                      ) : (
                        <Typography variant="small" tone="muted">
                          No description.
                        </Typography>
                      )}
                    </div>

                    <dl className="grid gap-2 border-t border-neutral-100 pt-4 text-sm sm:grid-cols-2">
                      <MetaRow
                        label="Type"
                        value={reqTypeLabel(
                          selected.requirementType ?? selected.req_type ?? selected.type
                        )}
                      />
                      <MetaRow
                        label="Status"
                        value={<RequirementStatusBadge status={selected.status} />}
                      />
                      <MetaRow
                        label="Priority"
                        value={<RequirementPriorityBadge priority={selected.priority} />}
                      />
                      <MetaRow
                        label="Source"
                        value={
                          selected.functionalItemId || selected.nonFunctionalItemId
                            ? 'Functional Catalog'
                            : selected.scopeItemId
                              ? 'Scope'
                              : '—'
                        }
                      />
                      <MetaRow
                        label="Updated"
                        value={formatDate(selected.updated_at ?? selected.created_at)}
                      />
                      <MetaRow
                        label="Evidence"
                        value={
                          selectedEvidenceCount > 0 ? (
                            `${selectedEvidenceCount} document${selectedEvidenceCount === 1 ? '' : 's'}`
                          ) : (
                            <span className="inline-block bg-orange-600 px-1.5 py-0.5 text-xs font-medium text-white">
                              Missing evidence
                            </span>
                          )
                        }
                      />
                    </dl>

                    <CatalogLinksSection
                      selected={selected}
                      functionalItem={resolvedFunctionalItem}
                      nfr={resolvedNfr}
                      scopeItem={resolvedScopeItem}
                      catalogHref={catalogHref}
                      scopeHref={ROUTES.workspace.projectScope(orgId, projectId)}
                    />

                    {(selected.req_type ?? selected.type ?? '').toUpperCase() ===
                    'NON_FUNCTIONAL' ? (
                      <NfrSpecificationPanel projectId={projectId} requirementId={selected.id} />
                    ) : null}

                    {!linkPerms.canView ? (
                      <div className="border border-neutral-200 bg-white px-4 py-3">
                        <Typography variant="small" tone="muted">
                          You don’t have permission to view evidence documents for this requirement.
                        </Typography>
                      </div>
                    ) : (
                      <>
                        {!linkPerms.canCreate && !linkPerms.canRemove ? (
                          <div className="border border-neutral-200 bg-white px-4 py-3">
                            <Typography variant="small" tone="muted">
                              You can view evidence documents but cannot link or remove them.
                            </Typography>
                          </div>
                        ) : null}

                        <EntityEvidenceDocumentsPanel
                          orgId={orgId}
                          projectId={projectId}
                          linkedEntityType="requirement"
                          linkedEntityId={selected.id}
                          canView={linkPerms.canView}
                          canCreateLink={linkPerms.canCreate}
                          canRemoveLink={linkPerms.canRemove}
                          canRestoreDocument={linkPerms.canRestoreDocument}
                          canExport={linkPerms.canExport}
                          canCreateDeliverable={linkPerms.canCreateDeliverable}
                          deliverableType="requirement_brief"
                          title="Evidence documents"
                          linkButtonLabel="Link supporting document"
                          emptyStateText="No supporting documents linked. Link specifications, meeting notes, test reports or other documents that provide evidence for this requirement."
                          onLinksChanged={refreshEvidenceCounts}
                        />

                        {linkPerms.canCreate ? (
                          <Typography variant="small" tone="muted">
                            Need a new document first?{' '}
                            <Link
                              href={documentHubHref}
                              className="underline hover:text-neutral-900"
                            >
                              Open Document Hub
                            </Link>
                          </Typography>
                        ) : null}
                      </>
                    )}
                  </div>
                </div>
              )}
            </aside>
          </div>
          )}
        </div>
      </div>

      <EditRequirementModal
        open={editOpen}
        requirement={selected}
        onClose={() => setEditOpen(false)}
        onSubmit={handleSaveEdit}
      />

      <ConfirmDialog
        open={confirmDelete && Boolean(selected)}
        onClose={() => {
          if (!deleting) setConfirmDelete(false)
        }}
        title="Archive requirement"
        message={
          selected
            ? `Archive "${selected.code} — ${selected.title}"? It will be removed from the active requirements register.`
            : ''
        }
        confirmLabel="Archive"
        variant="danger"
        loading={deleting}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}

function MetaRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-3">
      <dt className="w-24 shrink-0 text-neutral-500">{label}</dt>
      <dd className="min-w-0 text-neutral-900">{value}</dd>
    </div>
  )
}

function CatalogLinksSection({
  selected,
  functionalItem,
  nfr,
  scopeItem,
  catalogHref,
  scopeHref,
}: {
  selected: Requirement
  functionalItem: FunctionalItem | null
  nfr: NonFunctionalItem | null
  scopeItem: ScopeItem | null
  catalogHref: string
  scopeHref: string
}) {
  const hasFR = !!selected.functionalItemId
  const hasNFR = !!selected.nonFunctionalItemId
  const hasScope = !!selected.scopeItemId
  if (!hasFR && !hasNFR && !hasScope) return null

  return (
    <section className="border-t border-neutral-100 pt-4">
      <Typography variant="small" weight="semibold" className="mb-3">
        Catalog links
      </Typography>
      <ul className="space-y-2">
        {hasFR ? (
          <CatalogLinkRow
            label="Functional item"
            code={functionalItem?.code}
            title={functionalItem ? functionalItem.title : 'Loading…'}
            href={catalogHref}
          />
        ) : null}
        {hasNFR ? (
          <CatalogLinkRow
            label="Non-functional requirement"
            code={nfr?.code}
            title={nfr ? nfr.title : 'Loading…'}
            href={catalogHref}
          />
        ) : null}
        {hasScope ? (
          <CatalogLinkRow label="Scope" title={scopeItem?.title ?? 'Loading…'} href={scopeHref} />
        ) : null}
      </ul>
    </section>
  )
}

function CatalogLinkRow({
  label,
  code,
  title,
  href,
}: {
  label: string
  code?: string | null
  title: string
  href: string
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border border-neutral-100 px-3 py-2.5">
      <div className="min-w-0">
        <Typography size="xs" tone="muted">
          {code ? `${label} · ${code}` : label}
        </Typography>
        <Typography variant="small" weight="medium">
          {title}
        </Typography>
      </div>
      {href ? (
        <Button
          as={Link}
          href={href}
          size="sm"
          variant="neutral-flat"
          icon={<ExternalLink size={12} />}
        >
          Open
        </Button>
      ) : null}
    </li>
  )
}
