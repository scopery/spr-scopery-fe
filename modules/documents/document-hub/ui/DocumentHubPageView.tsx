'use client'

import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Typography, PageSkeleton } from '@/shared/ui'
import { buildDocumentSpacePermissions } from '@/modules/permissions/access/lib/permissions'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import * as projectsApi from '@/modules/projects/project/api/projects.api'
import {
  DocumentHubScopeSwitcher,
  type DocumentHubScopeOption,
} from './DocumentHubScopeSwitcher'
import { DocumentHubView } from './DocumentHubView'

export function DocumentHubPageView() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const orgId = params.workspaceId as string
  const { workspaces } = useAuth()

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)

  const workspaceName = workspaces.find((w) => w.id === orgId)?.name ?? 'Workspace'

  const urlProjectId = searchParams.get('projectId') ?? ''

  const [scope, setScope] = useState<DocumentHubScopeOption>(() => {
    if (urlProjectId) {
      return {
        kind: 'project',
        id: urlProjectId,
        label: 'Project',
        projectId: urlProjectId,
      }
    }
    return { kind: 'workspace', id: orgId, label: workspaceName }
  })

  useEffect(() => {
    let cancelled = false
    setProjectsLoading(true)
    projectsApi
      .listProjects(orgId, { page: 0, size: 100 })
      .then((res) => {
        if (cancelled) return
        const items = (res.items ?? []).map((p) => ({ id: p.id, name: p.name }))
        setProjects(items)
        if (urlProjectId) {
          const match = items.find((p) => p.id === urlProjectId)
          if (match) {
            setScope({
              kind: 'project',
              id: match.id,
              label: match.name,
              projectId: match.id,
            })
          }
        } else {
          setScope((prev) =>
            prev.kind === 'workspace'
              ? { kind: 'workspace', id: orgId, label: workspaceName }
              : prev
          )
        }
      })
      .catch(() => {
        if (!cancelled) setProjects([])
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [orgId, urlProjectId, workspaceName])

  const syncUrl = useCallback(
    (next: DocumentHubScopeOption) => {
      const qs = new URLSearchParams()
      if (next.kind === 'project' && next.projectId) {
        qs.set('projectId', next.projectId)
      }
      if (next.kind === 'personal') {
        qs.set('scope', 'personal')
      }
      const q = qs.toString()
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false })
    },
    [pathname, router]
  )

  const handleScopeChange = (next: DocumentHubScopeOption) => {
    setScope(next)
    syncUrl(next)
  }

  // Keep label in sync when workspace name loads
  useLayoutEffect(() => {
    if (scope.kind === 'workspace' && scope.label !== workspaceName) {
      setScope({ kind: 'workspace', id: orgId, label: workspaceName })
    }
  }, [workspaceName, orgId, scope.kind, scope.label])

  // Legacy org-scoped effective-permissions API is gone — allow hub UI;
  // document APIs still enforce IAM server-side.
  const docPerms = useMemo(() => buildDocumentSpacePermissions(null, true), [])

  const defaultProjectId =
    scope.kind === 'project' ? scope.projectId : scope.kind === 'personal' ? '' : ''

  if (projectsLoading) {
    return <PageSkeleton variant="list" />
  }

  if (!docPerms.canViewDocumentHub) {
    return (
      <Typography tone="error" className="py-8 text-center">
        You do not have permission to view Document Hub.
      </Typography>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={orgId}
        current="Document Hub"
        className="mb-4"
      />
      <div className="mb-4">
        <DocumentHubScopeSwitcher
          workspaceName={workspaceName}
          workspaceId={orgId}
          projects={projects}
          scope={scope}
          onChange={handleScopeChange}
        />
        {scope.kind === 'personal' ? (
          <Typography variant="small" tone="muted" className="mt-2">
            Personal documents filter is limited in this release — showing workspace documents.
          </Typography>
        ) : null}
      </div>
      <DocumentHubView
        key={`${scope.kind}:${scope.projectId ?? scope.id}`}
        orgId={orgId}
        defaultProjectId={defaultProjectId || undefined}
        canCreateDocument={docPerms.canCreateDocument}
        canCreateFromTemplate={docPerms.canCreateFromTemplate}
        canRestoreDocument={docPerms.canArchiveDocument}
        canExportDocuments={docPerms.canExportDocuments}
      />
    </div>
  )
}
