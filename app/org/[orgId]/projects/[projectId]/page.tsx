'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { Play, Plus } from 'lucide-react'
import { Typography, Button, Badge, ContentLoader } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import * as sessionService from '@/services/session.service'
import { useProject } from '@/hooks/useProject'
import { useOrg } from '@/hooks/useOrg'
import { useSessions } from '@/hooks/useSessions'
import { canEditProject, isOrgReadonly, resolveProjectRole } from '@/utils/permissions'
import { ProjectStepIndicator, buildProjectFlowSteps, PROJECT_FLOW_STEP_IDS } from './_components/ProjectStepIndicator'
import { CreateSessionModal } from './sessions/_components/CreateSessionModal'

export default function ProjectDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const orgId = params.orgId as string
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
    router.push(ROUTES.org.session(orgId, projectId, sessionId))
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
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
    project: ROUTES.org.project(orgId, projectId),
    questions: ROUTES.org.projectQuestions(orgId, projectId),
    sessions: ROUTES.org.sessions(orgId, projectId),
    documents: ROUTES.org.projectDocuments(orgId, projectId),
  })

  return (
    <div>
      <ProjectStepIndicator
        title={project.name}
        description={project.description ?? undefined}
        badges={
          <>
            <Badge className="rounded-none" variant="solid" tone={projectRole === 'editor' ? 'info' : 'neutral'} size="sm">
              {projectRole}
            </Badge>
            <Badge variant="soft" tone="neutral" size="sm">{project.status}</Badge>
          </>
        }
        steps={flowSteps}
      />

      {/* Navigation tabs — simplified MVP */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Link href={ROUTES.org.projectQuestions(orgId, projectId)}>
          <Button variant="neutral-flat" size="sm">Questions</Button>
        </Link>
        <Link href={ROUTES.org.projectDocuments(orgId, projectId)}>
          <Button variant="neutral-flat" size="sm">Documents</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-4 lg:grid-cols-6 mb-8">
        <div className="border border-neutral-200 bg-white p-4">
          <Typography variant="small" tone="muted">Questions</Typography>
          <Typography size="xl" weight="normal">{project.questions_count}</Typography>
        </div>
        <div className="border border-neutral-200 bg-white p-4">
          <Typography variant="small" tone="muted">Answered</Typography>
          <Typography size="xl" weight="normal">{project.answered_count}</Typography>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
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
            <Button variant="neutral-flat" size="md" onClick={() => setCreateModalOpen(true)} className="flex items-center gap-2">
              <Plus size={16} />
              Create session
            </Button>
          )}
          {project.active_session_id && (
            <Link href={ROUTES.org.session(orgId, projectId, project.active_session_id)}>
              <Button variant="primary" size="md" className="flex items-center gap-2 bg-warning">
                <Play size={16} />
                Resume active session
              </Button>
            </Link>
          )}
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-12 text-center mb-8">
          <Typography as="h3" weight="medium" className="mb-2">
            No sessions yet
          </Typography>
          <Typography tone="muted" className="mb-6">
            Create a session to start elicitation.
          </Typography>
          {editable && (
            <Button variant="outline" onClick={() => setCreateModalOpen(true)}>
              Create session
            </Button>
          )}
        </div>
      ) : (
        <div className="border-neutral-200 overflow-hidden mb-8">
          <table className="w-full">
            <thead className="border-b border-neutral-500">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-normal text-neutral-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-normal text-neutral-700">Status</th>
                <th className="text-left py-3 px-4 text-sm font-normal text-neutral-700">Created</th>
                <th className="text-left py-3 px-4 text-sm font-normal text-neutral-700">Submitted</th>
                <th className="w-24" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {sessions.map((s) => (
                <tr key={s.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <Link
                      href={ROUTES.org.session(orgId, projectId, s.id)}
                      className="text-primary hover:underline text-sm"
                    >
                      {s.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      variant="solid"
                      tone={
                        s.status === 'in_progress'
                          ? 'progress'
                          : s.status === 'submitted'
                            ? 'success'
                            : 'neutral'
                      }
                      size="sm"
                    >
                      {sessionService.SESSION_STATUS_LABEL[s.status]}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-600">
                    {new Date(s.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-sm text-neutral-600">
                    {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <Link href={ROUTES.org.session(orgId, projectId, s.id)}>
                      <Typography variant="small" className="text-primary hover:underline">Open</Typography>
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
