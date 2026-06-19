'use client'

import { useMemo } from 'react'
import { useParams } from 'next/navigation'
import { ContentLoader, Typography } from '@/shared/ui'
import { DocumentHubView } from '@/modules/documents'
import { useOrg } from '@/modules/org'
import { useEffectivePermissions } from '@/modules/permissions'
import { buildDocumentSpacePermissions } from '@/utils/permissions'

export default function DocumentHubPage() {
  const params = useParams()
  const orgId = params.orgId as string

  const { org, loading: orgLoading } = useOrg(orgId)
  const { permissions, loading: permsLoading } = useEffectivePermissions(orgId)

  const loading = orgLoading || permsLoading

  const docPerms = useMemo(() => {
    const fallback = org ? org.my_role !== 'partner' : false
    return buildDocumentSpacePermissions(permissions, fallback)
  }, [org, permissions])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
    )
  }

  if (!docPerms.canViewDocumentHub) {
    return (
      <Typography tone="error" className="py-8 text-center">
        You do not have permission to view Document Hub.
      </Typography>
    )
  }

  return (
    <DocumentHubView
      orgId={orgId}
      canCreateDocument={docPerms.canCreateDocument}
      canCreateFromTemplate={docPerms.canCreateFromTemplate}
      canRestoreDocument={docPerms.canArchiveDocument}
      canExportDocuments={docPerms.canExportDocuments}
    />
  )
}
