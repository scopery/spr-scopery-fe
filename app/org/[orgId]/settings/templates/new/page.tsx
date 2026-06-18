'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { TemplateEditor } from '@/shared/components/document-templates/TemplateEditor'
import { ROUTES } from '@/constants/routes'
import type { DocumentTemplate } from '@/types/document-template'

export default function NewTemplatePage() {
  const params = useParams()
  const router = useRouter()
  const orgId = (params?.orgId as string) ?? ''
  const { profile } = useAuth()

  const handleSaved = (template: DocumentTemplate) => {
    router.replace(ROUTES.org.settingsTemplate(orgId, template.id))
  }

  return (
    <div className="max-w-5xl mx-auto">
      <TemplateEditor
        orgId={orgId}
        mode="create"
        userId={profile?.user_id}
        userRole={profile?.role}
        backHref={ROUTES.org.settingsTemplates(orgId)}
        onSaved={handleSaved}
      />
    </div>
  )
}
