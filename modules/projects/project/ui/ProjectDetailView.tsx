'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Play, Plus } from 'lucide-react'
import { Typography, Button, Badge, Card, DataTable, PageSkeleton } from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
import { ROUTES } from '@/constants/routes'
import { useSessions, SESSION_STATUS_LABEL, CreateSessionModal } from '@/modules/sessions/session'
import { useOrg } from '@/modules/org/org'
import { canEditProject, isOrgReadonly, resolveProjectRole } from '@/modules/permissions'
import {
  ProjectStepIndicator,
  buildProjectFlowSteps,
  PROJECT_FLOW_STEP_IDS,
} from './ProjectStepIndicator'
import { useProject } from '../hooks/useProject'
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
    return <PageSkeleton variant="detail" />
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
            <Badge className="rounded-none" tone={projectRole === 'editor' ? 'info' : 'neutral'}>
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
          <Button variant="neutral-flat">Questions</Button>
        </Link>
        <Link href={ROUTES.workspace.projectDocuments(orgId, projectId)}>
          <Button variant="neutral-flat">Documents</Button>
        </Link>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-4 lg:grid-cols-6">
        <Card className="p-4">
          <Typography variant="small" tone="muted">
            Questions
          </Typography>
          <Typography size="md" weight="medium">
            {project.questions_count}
          </Typography>
        </Card>
        <Card className="p-4">
          <Typography variant="small" tone="muted">
            Answered
          </Typography>
          <Typography size="md" weight="medium">
            {project.answered_count}
          </Typography>
        </Card>
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
        <Card className="mb-8 p-12 text-center">
          <Typography as="h3" weight="medium" className="mb-2">
            No sessions yet
          </Typography>
          <Typography tone="muted" className="mb-6">
            Create a session to start elicitation.
          </Typography>
          {editable && (
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(true)}
              icon={<Plus size={16} />}
            >
              Create session
            </Button>
          )}
        </Card>
      ) : (
        <div className="mb-8">
          <DataTable
            ariaLabel="Project sessions"
            rows={sessions}
            rowKey={(session) => session.id}
            columns={[
              {
                id: 'name',
                header: 'Name',
                cell: (session) => (
                  <Link
                    href={ROUTES.workspace.session(orgId, projectId, session.id)}
                    className="text-sm text-primary hover:underline"
                  >
                    {session.name}
                  </Link>
                ),
              },
              {
                id: 'status',
                header: 'Status',
                cell: (session) => (
                  <Badge
                    tone={
                      session.status === 'in_progress'
                        ? 'progress'
                        : session.status === 'submitted'
                          ? 'success'
                          : 'neutral'
                    }
                  >
                    {SESSION_STATUS_LABEL[session.status]}
                  </Badge>
                ),
              },
              {
                id: 'created',
                header: 'Created',
                accessor: (session) => new Date(session.created_at).toLocaleDateString(),
              },
              {
                id: 'submitted',
                header: 'Submitted',
                accessor: (session) =>
                  session.submitted_at ? new Date(session.submitted_at).toLocaleDateString() : '—',
              },
              {
                id: 'actions',
                header: 'Actions',
                width: '6rem',
                cell: (session) => (
                  <Link href={ROUTES.workspace.session(orgId, projectId, session.id)}>
                    <Typography variant="small" className="text-primary hover:underline">
                      Open
                    </Typography>
                  </Link>
                ),
              },
            ]}
          />
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
