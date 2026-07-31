'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  DataTable,
  Input,
  Modal,
  PageSkeleton,
  Select,
  Textarea,
  Typography,
} from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useVerificationCaseCatalog } from '../hooks/useVerificationCaseCatalog'
import { useQualityAssigneePeople } from '../hooks/useQualityAssigneePeople'
import { VerificationCaseDetailDrawer } from './VerificationCaseDetailDrawer'
import { TraceEntitySearchSelect } from './TraceEntitySearchSelect'
import type { CreateVerificationCasePayload } from '../../domain/model/quality'

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  ...['DRAFT', 'READY', 'DEPRECATED', 'ARCHIVED'].map((value) => ({
    value,
    label: value,
  })),
]

const METHOD_OPTIONS = [
  'LOAD_TEST',
  'PERFORMANCE_TEST',
  'SECURITY_SCAN',
  'PENETRATION_TEST',
  'AVAILABILITY_CHECK',
  'ACCESSIBILITY_AUDIT',
  'COMPLIANCE_REVIEW',
  'MANUAL_REVIEW',
  'MONITORING_CHECK',
].map((value) => ({ value, label: value.replace(/_/g, ' ') }))
const NFR_REQUIREMENT_TYPES = ['NFR', 'NON_FUNCTIONAL']

function statusTone(status: string): 'neutral' | 'success' | 'warning' | 'error' {
  if (status === 'READY') return 'success'
  if (status === 'DEPRECATED') return 'warning'
  if (status === 'ARCHIVED') return 'error'
  return 'neutral'
}

export function VerificationCaseCatalogView() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()
  const catalog = useVerificationCaseCatalog(projectId)
  const { people: assigneePeople } = useQualityAssigneePeople(workspaceId)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<CreateVerificationCasePayload>({
    requirementId: '',
    title: '',
    verificationMethod: 'PERFORMANCE_TEST',
  })

  const pageLabel = useMemo(() => {
    const from = catalog.total === 0 ? 0 : catalog.offset + 1
    const to = Math.min(catalog.offset + catalog.pageSize, catalog.total)
    return `${from}–${to} of ${catalog.total}`
  }, [catalog.offset, catalog.pageSize, catalog.total])

  const handleCreate = async () => {
    if (!draft.requirementId.trim() || !draft.title.trim()) {
      toast.error('Requirement and title are required')
      return
    }
    setCreating(true)
    try {
      const created = await catalog.create({
        ...draft,
        requirementId: draft.requirementId.trim(),
        title: draft.title.trim(),
      })
      toast.success('Verification Case created')
      setCreateOpen(false)
      setDraft({
        requirementId: '',
        title: '',
        verificationMethod: 'PERFORMANCE_TEST',
      })
      if (created) setDetailId(created.id)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setCreating(false)
    }
  }

  if (catalog.loading && catalog.items.length === 0) {
    return <PageSkeleton variant="list" />
  }

  return (
    <div className="space-y-md px-3 py-3 lg:px-4 lg:py-3">
      <div className="flex flex-wrap items-end justify-between gap-md border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Verification Cases
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-0.5">
            NFR verification procedures linked to non-functional requirements.
          </Typography>
        </div>
        <Button type="button" icon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>
          Add Verification Case
        </Button>
      </div>

      <div className="flex flex-wrap gap-sm">
        <div className="min-w-[220px] flex-1">
          <Input
            prefix={<Search size={16} />}
            placeholder="Search code, title, method…"
            value={catalog.query}
            onChange={(event) => catalog.setQuery(event.target.value)}
          />
        </div>
        <Select
          value={catalog.status}
          options={STATUS_OPTIONS}
          onValueChange={catalog.setStatus}
          className="w-[180px]"
        />
        <div className="w-[280px]">
          <TraceEntitySearchSelect
            workspaceId={workspaceId}
            projectId={projectId}
            entityType="REQUIREMENT"
            label="Requirement"
            requirementTypes={NFR_REQUIREMENT_TYPES}
            allowClear
            value={catalog.requirementId}
            onChange={catalog.setRequirementId}
          />
        </div>
      </div>

      {catalog.error ? (
        <Typography tone="error">{catalog.error}</Typography>
      ) : (
        <DataTable
          className="rounded-md border border-neutral-200"
          ariaLabel="Verification cases"
          rows={catalog.items}
          rowKey={(item) => item.id}
          emptyMessage="No Verification Cases yet."
          onRowClick={(item) => setDetailId(item.id)}
          columns={[
            { id: 'code', header: 'Code', accessor: (item) => item.code ?? '—', kind: 'code' },
            { id: 'title', header: 'Title', accessor: 'title' },
            {
              id: 'method',
              header: 'Method',
              accessor: (item) => String(item.verificationMethod).replace(/_/g, ' '),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (item) => (
                <Badge tone={statusTone(String(item.lifecycleStatus))}>
                  {item.lifecycleStatus}
                </Badge>
              ),
            },
            {
              id: 'requirement',
              header: 'Requirement',
              accessor: () => '—',
              kind: 'reference',
            },
            {
              id: 'automation',
              header: 'Automation',
              accessor: (item) => item.automationStatus ?? 'MANUAL',
            },
          ]}
        />
      )}

      <div className="flex items-center justify-between">
        <Typography variant="caption" tone="muted">
          {pageLabel}
        </Typography>
        <div className="flex gap-xs">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={catalog.offset <= 0}
            icon={<ChevronLeft size={16} />}
            onClick={() => catalog.setOffset(Math.max(0, catalog.offset - catalog.pageSize))}
          >
            Prev
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={catalog.offset + catalog.pageSize >= catalog.total}
            iconRight={<ChevronRight size={16} />}
            onClick={() => catalog.setOffset(catalog.offset + catalog.pageSize)}
          >
            Next
          </Button>
        </div>
      </div>

      <VerificationCaseDetailDrawer
        projectId={projectId}
        verificationCaseId={detailId}
        assigneePeople={assigneePeople}
        onClose={() => setDetailId(null)}
        onChanged={() => void catalog.refetch()}
      />

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Add Verification Case"
        actions={[
          {
            label: 'Cancel',
            variant: 'ghost',
            onClick: () => setCreateOpen(false),
            disabled: creating,
          },
          {
            label: creating ? 'Creating…' : 'Create',
            variant: 'primary',
            onClick: () => void handleCreate(),
            disabled: creating,
          },
        ]}
      >
        <div className="space-y-md">
          <TraceEntitySearchSelect
            workspaceId={workspaceId}
            projectId={projectId}
            entityType="REQUIREMENT"
            label="Non-functional Requirement"
            requirementTypes={NFR_REQUIREMENT_TYPES}
            required
            value={draft.requirementId}
            onChange={(requirementId) => setDraft((current) => ({ ...current, requirementId }))}
          />
          <Input
            label="Title"
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
          />
          <Select
            label="Verification method"
            value={String(draft.verificationMethod)}
            options={METHOD_OPTIONS}
            onValueChange={(value: string) =>
              setDraft((current) => ({ ...current, verificationMethod: value }))
            }
          />
          <Textarea
            label="Procedure"
            value={draft.procedure ?? ''}
            rows={4}
            onChange={(event) =>
              setDraft((current) => ({ ...current, procedure: event.target.value }))
            }
          />
        </div>
      </Modal>
    </div>
  )
}
