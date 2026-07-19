'use client'

import { useParams } from 'next/navigation'
import { Typography, PageSkeleton } from '@/shared/ui'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { TemplateEditor } from '@/modules/documents'
import { ROUTES } from '@/constants/routes'
import { useDocumentTemplateDetail } from '@/modules/documents'

export function OrgTemplateDetailPageView() {
  const params = useParams()
  const orgId = (params?.workspaceId as string) ?? ''
  const templateId = (params?.templateId as string) ?? ''
  const { profile } = useAuth()

  const {
    template,
    loading,
    refetch: refetchTemplate,
  } = useDocumentTemplateDetail(orgId || null, templateId || null)

  if (loading) {
    return (
      <PageSkeleton variant="detail" />
    )
  }

  if (!template) {
    return <Typography tone="error">Template not found</Typography>
  }

  return (
    <div className="mx-auto max-w-5xl">
      <TemplateEditor
        orgId={orgId}
        template={template}
        mode="edit"
        userId={profile?.user_id}
        userRole={profile?.role}
        backHref={ROUTES.workspace.settingsTemplates(orgId)}
        onSaved={() => {
          void refetchTemplate()
        }}
      />
    </div>
  )
}
