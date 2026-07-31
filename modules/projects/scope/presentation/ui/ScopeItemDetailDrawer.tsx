'use client'

import { X } from 'lucide-react'
import { Badge, Button, Stack, Typography } from '@/shared/ui'
import type { ScopeItem } from '../../domain/model/scope'
import {
  scopeItemClassificationLabel,
  scopeItemPriorityLabel,
} from '../../domain/rules/scope.rules'
import { ScopeMappingPanel } from '@/modules/projects/scope-mappings'

interface ScopeItemDetailDrawerProps {
  item: ScopeItem | null
  open: boolean
  acting?: boolean
  onClose: () => void
  onClassify: (item: ScopeItem, classification: 'in' | 'out' | 'unclassified') => Promise<void>
  onArchive: (item: ScopeItem) => Promise<void>
}

export function ScopeItemDetailDrawer({
  item,
  open,
  acting,
  onClose,
  onClassify,
  onArchive,
}: ScopeItemDetailDrawerProps) {
  if (!open || !item) return null

  const classification = scopeItemClassificationLabel(item)

  return (
    <>
      <div
        className="bg-neutral-900/[0.18] motion-drawer-backdrop fixed inset-0 z-40"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className="drawer motion-drawer-panel fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-neutral-200 bg-white shadow-xl"
        role="dialog"
        aria-label="Scope item detail"
      >
        <div className="flex items-start justify-between gap-3 border-b border-neutral-200 px-5 py-4">
          <div className="min-w-0">
            <Typography variant="small" className="font-mono text-neutral-500">
              {item.code}
            </Typography>
            <Typography as="h2" weight="semibold" className="truncate">
              {item.title}
            </Typography>
            <Stack direction="horizontal" spacing="sm" className="mt-2 items-center">
              <Badge tone={item.outOfScope ? 'warning' : item.inScope ? 'success' : 'neutral'}>
                {classification}
              </Badge>
              <Badge tone="neutral">{scopeItemPriorityLabel(item.priority)}</Badge>
            </Stack>
          </div>
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            aria-label="Close"
            onClick={onClose}
            icon={<X size={16} />}
          />
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div>
            <Typography variant="small" tone="muted">
              Description
            </Typography>
            <Typography className="mt-1 whitespace-pre-wrap">{item.description || '—'}</Typography>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <Typography variant="small" tone="muted">
                Type
              </Typography>
              <Typography>{item.type}</Typography>
            </div>
            <div>
              <Typography variant="small" tone="muted">
                Status
              </Typography>
              <Typography>{item.status}</Typography>
            </div>
            <div>
              <Typography variant="small" tone="muted">
                Acceptance required
              </Typography>
              <Typography>{item.acceptanceRequired ? 'Yes' : 'No'}</Typography>
            </div>
            <div>
              <Typography variant="small" tone="muted">
                Sort order
              </Typography>
              <Typography>{item.sortOrder}</Typography>
            </div>
          </div>

          <div className="border-t border-neutral-200 pt-4">
            <ScopeMappingPanel scopeItemId={item.id} projectId={item.projectId} />
          </div>
        </div>

        <div className="space-y-3 border-t border-neutral-200 px-5 py-4">
          <Typography variant="small" tone="muted">
            Classify
          </Typography>
          <Stack direction="horizontal" spacing="sm" className="flex-wrap">
            <Button
              size="sm"
              variant={item.inScope ? 'primary' : 'secondary'}
              disabled={acting}
              onClick={() => void onClassify(item, 'in')}
            >
              In scope
            </Button>
            <Button
              size="sm"
              variant={item.outOfScope ? 'primary' : 'secondary'}
              disabled={acting}
              onClick={() => void onClassify(item, 'out')}
            >
              Out of scope
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={acting || item.status === 'ARCHIVED'}
              onClick={() => void onArchive(item)}
            >
              Archive
            </Button>
          </Stack>
        </div>
      </aside>
    </>
  )
}
