'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, PageSkeleton, Select, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '../../../project/hooks/useProject'
import { useScopeRegister } from '../hooks/useScopeRegister'
import { CreateScopePackageModal } from './CreateScopePackageModal'
import { CreateScopeItemModal } from './CreateScopeItemModal'
import { ScopeItemDetailDrawer } from './ScopeItemDetailDrawer'
import type { ScopeItem } from '../../domain/model/scope'
import {
  scopeItemClassificationLabel,
  scopeItemPriorityLabel,
  scopePackageStatusLabel,
} from '../../domain/rules/scope.rules'

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
    items,
    loading,
    loadingItems,
    forbidden,
    createPackage,
    createItem,
    classifyItem,
    archiveItem,
    approvePackage,
    markCurrentPackage,
    archivePackage,
  } = useScopeRegister(projectId)

  const [createPackageOpen, setCreatePackageOpen] = useState(false)
  const [createItemOpen, setCreateItemOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ScopeItem | null>(null)
  const [acting, setActing] = useState(false)

  const handleClassify = async (item: ScopeItem, classification: 'in' | 'out' | 'unclassified') => {
    setActing(true)
    try {
      const updated = await classifyItem(item, classification)
      if (updated) setSelectedItem(updated)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActing(false)
    }
  }

  const handleArchiveItem = async (item: ScopeItem) => {
    setActing(true)
    try {
      await archiveItem(item.id)
      toast.success('Scope item archived')
      setSelectedItem(null)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActing(false)
    }
  }

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
            Scope packages and their in/out-of-scope items
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
            onClick={() => setCreateItemOpen(true)}
          >
            Add item
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
                <th className="px-4 py-3 font-medium">Code / Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Classification</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingItems ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <Typography variant="small" tone="muted">
                      Loading items…
                    </Typography>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <Typography variant="small" tone="muted">
                      No scope items in this package
                    </Typography>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-t border-neutral-100 hover:bg-neutral-50"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="px-4 py-3">
                      <Typography as="span" variant="small" tone="muted" className="font-mono">
                        {item.code}
                      </Typography>
                      <Typography as="div" weight="medium">
                        {item.title}
                      </Typography>
                    </td>
                    <td className="px-4 py-3">{item.type}</td>
                    <td className="px-4 py-3">{scopeItemPriorityLabel(item.priority)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={item.outOfScope ? 'error' : item.inScope ? 'success' : 'neutral'}>
                        {scopeItemClassificationLabel(item)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Stack direction="horizontal" spacing="sm">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e: { stopPropagation: () => void }) => {
                            e.stopPropagation()
                            void handleClassify(item, 'in')
                          }}
                        >
                          In scope
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e: { stopPropagation: () => void }) => {
                            e.stopPropagation()
                            void handleClassify(item, 'out')
                          }}
                        >
                          Out of scope
                        </Button>
                      </Stack>
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
          try {
            await createPackage(body)
            toast.success('Scope package created')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />

      <CreateScopeItemModal
        open={createItemOpen}
        onClose={() => setCreateItemOpen(false)}
        onSubmit={async (body) => {
          try {
            await createItem(body)
            toast.success('Scope item added')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />

      <ScopeItemDetailDrawer
        item={selectedItem}
        open={!!selectedItem}
        acting={acting}
        onClose={() => setSelectedItem(null)}
        onClassify={handleClassify}
        onArchive={handleArchiveItem}
      />
    </div>
  )
}
