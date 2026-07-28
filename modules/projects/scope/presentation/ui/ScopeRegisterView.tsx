'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, PageSkeleton, Select, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
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
    markCurrentPackage,
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

  const linkedIds = useMemo(() => new Set(requirements.map((r) => r.id)), [requirements])

  const handleApprove = async () => {
    if (!selectedPackage) return
    try {
      await approvePackage(selectedPackage.id)
      toast.success('Scope package approved')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleMarkCurrent = async () => {
    if (!selectedPackage) return
    try {
      await markCurrentPackage(selectedPackage.id)
      toast.success('Marked as current package')
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

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Scope register
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1">
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

      <Stack direction="horizontal" spacing="sm" className="mb-4 flex-wrap items-center">
        <Select
          value={selectedPackageId ?? ''}
          onValueChange={setSelectedPackageId}
          options={packages.map((p) => ({
            value: p.id,
            label: `${p.code} · ${p.name}${p.currentFlag ? ' (current)' : ''}`,
          }))}
          className="w-64"
        />
        {selectedPackage && (
          <Badge tone={selectedPackage.status === 'APPROVED' ? 'success' : 'neutral'}>
            {scopePackageStatusLabel(selectedPackage.status)}
          </Badge>
        )}
        {selectedPackage && selectedPackage.status === 'DRAFT' && (
          <Button size="sm" variant="secondary" onClick={() => void handleApprove()}>
            Approve
          </Button>
        )}
        {selectedPackage && !selectedPackage.currentFlag && (
          <Button size="sm" variant="ghost" onClick={() => void handleMarkCurrent()}>
            Mark current
          </Button>
        )}
        {selectedPackage && selectedPackage.status !== 'ARCHIVED' && (
          <Button
            size="sm"
            variant="ghost"
            tone="error"
            onClick={() => void handleArchivePackage()}
          >
            Archive
          </Button>
        )}
        {selectedPackage && (
          <Button
            size="sm"
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setLinkOpen(true)}
          >
            Link requirements
          </Button>
        )}
      </Stack>

      {packages.length === 0 ? (
        <div className="border border-neutral-200 bg-white p-8 text-center">
          <Typography tone="muted">No scope packages yet. Create one to get started.</Typography>
        </div>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-600">
              <tr>
                <th className="px-4 py-3 font-medium">Code</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingReqs ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <Typography variant="small" tone="muted">
                      Loading requirements…
                    </Typography>
                  </td>
                </tr>
              ) : requirements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center">
                    <Typography variant="small" tone="muted">
                      No requirements linked. Use “Link requirements” to add some.
                    </Typography>
                  </td>
                </tr>
              ) : (
                requirements.map((r) => (
                  <tr key={r.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">{r.code}</td>
                    <td className="px-4 py-3 font-medium text-neutral-900">{r.title}</td>
                    <td className="px-4 py-3">{r.requirementType ?? '—'}</td>
                    <td className="px-4 py-3">{r.priority ?? '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">{r.status ?? '—'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        tone="error"
                        disabled={acting || unlinkingId === r.id}
                        loading={unlinkingId === r.id}
                        onClick={() => void handleUnlink(r.id)}
                      >
                        Unlink
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
    </div>
  )
}
