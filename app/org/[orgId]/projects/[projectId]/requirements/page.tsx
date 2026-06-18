'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { CircleArrowOutUpLeft } from 'lucide-react'
import { Typography, Badge, ContentLoader } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import * as documentLinksService from '@/services/document-links.service'
import { useProject } from '@/hooks/useProject'
import { useOrg } from '@/hooks/useOrg'
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions'
import { useRequirements } from '@/hooks/useRequirements'
import {
  buildDocumentSpacePermissions,
  canManageProjectContentFallback,
  resolveProjectRole,
} from '@/utils/permissions'
import { EntityEvidenceDocumentsPanel } from '@/shared/components/documents/EntityEvidenceDocumentsPanel'
import { ProjectStepIndicator } from '../_components/ProjectStepIndicator'

export default function RequirementsPage() {
  const params = useParams()
  const orgId = params.orgId as string
  const projectId = params.projectId as string

  const { project, loading: projectLoading } = useProject(orgId, projectId)
  const { org, loading: orgLoading } = useOrg(orgId)
  const { permissions, loading: permsLoading } = useEffectivePermissions(orgId, projectId)
  const { requirements, loading: reqLoading } = useRequirements(orgId, projectId)

  const loading = projectLoading || orgLoading || permsLoading || reqLoading
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [evidenceCounts, setEvidenceCounts] = useState<Record<string, number>>({})

  const linkPerms = useMemo(() => {
    if (!project) return { canView: true, canCreate: false, canRemove: false, canRestoreDocument: false, canExport: false, canCreateDeliverable: false }
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

  useEffect(() => {
    if (requirements.length > 0 && !selectedId) {
      setSelectedId(requirements[0].id)
    }
  }, [requirements, selectedId])

  useEffect(() => {
    if (requirements.length === 0) {
      setEvidenceCounts({})
      return
    }
    const ids = requirements.map((r) => r.id)
    documentLinksService
      .getEntityLinkCounts(orgId, {
        linked_entity_type: 'requirement',
        project_id: projectId,
        linked_entity_ids: ids,
      })
      .then((res) => setEvidenceCounts(res.counts))
      .catch(() => setEvidenceCounts({}))
  }, [orgId, projectId, requirements])

  const selected = requirements.find((r) => r.id === selectedId) ?? null

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <ProjectStepIndicator
        steps={[{ id: 1, label: 'Requirements', active: true }]}
        leftMeta={
          <div className="mb-8">
            <Link
              href={ROUTES.org.project(orgId, projectId)}
              className="text-sm text-primary hover:underline mb-2 block"
            >
              <CircleArrowOutUpLeft size={20} />
            </Link>
            <Typography as="h1" size="xl" weight="bold">
              Requirements
            </Typography>
            <Typography variant="small" tone="muted">
              {project?.name ?? 'Project'} — manage requirement evidence links
            </Typography>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <aside className="border border-neutral-200 bg-white">
          <div className="p-3 border-b border-neutral-100">
            <Typography weight="semibold" variant="small">
              {requirements.length} requirements
            </Typography>
          </div>
          <ul className="max-h-[520px] overflow-auto">
            {requirements.length === 0 ? (
              <li className="p-4">
                <Typography variant="small" tone="muted">
                  No requirements in this project yet.
                </Typography>
              </li>
            ) : (
              requirements.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left px-4 py-3 border-b border-neutral-50 hover:bg-neutral-50 ${
                      selectedId === r.id ? 'bg-neutral-100' : ''
                    }`}
                  >
                    <Typography weight="medium" className="truncate">
                      {r.code}
                    </Typography>
                    <div className="flex items-center gap-2">
                      <Typography variant="small" tone="muted" className="truncate">
                        {r.title}
                      </Typography>
                      {(evidenceCounts[r.id] ?? 0) > 0 && (
                        <Badge variant="soft" tone="info" size="sm">
                          {evidenceCounts[r.id]} evidence
                        </Badge>
                      )}
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </aside>

        <main className="space-y-6">
          {selected ? (
            <>
              <div className="border border-neutral-200 bg-white p-6">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Typography as="h2" size="lg" weight="semibold">
                    {selected.code}
                  </Typography>
                  <Badge variant="soft" tone="neutral" size="sm">
                    {selected.req_type ?? selected.type ?? 'requirement'}
                  </Badge>
                </div>
                <Typography weight="medium" className="mb-2">
                  {selected.title}
                </Typography>
                {selected.description && (
                  <Typography tone="muted">{selected.description}</Typography>
                )}
              </div>

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
                emptyStateText="No evidence documents linked to this requirement yet. Link existing project documents as supporting evidence."
              />
            </>
          ) : (
            <div className="border border-dashed border-neutral-200 p-12 text-center">
              <Typography tone="muted">Select a requirement to view evidence documents.</Typography>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
