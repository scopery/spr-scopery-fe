'use client'

import { useEffect, useMemo, useState, type MouseEvent } from 'react'
import { useParams } from 'next/navigation'
import { Archive, Check, Link2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, DataTable, PageSkeleton, Select, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
import {
  requirementPriorityBadgeProps,
  requirementPriorityLabel,
} from '@/modules/projects/requirements/model/requirement-priority'
import { RequirementTraceDetailDrawer } from '@/modules/projects/traceability'
import { useProject } from '../../../project/hooks/useProject'
import { useScopeRegister } from '../hooks/useScopeRegister'
import { useScopePackageRequirements } from '../hooks/useScopePackageRequirements'
import { CreateScopePackageModal } from './CreateScopePackageModal'
import { LinkRequirementsModal } from './LinkRequirementsModal'
import { scopePackageStatusLabel } from '../../domain/rules/scope.rules'

export function ScopeRegisterView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const { project } = useProject(workspaceId, projectId)
  const {
    packages,
    selectedPackage,
    selectedPackageId,
    setSelectedPackageId,
    loading,
    forbidden,
    createPackage,
    approvePackage,
    archivePackage,
  } = useScopeRegister(projectId)

  const {
    requirements,
    loading: loadingReqs,
    acting,
    linkRequirements,
    unlinkRequirements,
  } = useScopePackageRequirements(projectId, selectedPackageId)

  const [createPackageOpen, setCreatePackageOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const [unlinkingId, setUnlinkingId] = useState<string | null>(null)
  const [detailRequirementId, setDetailRequirementId] = useState<string | null>(null)

  const linkedIds = useMemo(() => new Set(requirements.map((r) => r.id)), [requirements])

  useEffect(() => {
    setDetailRequirementId(null)
  }, [selectedPackageId])

  const handleApprove = async () => {
    if (!selectedPackage) return
    try {
      await approvePackage(selectedPackage.id)
      toast.success('Scope package approved')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleArchivePackage = async () => {
    if (!selectedPackage) return
    try {
      await archivePackage(selectedPackage.id)
      toast.success('Scope package archived')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleLink = async (requirementIds: string[]) => {
    try {
      await linkRequirements(requirementIds)
      toast.success(
        requirementIds.length === 1
          ? 'Requirement linked'
          : `${requirementIds.length} requirements linked`
      )
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      throw err
    }
  }

  const handleUnlink = async (requirementId: string) => {
    setUnlinkingId(requirementId)
    try {
      await unlinkRequirements([requirementId])
      toast.success('Requirement unlinked')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setUnlinkingId(null)
    }
  }

  if (loading && packages.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to the scope register</Typography>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="Scope register"
      />

      <div className="mb-2 mt-1 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Scope register
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-0.5">
            Scope packages linked to project requirements
          </Typography>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setCreatePackageOpen(true)}
        >
          New package
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Stack direction="horizontal" spacing="sm" className="min-w-0 flex-wrap items-center">
          <Select
            value={selectedPackageId ?? ''}
            onValueChange={setSelectedPackageId}
            options={packages.map((p) => ({
              value: p.id,
              label: `${p.code} · ${p.name}${p.currentFlag ? ' (current)' : ''}`,
            }))}
            className="w-64"
          />
          {selectedPackage ? (
            <Badge
              variant="solid"
              tone={selectedPackage.status === 'APPROVED' ? 'success' : 'neutral'}
            >
              {scopePackageStatusLabel(selectedPackage.status)}
            </Badge>
          ) : null}
        </Stack>

        {selectedPackage ? (
          <Stack direction="horizontal" spacing="sm" className="ml-auto flex-wrap items-center">
            {selectedPackage.status === 'DRAFT' ? (
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                icon={<Check size={16} />}
                aria-label="Approve package"
                title="Approve"
                onClick={() => void handleApprove()}
              />
            ) : null}
            {selectedPackage.status !== 'ARCHIVED' ? (
              <Button
                size="sm"
                variant="ghost"
                tone="error"
                iconOnly
                icon={<Archive size={16} />}
                aria-label="Archive package"
                title="Archive"
                onClick={() => void handleArchivePackage()}
              />
            ) : null}
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon={<Link2 size={16} />}
              aria-label="Link requirements"
              title="Link requirements"
              onClick={() => setLinkOpen(true)}
            />
          </Stack>
        ) : null}
      </div>

      {packages.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-8 text-center">
          <Typography tone="muted">No scope packages yet. Create one to get started.</Typography>
        </div>
      ) : (
        <div className="border border-neutral-200 bg-white">
          <DataTable
            ariaLabel="Linked scope requirements"
            rows={loadingReqs ? [] : requirements}
            rowKey={(requirement) => requirement.id}
            selectedRowKey={detailRequirementId}
            onRowClick={(requirement) => setDetailRequirementId(requirement.id)}
            emptyMessage={
              loadingReqs
                ? 'Loading requirements…'
                : 'No requirements linked. Use “Link requirements” to add some.'
            }
            columns={[
              { id: 'code', header: 'Code', accessor: 'code', kind: 'code' },
              { id: 'title', header: 'Title', accessor: 'title' },
              {
                id: 'type',
                header: 'Type',
                accessor: (requirement) => requirement.requirementType ?? '—',
              },
              {
                id: 'priority',
                header: 'Priority',
                cell: (requirement) => {
                  if (!requirement.priority) return '—'
                  const badge = requirementPriorityBadgeProps(requirement.priority)
                  return (
                    <Badge
                      variant={badge.variant}
                      size="sm"
                      tone={badge.tone}
                      className={badge.className}
                    >
                      {requirementPriorityLabel(requirement.priority)}
                    </Badge>
                  )
                },
              },
              {
                id: 'status',
                header: 'Status',
                cell: (requirement) => <Badge tone="neutral">{requirement.status ?? '—'}</Badge>,
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (requirement) => (
                  <Button
                    size="sm"
                    variant="ghost"
                    tone="error"
                    disabled={acting || unlinkingId === requirement.id}
                    loading={unlinkingId === requirement.id}
                    onClick={(event: MouseEvent<HTMLButtonElement>) => {
                      event.stopPropagation()
                      void handleUnlink(requirement.id)
                    }}
                  >
                    Unlink
                  </Button>
                ),
              },
            ]}
          />
        </div>
      )}

      <CreateScopePackageModal
        open={createPackageOpen}
        onClose={() => setCreatePackageOpen(false)}
        onSubmit={async (body) => {
          await createPackage(body)
          toast.success('Scope package created')
        }}
      />

      {selectedPackageId ? (
        <LinkRequirementsModal
          open={linkOpen}
          projectId={projectId}
          linkedIds={linkedIds}
          onClose={() => setLinkOpen(false)}
          onSubmit={handleLink}
        />
      ) : null}

      <RequirementTraceDetailDrawer
        open={Boolean(detailRequirementId)}
        onClose={() => setDetailRequirementId(null)}
        projectId={projectId}
        requirementId={detailRequirementId}
        seedDescription={
          requirements.find((r) => r.id === detailRequirementId)?.description ?? null
        }
        seedPriority={
          requirements.find((r) => r.id === detailRequirementId)?.priority ?? null
        }
      />
    </div>
  )
}
