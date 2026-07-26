'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ExternalLink, Search } from 'lucide-react'
import { Typography, Badge, Button, Input, PageSkeleton, Stack } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
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
import {
  getFunctionalItem,
  getNonFunctionalItem,
} from '@/modules/projects/traceability/api/functional-catalog.api'
import { getScopeItem } from '@/modules/projects/scope/infrastructure/api/scope.api'
import type { FunctionalItem, NonFunctionalItem } from '@/modules/projects/traceability/model/functional-catalog'
import type { ScopeItem } from '@/modules/projects/scope/domain/model/scope'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/utils/cn'
import type { Requirement } from '../model/requirements'
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
  const orgId = params.workspaceId as string
  const projectId = params.projectId as string

  const { project, loading: projectLoading } = useProject(orgId, projectId)
  const { org, loading: orgLoading } = useOrg(orgId)
  const { permissions, loading: permsLoading } = useEffectivePermissions(orgId, projectId)
  const { requirements, loading: reqLoading, createRequirement, refetch } = useRequirements(
    orgId,
    projectId
  )

  const loading = projectLoading || orgLoading || permsLoading || reqLoading
  const [selectedId, setSelectedId] = useState<string | null>(null)
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

  const withEvidenceCount = useMemo(
    () => requirements.filter((r) => (evidenceCounts[r.id] ?? 0) > 0).length,
    [requirements, evidenceCounts]
  )
  const missingEvidenceCount = requirements.length - withEvidenceCount

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
    return <PageSkeleton variant="list" />
  }

  const selectedEvidenceCount = selected ? evidenceCounts[selected.id] ?? 0 : 0

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={orgId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Requirement Evidence"
        className="mb-2"
      />

      <div className="mb-6 border-b border-neutral-200 pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Typography as="h1" size="lg" weight="semibold">
              Requirement Evidence
            </Typography>
            <Typography variant="small" tone="muted" className="mt-1">
              Review project requirements and manage supporting documents.
            </Typography>
          </div>
          <Stack direction="horizontal" spacing="sm" className="flex-wrap items-center">
            <Button
              as={Link}
              href={catalogHref}
              size="sm"
              variant="neutral-flat"
              icon={<ExternalLink size={14} />}
            >
              Open Functional Catalog
            </Button>
            {canCreateRequirement ? (
              <RequirementAddBar
                onCreate={async (body, opts) => {
                  try {
                    const created = await createRequirement(body, opts)
                    if (!opts?.quiet) toast.success('Requirement created')
                    return created
                  } catch (err) {
                    toast.error(getProblemToastMessage(err))
                    throw err
                  }
                }}
                onBatchComplete={async () => {
                  await refetch()
                  toast.success('Requirements created')
                }}
                onCreated={(id) => {
                  if (id) setSelectedId(id)
                }}
              />
            ) : null}
          </Stack>
        </div>

        {requirements.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <SummaryChip
              label="Requirements"
              value={requirements.length}
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            />
            <SummaryChip
              label="With evidence"
              value={withEvidenceCount}
              active={filter === 'with'}
              onClick={() => setFilter('with')}
            />
            <SummaryChip
              label="Missing evidence"
              value={missingEvidenceCount}
              active={filter === 'missing'}
              onClick={() => setFilter('missing')}
            />
          </div>
        ) : null}
      </div>

      {requirements.length === 0 ? (
        <div className="border border-neutral-200 bg-white px-6 py-16 text-center">
          <Typography weight="semibold" className="mb-2">
            No requirements found
          </Typography>
          <Typography variant="small" tone="muted" className="mx-auto mb-6 max-w-md">
            Create a project requirement here, or manage FR/NFR catalog items in Functional Catalog.
            After a requirement exists, you can link supporting documents as evidence.
          </Typography>
          <Stack direction="horizontal" spacing="sm" className="justify-center flex-wrap items-center">
            {canCreateRequirement ? (
              <RequirementAddBar
                onCreate={async (body, opts) => {
                  try {
                    const created = await createRequirement(body, opts)
                    if (!opts?.quiet) toast.success('Requirement created')
                    return created
                  } catch (err) {
                    toast.error(getProblemToastMessage(err))
                    throw err
                  }
                }}
                onBatchComplete={async () => {
                  await refetch()
                  toast.success('Requirements created')
                }}
                onCreated={(id) => {
                  if (id) setSelectedId(id)
                }}
              />
            ) : null}
            <Button
              as={Link}
              href={catalogHref}
              size="sm"
              variant="neutral-flat"
              icon={<ExternalLink size={14} />}
            >
              Open Functional Catalog
            </Button>
          </Stack>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_minmax(0,1fr)]">
          <aside className="border border-neutral-200 bg-white">
            <div className="space-y-3 border-b border-neutral-100 p-3">
              <Typography weight="semibold" variant="small">
                Requirements
              </Typography>
              <Input
                fullWidth
                size="sm"
                placeholder="Search requirements…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                prefix={<Search size={14} className="text-neutral-400" />}
              />
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'with', label: 'With evidence' },
                    { id: 'missing', label: 'Missing evidence' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={cn(
                      'px-2.5 py-1 text-xs transition-colors',
                      filter === f.id
                        ? 'bg-neutral-900 text-white'
                        : 'border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <ul className="max-h-[560px] overflow-auto">
              {filtered.length === 0 ? (
                <li className="p-4">
                  <Typography variant="small" tone="muted">
                    No requirements match this filter.
                  </Typography>
                </li>
              ) : (
                filtered.map((r) => {
                  const count = evidenceCounts[r.id] ?? 0
                  const type = reqTypeLabel(r.req_type ?? r.type)
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(r.id)}
                        className={cn(
                          'w-full border-b border-neutral-50 px-4 py-3 text-left hover:bg-neutral-50',
                          selectedId === r.id && 'bg-neutral-100'
                        )}
                      >
                        <Typography weight="medium" className="truncate">
                          {r.code}
                        </Typography>
                        <Typography variant="small" tone="muted" className="truncate">
                          {r.title}
                        </Typography>
                        <Typography variant="small" className="mt-1 text-neutral-500">
                          {type}
                          {' · '}
                          {count > 0 ? (
                            <span>
                              {count} document{count === 1 ? '' : 's'}
                            </span>
                          ) : (
                            <span className="inline-block bg-orange-600 px-1.5 py-0.5 text-[11px] font-medium text-white">
                              Missing evidence
                            </span>
                          )}
                        </Typography>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </aside>

          <main className="min-w-0 space-y-4">
            {!selected ? (
              <div className="border border-neutral-200 bg-white px-6 py-12 text-center">
                <Typography weight="medium" className="mb-1">
                  Select a requirement
                </Typography>
                <Typography variant="small" tone="muted">
                  Choose a requirement from the list to review its catalog links and supporting
                  documents.
                </Typography>
              </div>
            ) : (
              <>
                <section className="border border-neutral-200 bg-white p-5">
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Stack direction="horizontal" spacing="sm" className="mb-1 flex-wrap items-center">
                        <Typography as="h2" size="lg" weight="semibold">
                          {selected.code}
                        </Typography>
                        <Badge variant="soft" tone="neutral">
                          {reqTypeLabel(selected.req_type ?? selected.type)}
                        </Badge>
                      </Stack>
                      <Typography weight="medium">{selected.title}</Typography>
                    </div>
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
                  </div>

                  {selected.description ? (
                    <Typography tone="muted" className="mb-4 whitespace-pre-wrap">
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
                    <MetaRow label="Updated" value={formatDate(selected.updated_at ?? selected.created_at)} />
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
                </section>

                <CatalogLinksSection
                  selected={selected}
                  functionalItem={resolvedFunctionalItem}
                  nfr={resolvedNfr}
                  scopeItem={resolvedScopeItem}
                  catalogHref={catalogHref}
                  scopeHref={ROUTES.workspace.projectScope(orgId, projectId)}
                />

                {!linkPerms.canView ? (
                  <div className="border border-neutral-200 bg-neutral-50 px-4 py-3">
                    <Typography variant="small" tone="muted">
                      You don’t have permission to view evidence documents for this requirement.
                    </Typography>
                  </div>
                ) : (
                  <>
                    {!linkPerms.canCreate && !linkPerms.canRemove ? (
                      <div className="border border-neutral-200 bg-neutral-50 px-4 py-3">
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
                        <Link href={documentHubHref} className="underline hover:text-neutral-900">
                          Open Document Hub
                        </Link>
                      </Typography>
                    ) : null}
                  </>
                )}
              </>
            )}
          </main>
        </div>
      )}
    </div>
  )
}

function SummaryChip({
  label,
  value,
  active,
  onClick,
}: {
  label: string
  value: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'border px-3 py-1.5 text-left text-sm transition-colors',
        active
          ? 'border-success bg-success text-white'
          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
      )}
    >
      <span className={cn('block text-xs', active ? 'text-white/80' : 'text-neutral-500')}>
        {label}
      </span>
      <span className="font-semibold">{value}</span>
    </button>
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
    <section className="border border-neutral-200 bg-white p-5">
      <Typography weight="semibold" className="mb-3">
        Catalog links
      </Typography>
      <ul className="space-y-3">
        {hasFR ? (
          <CatalogLinkRow
            label="Functional item"
            title={
              functionalItem
                ? `${functionalItem.code} · ${functionalItem.title}`
                : 'Loading…'
            }
            href={catalogHref}
          />
        ) : null}
        {hasNFR ? (
          <CatalogLinkRow
            label="Non-functional requirement"
            title={nfr ? `${nfr.code} · ${nfr.title}` : 'Loading…'}
            href={catalogHref}
          />
        ) : null}
        {hasScope ? (
          <CatalogLinkRow
            label="Scope"
            title={scopeItem?.title ?? 'Loading…'}
            href={scopeHref}
          />
        ) : null}
      </ul>
    </section>
  )
}

function CatalogLinkRow({
  label,
  title,
  href,
}: {
  label: string
  title: string
  href: string
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 border border-neutral-100 px-3 py-2.5">
      <div className="min-w-0">
        <Typography variant="small" tone="muted">
          {label}
        </Typography>
        <Typography variant="small" weight="medium">
          {title}
        </Typography>
      </div>
      {href ? (
        <Button as={Link} href={href} size="sm" variant="neutral-flat" icon={<ExternalLink size={12} />}>
          Open
        </Button>
      ) : null}
    </li>
  )
}
