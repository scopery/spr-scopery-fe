'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Plus, Pencil, Eye } from 'lucide-react'
import { Typography, Button, Badge, ContentLoader } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/contexts/AuthContext'
import { useProjects } from '@/hooks/useProjects'
import { isOrgReadonly } from '@/utils/permissions'
import { CreateProjectModal } from './_components/CreateProjectModal'

function ProjectsContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = params.orgId as string
  const { orgs } = useAuth()
  const { projects, loading } = useProjects(orgId)
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const currentOrg = orgs.find((o) => o.id === orgId)
  const orgReadonly = currentOrg ? isOrgReadonly(currentOrg.my_role) : false

  useEffect(() => {
    if (searchParams.get('create') === '1' && !orgReadonly) setCreateModalOpen(true)
  }, [searchParams, orgReadonly])

  const handleProjectCreated = (projectId: string) => {
    setCreateModalOpen(false)
    window.location.href = ROUTES.org.project(orgId, projectId)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 mb-6 border-b-[1px] border-neutral-200 pb-6">
        <Typography as="h1" size="xl" weight="bold">
          Projects
        </Typography>
        {!orgReadonly && (
          <Button
            variant="primary"
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 bg-neutral-900"
          >
            <Plus size={18} />
            New project
          </Button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <ContentLoader variant="easeOut" className="w-20" />
        </div>
      ) : projects.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-12 text-center">
          <Typography as="h2" weight="medium" className="mb-2">
            No projects yet
          </Typography>
          <Typography tone="muted" className="mb-6">
            Create your first project to get started.
          </Typography>
          {!orgReadonly && (
            <Button variant="primary" onClick={() => setCreateModalOpen(true)}>
              Create project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={ROUTES.org.project(orgId, p.id)}
              className="group project-card-hover block border border-neutral-200 bg-white p-5 transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <Badge
                  variant="solid"
                  tone={p.my_role === 'editor' ? 'info' : 'neutral'}
                  size="sm"
                  className="gap-1 transition-colors duration-300 group-hover:!bg-white group-hover:!text-black"
                >
                  {p.my_role === 'editor' ? (
                    <>
                      <Pencil size={12} aria-hidden />
                      Editable
                    </>
                  ) : (
                    <>
                      <Eye size={12} aria-hidden />
                      View only
                    </>
                  )}
                </Badge>
              </div>
              <Typography weight="semibold" className="mb-1 transition-colors duration-300 group-hover:text-white">
                {p.name}
              </Typography>
              {p.description ? (
                <Typography variant="small" tone="muted" className="line-clamp-2 mb-3 transition-colors duration-300 group-hover:text-white/90">
                  {p.description}
                </Typography>
              ) : (
                <Typography variant="small" tone="muted" className="mb-3 transition-colors duration-300 group-hover:text-white/90">
                  Elicitation project for scoping requirements.
                </Typography>
              )}
              <span className="text-sm text-primary underline transition-colors duration-300 group-hover:text-white">
                View details
              </span>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectModal
        orgId={orgId}
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  )
}

export default function ProjectsListPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-12">
        <ContentLoader variant="easeOut" className="w-20" />
      </div>
    }>
      <ProjectsContent />
    </Suspense>
  )
}
