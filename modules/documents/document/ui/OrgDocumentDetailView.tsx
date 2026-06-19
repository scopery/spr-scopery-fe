'use client'

import { useMemo } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { Typography, ContentLoader } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { DocumentEditor, useDocument } from '@/modules/documents'
import { useProject } from '@/modules/projects'
import { useOrg } from '@/modules/org'
import { useEffectivePermissions } from '@/modules/permissions'
import {
  buildCollaborationPermissions,
  buildAIPermissions,
  buildDocumentSpacePermissions,
  canEditDocumentFromPermissions,
  canManageProjectContentFallback,
  resolveProjectRole,
} from '@/modules/permissions'

export function OrgDocumentDetailView() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = params.orgId as string
  const documentId = params.documentId as string
  const projectId = searchParams.get('projectId') ?? undefined

  const { document, loading: docLoading } = useDocument(orgId, documentId)
  const { org, loading: orgLoading } = useOrg(orgId)
  const { project, loading: projectLoading } = useProject(orgId, projectId ?? null)
  const { permissions, loading: permsLoading } = useEffectivePermissions(orgId, projectId)

  const loading = docLoading || orgLoading || (projectId ? projectLoading : false) || permsLoading

  const derivedPerms = useMemo(() => {
    if (projectId && project) {
      const role = resolveProjectRole(project.my_role)
      const fallback = canManageProjectContentFallback(org?.my_role ?? 'member', role)
      const docPerms = buildDocumentSpacePermissions(permissions, fallback)
      return {
        canEdit: canEditDocumentFromPermissions(permissions, fallback),
        canArchive: docPerms.canArchiveDocument,
        canExport: docPerms.canExportDocuments,
        linkPermissions: {
          canView: docPerms.canViewDocumentLinks,
          canCreate: docPerms.canCreateDocumentLinks,
          canDelete: docPerms.canDeleteDocumentLinks,
        },
        collaborationPermissions: buildCollaborationPermissions(permissions, fallback),
        aiPermissions: buildAIPermissions(permissions, fallback),
      }
    }
    const fallback = org ? org.my_role !== 'partner' : true
    const docPerms = buildDocumentSpacePermissions(permissions, fallback)
    return {
      canEdit: canEditDocumentFromPermissions(permissions, fallback),
      canArchive: docPerms.canArchiveDocument,
      canExport: docPerms.canExportDocuments,
      linkPermissions: null,
      collaborationPermissions: buildCollaborationPermissions(permissions, fallback),
      aiPermissions: buildAIPermissions(permissions, fallback),
    }
  }, [org, project, permissions, projectId])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
    )
  }

  if (!document) {
    return <Typography tone="error">Document not found</Typography>
  }

  const backHref = projectId
    ? ROUTES.org.projectDocuments(orgId, projectId)
    : ROUTES.org.projects(orgId)

  return (
    <DocumentEditor
      orgId={orgId}
      projectId={projectId}
      document={document}
      canEdit={derivedPerms.canEdit}
      canArchive={derivedPerms.canArchive}
      canExport={derivedPerms.canExport}
      linkPermissions={derivedPerms.linkPermissions ?? undefined}
      collaborationPermissions={derivedPerms.collaborationPermissions ?? undefined}
      aiPermissions={derivedPerms.aiPermissions ?? undefined}
      backHref={backHref}
    />
  )
}
