'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Play, Plus } from 'lucide-react'
import { Typography, Button, Badge, PageSkeleton } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { ROUTES } from '@/constants/routes'
import { useProject } from '@/modules/projects/project/hooks/useProject'
import { useSessions } from '@/modules/sessions/session/hooks/useSessions'
import { SESSION_STATUS_LABEL } from '@/modules/sessions/session/model/session'
import { useOrg } from '@/modules/org/org/hooks/useOrg'
import { canEditProject, isOrgReadonly, resolveProjectRole } from '@/modules/permissions/access/lib/permissions'
import { ProjectStepIndicator, buildProjectFlowSteps, PROJECT_FLOW_STEP_IDS } from '@/modules/projects/project/ui/ProjectStepIndicator'
import { CreateSessionModal } from '@/modules/sessions/session/ui/CreateSessionModal'
import { ObjectCustomFieldsPanel } from '@/modules/configuration'

export function ProjectDetailView() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const orgId = params.workspaceId as string
  const projectId = params.projectId as string
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const { project, loading: projectLoading } = useProject(orgId, projectId)
  const { org, loading: orgLoading } = useOrg(orgId)
  const { sessions, loading: sessionsLoading } = useSessions(orgId, projectId)

  const loading = projectLoading || orgLoading || sessionsLoading

  const projectRole = resolveProjectRole(project?.my_role)
  const editable = project ? canEditProject(projectRole) : false
  const isPartner = org ? isOrgReadonly(org.my_role) : false
  const canCreateSession = editable && !isPartner

  useEffect(() => {
    if (searchParams.get('create') === '1' && canCreateSession) setCreateModalOpen(true)
  }, [searchParams, canCreateSession])

  const handleSessionCreated = (sessionId: string) => {
    setCreateModalOpen(false)
    router.push(ROUTES.workspace.session(orgId, projectId, sessionId))
  }

  if (loading) {
    return (
      <PageSkeleton variant="detail" />
    )
  }
  if (!project) {
    return (
      <div>
        <Typography tone="error">Project not found</Typography>
      </div>
    )
  }

  const flowSteps = buildProjectFlowSteps(orgId, projectId, PROJECT_FLOW_STEP_IDS.sessions, {
    project: ROUTES.workspace.project(orgId, projectId),
    questions: ROUTES.workspace.projectQuestions(orgId, projectId),
    sessions: ROUTES.workspace.sessions(orgId, projectId),
    documents: ROUTES.workspace.projectDocuments(orgId, projectId),
  })

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={orgId}
        project={{ id: projectId, name: project.name }}
        className="mb-4"
      />
      <ProjectStepIndicator
        title={project.name}
        description={project.description ?? undefined}
        badges={
          <>
            <Badge
              className="rounded-none"
              tone={projectRole === 'editor' ? 'info' : 'neutral'}
            >
              {projectRole}
            </Badge>
            <Badge variant="soft" tone="neutral">
              {project.status}
            </Badge>
          </>
        }
        steps={flowSteps}
      />

      {/* Navigation tabs — simplified MVP */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link href={ROUTES.workspace.projectQuestions(orgId, projectId)}>
          <Button variant="neutral-flat">
            Questions
          </Button>
        </Link>
        <Link href={ROUTES.workspace.projectDocuments(orgId, projectId)}>
          <Button variant="neutral-flat">
            Documents
          </Button>
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <div className="border border-neutral-200 bg-white p-4">
          <Typography variant="small" tone="muted">
            Questions
          </Typography>
          <Typography size="xl" weight="normal">
            {project.questions_count}
          </Typography>
        </div>
        <div className="border border-neutral-200 bg-white p-4">
          <Typography variant="small" tone="muted">
            Answered
          </Typography>
          <Typography size="xl" weight="normal">
            {project.answered_count}
          </Typography>
        </div>
      </div>

      <div className="mb-8">
        <ObjectCustomFieldsPanel
          workspaceId={orgId}
          objectType="PROJECT"
          targetId={projectId}
          readOnly={!editable}
        />
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Typography as="h2" weight="semibold" className="text-neutral-900">
            Sessions
          </Typography>
          <Typography variant="small" tone="muted" className="mt-0.5">
            Elicitation sessions for this project. Create a session to start answering questions.
          </Typography>
        </div>

        <div className="flex flex-wrap gap-2">
          {canCreateSession && (
            <Button
              variant="neutral-flat"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Create session
            </Button>
          )}
          {project.active_session_id && (
            <Link href={ROUTES.workspace.session(orgId, projectId, project.active_session_id)}>
              <Button variant="primary" className="flex items-center gap-2 bg-warning">
                <Play size={16} />
                Resume active session
              </Button>
            </Link>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="mb-8 border border-neutral-200 bg-white p-12 text-center">
          <Typography as="h3" weight="medium" className="mb-2">
            No sessions yet
          </Typography>
          <Typography tone="muted" className="mb-6">
            Create a session to start elicitation.
          </Typography>
          {editable && (
            <Button variant="outline" onClick={() => setCreateModalOpen(true)} icon={<Plus size={16} />}>
              Create session
            </Button>
          )}
        </div>
      ) : (
        <div className="mb-8 overflow-hidden border-neutral-200">
          <table className="w-full">
            <thead className="border-b border-neutral-500">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-normal text-neutral-700">Name</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-neutral-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-normal text-neutral-700">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-sm font-normal text-neutral-700">
                  Submitted
                </th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200 bg-white">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={ROUTES.workspace.session(orgId, projectId, s.id)}
                      className="text-sm text-primary hover:underline"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        s.status === 'in_progress'
                          ? 'progress'
                          : s.status === 'submitted'
                            ? 'success'
                            : 'neutral'
                      }
                    >
                      {SESSION_STATUS_LABEL[s.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-neutral-600">
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={ROUTES.workspace.session(orgId, projectId, s.id)}>
                      <Typography variant="small" className="text-primary hover:underline">
                        Open
                      </Typography>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateSessionModal
        orgId={orgId}
        projectId={projectId}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleSessionCreated}
      />
    </div>
  )
}
