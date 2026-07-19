'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { TemplateEditor } from '@/modules/documents'
import { ROUTES } from '@/constants/routes'
import type { DocumentTemplate } from '@/modules/documents'

export function OrgTemplateNewPageView() {
  const params = useParams()
  const router = useRouter()
  const orgId = (params?.workspaceId as string) ?? ''
  const { profile } = useAuth()

  const handleSaved = (template: DocumentTemplate) => {
    router.replace(ROUTES.workspace.settingsTemplate(orgId, template.id))
  }

  return (
    <div className="mx-auto max-w-5xl">
      <TemplateEditor
        orgId={orgId}
        mode="create"
        userId={profile?.user_id}
        userRole={profile?.role}
        backHref={ROUTES.workspace.settingsTemplates(orgId)}
        onSaved={handleSaved}
      />
    </div>
  )
}
