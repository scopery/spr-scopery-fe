'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, DataTable, PageSkeleton, Select, Stack, Typography } from '@/shared/ui'
import { cn } from '@/utils/cn'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { WorkspaceHierarchyBreadcrumb } from '@/modules/platform/layout'
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
  const {
    items,
    loading,
    forbidden,
    actingId,
    createItem,
    runAction,
    escalateItem,
    convertToIssue,
    createCRDraft,
  } = useRaidRegister(projectId)

  const filteredItems = useMemo(
    () => (typeFilter ? items.filter((item) => item.type === typeFilter) : items),
    [items, typeFilter]
  )

  const handleAction = async (id: string, action: 'resolve' | 'close' | 'reopen' | 'archive') => {
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
      <Card className="p-8 text-center">
        <Typography weight="medium">You don’t have access to the RAID register</Typography>
      </Card>
    )
  }

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <WorkspaceHierarchyBreadcrumb
        workspaceId={workspaceId}
        project={project ? { id: projectId, name: project.name } : undefined}
        current="RAID"
      />

      <div className="mb-2 mt-1 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            RAID register
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-0.5">
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

          <div className="border border-neutral-200 bg-white">
            <DataTable
              ariaLabel="RAID register"
              rows={filteredItems}
              rowKey={(item) => item.id}
              emptyMessage="No RAID items found"
              columns={[
                { id: 'code', header: 'Code', accessor: 'code', kind: 'code' },
                { id: 'title', header: 'Title', accessor: 'title' },
                { id: 'type', header: 'Type', accessor: (item) => raidTypeLabel(item.type) },
                {
                  id: 'status',
                  header: 'Status',
                  cell: (item) => (
                    <Badge tone={raidStatusTone(item.status)}>{raidStatusLabel(item.status)}</Badge>
                  ),
                },
                {
                  id: 'probability',
                  header: 'Probability',
                  accessor: (item) => item.probability ?? '—',
                },
                { id: 'impact', header: 'Impact', accessor: (item) => item.impact ?? '—' },
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: (item) => (
                    <Stack direction="horizontal" spacing="sm">
                      {canResolveRaidItem(item) ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={actingId === item.id}
                          onClick={() => void handleAction(item.id, 'resolve')}
                        >
                          Resolve
                        </Button>
                      ) : null}
                      {canEscalateRaidItem(item) ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={actingId === item.id}
                          onClick={() => void handleEscalate(item.id)}
                        >
                          Escalate
                        </Button>
                      ) : null}
                      {canCloseRaidItem(item) ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actingId === item.id}
                          onClick={() => void handleAction(item.id, 'close')}
                        >
                          Close
                        </Button>
                      ) : null}
                      {canArchiveRaidItem(item) ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          tone="error"
                          disabled={actingId === item.id}
                          onClick={() => void handleAction(item.id, 'archive')}
                        >
                          Archive
                        </Button>
                      ) : null}
                      {canConvertToIssue(item) ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actingId === item.id}
                          onClick={() => void handleConvertToIssue(item.id)}
                        >
                          → Issue
                        </Button>
                      ) : null}
                      {canCreateCRDraft(item) ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={actingId === item.id}
                          onClick={() => void handleCreateCRDraft(item.id)}
                        >
                          → CR Draft
                        </Button>
                      ) : null}
                    </Stack>
                  ),
                },
              ]}
            />
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
