'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { ExternalLink, Search, SquareArrowOutUpRight } from 'lucide-react'
import { Typography, Badge, Button, DataTable, PageSkeleton } from '@/shared/ui'
import { toast } from 'sonner'
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
import { RequirementAddBar } from './RequirementAddBar'

type EvidenceFilter = 'all' | 'with' | 'missing'

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
    submitRequirementsBulk,
    refetch,
  } = useRequirements(orgId, projectId)

  const loading = projectLoading || orgLoading || permsLoading || reqLoading
  const [selectedId, setSelectedId] = useState<string | null>(
    () => searchParams.get('requirementId')
  )
  const [evidenceCounts, setEvidenceCounts] = useState<Record<string, number>>({})
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<EvidenceFilter>('all')
  const [resolvedFunctionalItem, setResolvedFunctionalItem] = useState<FunctionalItem | null>(null)
  const [resolvedNfr, setResolvedNfr] = useState<NonFunctionalItem | null>(null)
  const [resolvedScopeItem, setResolvedScopeItem] = useState<ScopeItem | null>(null)

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

  const canCreateRequirement = useMemo(() => {
    if (!project) return false
    return canManageProjectContentFallback(
      org?.my_role ?? 'member',
      resolveProjectRole(project.my_role)
    )
  }, [project, org])

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

  const missingEvidenceCount = useMemo(
    () => requirements.filter((r) => (evidenceCounts[r.id] ?? 0) === 0).length,
    [requirements, evidenceCounts]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return requirements.filter((r) => {
      const count = evidenceCounts[r.id] ?? 0
      if (filter === 'with' && count === 0) return false
      if (filter === 'missing' && count > 0) return false
      if (!q) return true
      const hay = `${r.code} ${r.title} ${r.req_type ?? r.type ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [requirements, evidenceCounts, filter, search])

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
    setResolvedFunctionalItem(null)
    setResolvedNfr(null)
    setResolvedScopeItem(null)
    if (!selected) return

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
  }, [
    projectId,
    selected?.id,
    selected?.functionalItemId,
    selected?.nonFunctionalItemId,
    selected?.scopeItemId,
  ])

  if (loading) {
    return <PageSkeleton variant="list" className="h-full p-4" />
  }

  const selectedEvidenceCount = selected ? (evidenceCounts[selected.id] ?? 0) : 0
  const metaBits = [
    project?.name,
    requirements.length
      ? `${requirements.length} requirement${requirements.length === 1 ? '' : 's'}`
      : null,
    missingEvidenceCount ? `${missingEvidenceCount} missing evidence` : null,
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

  return (
    <div className="flex h-full min-h-0 flex-col bg-white px-3 py-3 lg:px-4 lg:py-3">
      <div className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col">
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
        </header>

        <div className="mt-2 min-h-0 flex-1">
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
                </div>
                {canCreateRequirement ? <RequirementAddBar {...createHandlers} /> : null}
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
                {requirements.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center px-4 py-10 text-center">
                    <Typography weight="medium">No requirements yet</Typography>
                    <Typography variant="small" tone="muted" className="mt-1 max-w-sm">
                      Create a project requirement here, or manage FR/NFR catalog items in
                      Functional Catalog.
                    </Typography>
                    {canCreateRequirement ? (
                      <div className="mt-4">
                        <RequirementAddBar {...createHandlers} />
                      </div>
                    ) : null}
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
                        width: '18%',
                      },
                      {
                        id: 'title',
                        header: 'Title',
                        accessor: 'title',
                        width: '42%',
                      },
                      {
                        id: 'type',
                        header: 'Type',
                        width: '20%',
                        accessor: (row) => reqTypeLabel(row.req_type ?? row.type),
                        cellClassName: 'text-neutral-500',
                      },
                      {
                        id: 'evidence',
                        header: 'Evidence',
                        width: '20%',
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
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Typography size="xs" tone="muted" className="truncate" title={selected.code}>
                        {selected.code}
                      </Typography>
                      <Badge variant="soft" tone="neutral">
                        {reqTypeLabel(selected.req_type ?? selected.type)}
                      </Badge>
                    </div>
                    <Typography
                      as="h2"
                      size="sm"
                      weight="semibold"
                      className="truncate"
                      title={selected.title}
                    >
                      {selected.title}
                    </Typography>
                    {(selected.functionalItemId || selected.nonFunctionalItemId) && (
                      <Button
                        as={Link}
                        href={catalogHref}
                        size="sm"
                        variant="neutral-flat"
                        className="mt-2"
                        icon={<ExternalLink size={14} />}
                      >
                        Open in Functional Catalog
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4 px-5 py-4">
                    {selected.description ? (
                      <Typography variant="small" tone="muted" className="whitespace-pre-wrap">
                        {selected.description}
                      </Typography>
                    ) : null}

                    <dl className="grid gap-2 border-t border-neutral-100 pt-4 text-sm sm:grid-cols-2">
                      <MetaRow
                        label="Type"
                        value={reqTypeLabel(selected.req_type ?? selected.type)}
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
        </div>
      </div>
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
