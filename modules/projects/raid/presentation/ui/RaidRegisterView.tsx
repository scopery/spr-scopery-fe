'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, PageSkeleton, Select, Stack, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout/ui/WorkspaceHierarchyBreadcrumb'
import { useProject } from '../../../project/hooks/useProject'
import { useRaidRegister } from '../hooks/useRaidRegister'
import { CreateRaidItemModal } from './CreateRaidItemModal'
import { RaidRiskMatrixView } from './RaidRiskMatrixView'
import { RaidItemType } from '../../domain/enums/raid.enum'
import {
  canArchiveRaidItem,
  canCloseRaidItem,
  canConvertToIssue,
  canCreateCRDraft,
  canEscalateRaidItem,
  canResolveRaidItem,
  raidStatusLabel,
  raidStatusTone,
  raidTypeLabel,
} from '../../domain/rules/raid.rules'

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All types' },
  { value: RaidItemType.Risk, label: 'Risk' },
  { value: RaidItemType.Issue, label: 'Issue' },
  { value: RaidItemType.Assumption, label: 'Assumption' },
  { value: RaidItemType.Dependency, label: 'Dependency' },
]

type RaidRegisterTab = 'register' | 'matrix'

const TABS: { id: RaidRegisterTab; label: string }[] = [
  { id: 'register', label: 'Register' },
  { id: 'matrix', label: 'Risk Matrix' },
]

export function RaidRegisterView() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const projectId = params.projectId as string

  const { project } = useProject(workspaceId, projectId)
  const [tab, setTab] = useState<RaidRegisterTab>('register')
  const [typeFilter, setTypeFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const { items, loading, forbidden, actingId, createItem, runAction, escalateItem, convertToIssue, createCRDraft } = useRaidRegister(projectId)

  const filteredItems = useMemo(
    () => (typeFilter ? items.filter((item) => item.type === typeFilter) : items),
    [items, typeFilter]
  )

  const handleAction = async (
    id: string,
    action: 'resolve' | 'close' | 'reopen' | 'archive'
  ) => {
    try {
      await runAction(id, action)
      toast.success('RAID item updated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleEscalate = async (id: string) => {
    try {
      await escalateItem(id)
      toast.success('RAID item escalated')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleConvertToIssue = async (id: string) => {
    try {
      await convertToIssue(id)
      toast.success('Converted to issue')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleCreateCRDraft = async (id: string) => {
    try {
      await createCRDraft(id)
      toast.success('Change request draft created')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  if (loading && items.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don’t have access to the RAID register</Typography>
      </div>
    )
  }

  return (
    <div>
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="RAID"
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            RAID register
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1">
            Risks, Assumptions, Issues and Dependencies
          </Typography>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          New item
        </Button>
      </div>

      <nav aria-label="RAID sections" className="mb-4 flex gap-1 border-b border-neutral-200">
        {TABS.map((t) => {
          const active = t.id === tab
          return (
            <button
              key={t.id}
              type="button"
              aria-current={active ? 'page' : undefined}
              onClick={() => setTab(t.id)}
              className={cn(
                'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'border-primary text-primary'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              )}
            >
              {t.label}
            </button>
          )
        })}
      </nav>

      {tab === 'matrix' ? (
        <RaidRiskMatrixView items={items} />
      ) : (
        <>
          <div className="mb-4">
            <Select
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={TYPE_FILTER_OPTIONS}
              className="w-44"
            />
          </div>

          <div className="overflow-x-auto border border-neutral-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Code / Title</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Probability</th>
                  <th className="px-4 py-3 font-medium">Impact</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center">
                      <Typography variant="small" tone="muted">
                        No RAID items found
                      </Typography>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                      <td className="px-4 py-3">
                        <Typography as="span" variant="small" tone="muted" className="font-mono">
                          {item.code}
                        </Typography>
                        <Typography as="div" weight="medium">
                          {item.title}
                        </Typography>
                      </td>
                      <td className="px-4 py-3">{raidTypeLabel(item.type)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={raidStatusTone(item.status)}>
                          {raidStatusLabel(item.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{item.probability ?? '—'}</td>
                      <td className="px-4 py-3">{item.impact ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Stack direction="horizontal" spacing="sm">
                          {canResolveRaidItem(item) && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={actingId === item.id}
                              onClick={() => void handleAction(item.id, 'resolve')}
                            >
                              Resolve
                            </Button>
                          )}
                          {canEscalateRaidItem(item) && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={actingId === item.id}
                              onClick={() => void handleEscalate(item.id)}
                            >
                              Escalate
                            </Button>
                          )}
                          {canCloseRaidItem(item) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={actingId === item.id}
                              onClick={() => void handleAction(item.id, 'close')}
                            >
                              Close
                            </Button>
                          )}
                          {canArchiveRaidItem(item) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              tone="error"
                              disabled={actingId === item.id}
                              onClick={() => void handleAction(item.id, 'archive')}
                            >
                              Archive
                            </Button>
                          )}
                          {canConvertToIssue(item) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={actingId === item.id}
                              onClick={() => void handleConvertToIssue(item.id)}
                            >
                              → Issue
                            </Button>
                          )}
                          {canCreateCRDraft(item) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={actingId === item.id}
                              onClick={() => void handleCreateCRDraft(item.id)}
                            >
                              → CR Draft
                            </Button>
                          )}
                        </Stack>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <CreateRaidItemModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (body) => {
          try {
            await createItem(body)
            toast.success('RAID item created')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
