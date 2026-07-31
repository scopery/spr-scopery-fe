'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import NextLink from 'next/link'
import { Plus, Search } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  DataTable,
  Input,
  Typography,
  PageSkeleton,
  Skeleton,
  Select,
} from '@/shared/ui'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/modules/auth/auth'
import { useWorkspaceAuthorization } from '@/modules/auth/iam'
import { useOrgTeams } from '../hooks/useOrgTeams'
import { CreateOrgTeamModal } from './CreateOrgTeamModal'
import { OrgTeamStatus } from '../model'

export function WorkspaceTeamsView({ embedded = false }: { embedded?: boolean } = {}) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const router = useRouter()
  const { workspaces } = useAuth()
  const organizationId = useMemo(
    () => workspaces.find((w) => w.id === workspaceId)?.organizationId ?? null,
    [workspaces, workspaceId]
  )
  const {
    canViewTeams,
    canCreateTeams,
    loading: authzLoading,
  } = useWorkspaceAuthorization(workspaceId, organizationId)
  const { items, loading, error, setKeyword, statusFilter, setStatusFilter, load } =
    useOrgTeams(organizationId)
  const [createOpen, setCreateOpen] = useState(false)
  const [searchDraft, setSearchDraft] = useState('')

  useEffect(() => {
    if (canViewTeams && organizationId) void load()
  }, [canViewTeams, organizationId, load])

  if (authzLoading) {
    return <PageSkeleton variant="split" />
  }

  if (!canViewTeams) {
    return (
      <div>
        {!embedded ? (
          <WorkspaceHierarchyBreadcrumb
            workspaceId={workspaceId}
            current="Teams"
            className="mb-4"
          />
        ) : null}
        <Card className="bg-neutral-50 p-4">
          <Typography variant="small" tone="muted">
            You do not have permission to view organization teams.
          </Typography>
        </Card>
      </div>
    )
  }

  if (!organizationId) {
    return (
      <div>
        {!embedded ? (
          <WorkspaceHierarchyBreadcrumb
            workspaceId={workspaceId}
            current="Teams"
            className="mb-4"
          />
        ) : null}
        <Typography tone="error">Organization context is missing for this workspace.</Typography>
      </div>
    )
  }

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      {!embedded ? (
        <WorkspaceHierarchyBreadcrumb workspaceId={workspaceId} current="Teams" className="mb-4" />
      ) : null}
      <div
        className={
          embedded
            ? 'mb-4 flex flex-wrap items-center justify-end gap-2'
            : 'mb-2 flex flex-wrap items-center justify-between gap-2'
        }
      >
        {!embedded ? (
          <div>
            <Typography as="h1" size="md" weight="medium">
              Teams
            </Typography>
            <Typography as="p" variant="small" tone="muted" className="mt-1">
              Organization teams that can be assigned to workspaces.
            </Typography>
          </div>
        ) : null}
        {canCreateTeams && (
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus size={16} />
            Create team
          </Button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1">
          <Input
            label="Search"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setKeyword(searchDraft)
              }
            }}
            fullWidth
            placeholder="Name or code"
          />
        </div>
        <Button variant="secondary" onClick={() => setKeyword(searchDraft)}>
          <Search size={14} />
          Search
        </Button>
        <div className="w-40">
          <Select
            value={statusFilter ?? ''}
            onValueChange={(v: string) => setStatusFilter(v || undefined)}
            options={[
              { value: '', label: 'All statuses' },
              { value: OrgTeamStatus.Active, label: 'Active' },
              { value: OrgTeamStatus.Archived, label: 'Archived' },
            ]}
            placeholder="All statuses"
          />
        </div>
      </div>

      {error && (
        <Typography tone="error" className="mb-4">
          {error}
        </Typography>
      )}

      <div className="border border-neutral-200 bg-white">
        {loading ? (
          <div className="p-4">
            <Skeleton variant="rectangular" width="100%" height={80} />
          </div>
        ) : (
          <DataTable
            ariaLabel="Organization teams"
            rows={items}
            rowKey={(team) => team.id}
            emptyMessage="No teams yet"
            columns={[
              {
                id: 'name',
                header: 'Name',
                cell: (team) => (
                  <div>
                    <NextLink
                      href={ROUTES.workspace.team(workspaceId, team.id)}
                      className="font-medium text-primary hover:underline"
                    >
                      {team.name}
                    </NextLink>
                    {team.description ? (
                      <Typography variant="small" tone="muted" className="mt-0.5 line-clamp-1">
                        {team.description}
                      </Typography>
                    ) : null}
                  </div>
                ),
              },
              { id: 'code', header: 'Code', accessor: 'code', kind: 'code' },
              {
                id: 'status',
                header: 'Status',
                cell: (team) => (
                  <Badge
                    variant="solid"
                    tone={team.status === OrgTeamStatus.Active ? 'success' : 'neutral'}
                  >
                    {team.status === OrgTeamStatus.Active ? 'Active' : 'Archived'}
                  </Badge>
                ),
              },
              {
                id: 'updated',
                header: 'Updated',
                accessor: (team) => new Date(team.updatedAt).toLocaleDateString(),
              },
            ]}
          />
        )}
      </div>

      <CreateOrgTeamModal
        organizationId={organizationId}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={(teamId) => {
          setCreateOpen(false)
          router.push(ROUTES.workspace.team(workspaceId, teamId))
        }}
      />
    </div>
  )
}
