'use client'

import { useParams } from 'next/navigation'
import { ContentLoader, Typography } from '@/shared/ui'
import { useAuth } from '@/contexts/AuthContext'
import { TemplateEditor } from '@/shared/components/document-templates/TemplateEditor'
import { ROUTES } from '@/constants/routes'
import { useDocumentTemplateDetail } from '@/hooks/useDocumentTemplates'

export default function EditTemplatePage() {
  const params = useParams()
  const orgId = (params?.orgId as string) ?? ''
  const templateId = (params?.templateId as string) ?? ''
  const { profile } = useAuth()

  const { template, loading, refetch: refetchTemplate } = useDocumentTemplateDetail(orgId || null, templateId || null)

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
    )
  }

  if (!template) {
    return <Typography tone="error">Template not found</Typography>
  }

  return (
    <div className="max-w-5xl mx-auto">
      <TemplateEditor
        orgId={orgId}
        template={template}
        mode="edit"
        userId={profile?.user_id}
        userRole={profile?.role}
        backHref={ROUTES.org.settingsTemplates(orgId)}
        onSaved={() => { void refetchTemplate() }}
      />
    </div>
  )
}
