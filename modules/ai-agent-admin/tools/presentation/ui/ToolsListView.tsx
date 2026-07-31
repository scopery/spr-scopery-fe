'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { ADMIN_ROUTES } from '@/modules/admin'
import {
  Badge,
  Button,
  ConfirmDialog,
  Input,
  PageSkeleton,
  Select,
  Stack,
  Typography,
  DataTable,
} from '@/shared/ui'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import { TOOL_STATUS_OPTIONS, ToolStatus } from '../../domain/enums/tool.enum'
import { isWriteLikeMutation } from '../../domain/rules/tool.rules'
import type { AiTool } from '../../domain/model/tool'
import { useCanManageTools, useCanViewTools } from '../hooks/useToolPermissions'
import { useToolMutations } from '../hooks/useToolMutations'
import { useTools } from '../hooks/useTools'
import { ToolFormModal } from './ToolFormModal'

const PAGE_SIZE = 20

export function ToolsListView() {
  const canView = useCanViewTools()
  const canManage = useCanManageTools()
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(0)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AiTool | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<AiTool | null>(null)
  const [debugTarget, setDebugTarget] = useState<AiTool | null>(null)

  const params = useMemo(
    () => ({
      q: q.trim() || undefined,
      category: category.trim() || undefined,
      status: (status || '') as '' | 'ACTIVE' | 'INACTIVE' | 'DEPRECATED',
      page,
      size: PAGE_SIZE,
    }),
    [q, category, status, page]
  )

  const { items, totalElements, loading, error, refetch } = useTools(params)
  const { saving, activate, deactivate, execute } = useToolMutations(refetch)
  const totalPages = Math.max(1, Math.ceil(totalElements / PAGE_SIZE))

  if (!canView) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">You do not have permission to view tools.</Typography>
      </Stack>
    )
  }

  if (loading && items.length === 0) {
    return <PageSkeleton variant="list" className="p-lg" />
  }

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Typography variant="h2">Tools</Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block">
            Governed AI tool registry — permissions, agent bindings, and debug execute (stub)
          </Typography>
        </div>
        {canManage ? (
          <Button
            size="sm"
            onClick={() => {
              setEditing(null)
              setFormOpen(true)
            }}
          >
            Create tool
          </Button>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-sm">
        <div className="min-w-[160px] flex-1">
          <Input
            placeholder="Search…"
            value={q}
            onChange={(e) => {
              setQ(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="w-40">
          <Input
            placeholder="Category"
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setPage(0)
            }}
          />
        </div>
        <div className="w-40">
          <Select
            value={status}
            onValueChange={(v: string) => {
              setStatus(v || '')
              setPage(0)
            }}
            options={[
              { value: '', label: 'All statuses' },
              ...TOOL_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
            ]}
          />
        </div>
      </div>

      {error ? (
        <Typography tone="error" variant="small">
          {error}
        </Typography>
      ) : null}

      <div className="overflow-x-auto border border-neutral-200">
        <DataTable
          ariaLabel="Tools List"
          rows={items}
          rowKey={(tool) => String(tool.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'code',
              header: 'Code',
              accessor: 'code',
              kind: 'code',
              cellClassName: 'text-xs',
            },
            {
              id: 'name',
              header: 'Name',
              cell: (tool) => (
                <>
                  <Button
                    as={NextLink}
                    href={ADMIN_ROUTES.aiControlTool(tool.id)}
                    size="sm"
                    variant="ghost"
                    className="px-0"
                  >
                    {tool.name}
                  </Button>
                </>
              ),
            },
            { id: 'category', header: 'Category', cell: (tool) => <>{tool.category || '—'}</> },
            {
              id: 'mutation',
              header: 'Mutation',
              cell: (tool) => (
                <>
                  {tool.mutationType ? (
                    <Badge tone={isWriteLikeMutation(tool.mutationType) ? 'warning' : 'neutral'}>
                      {tool.mutationType}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </>
              ),
            },
            {
              id: 'approval',
              header: 'Approval',
              cell: (tool) => <>{tool.requiresHumanApproval ? 'Yes' : 'No'}</>,
            },
            {
              id: 'status',
              header: 'Status',
              cell: (tool) => (
                <>
                  <AiLifecycleStatusBadge status={tool.status} />
                </>
              ),
            },
            { id: 'perms', header: 'Perms', cell: (tool) => <>{tool.permissionCount ?? '—'}</> },
            {
              id: 'agents',
              header: 'Agents',
              cell: (tool) => <>{tool.agentBindingCount ?? '—'}</>,
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (tool) => (
                <>
                  <div className="flex flex-wrap gap-xs">
                    {canManage ? (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(tool)
                            setFormOpen(true)
                          }}
                        >
                          Edit
                        </Button>
                        {tool.status !== ToolStatus.Active ? (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={saving}
                            onClick={() => void activate(tool.id)}
                          >
                            Activate
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeactivateTarget(tool)}
                          >
                            Deactivate
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setDebugTarget(tool)}>
                          Debug
                        </Button>
                      </>
                    ) : null}
                  </div>
                </>
              ),
            },
          ]}
        />
      </div>

      <div className="flex items-center justify-between gap-sm">
        <Typography variant="caption" tone="muted">
          Page {page + 1} of {totalPages} · {totalElements} total
        </Typography>
        <div className="flex gap-sm">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>

      <ToolFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        tool={editing}
        onSaved={() => void refetch()}
      />
      <ConfirmDialog
        open={deactivateTarget != null}
        onClose={() => setDeactivateTarget(null)}
        title="Deactivate tool"
        message={`Deactivate “${deactivateTarget?.name}”?`}
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() =>
          deactivateTarget
            ? void deactivate(deactivateTarget.id).then(() => setDeactivateTarget(null))
            : undefined
        }
      />
      <ConfirmDialog
        open={debugTarget != null}
        onClose={() => setDebugTarget(null)}
        title="Debug execution"
        message={
          debugTarget
            ? isWriteLikeMutation(debugTarget.mutationType)
              ? `Debug execute “${debugTarget.name}” (${debugTarget.mutationType})? This is a stub/no-op for admin debugging — not a production business run.`
              : `Debug execute “${debugTarget.name}”? Stub/no-op only — not production execution.`
            : ''
        }
        confirmLabel="Run debug"
        variant={
          debugTarget && isWriteLikeMutation(debugTarget.mutationType) ? 'danger' : 'default'
        }
        onConfirm={() =>
          debugTarget ? void execute(debugTarget.id).then(() => setDebugTarget(null)) : undefined
        }
      />
    </Stack>
  )
}
