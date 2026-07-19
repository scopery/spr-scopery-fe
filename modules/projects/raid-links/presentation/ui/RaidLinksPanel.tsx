'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useRaidLinks } from '../hooks/useRaidLinks'
import { AddRaidLinkModal } from './AddRaidLinkModal'
import { RaidLinkTargetType, RaidLinkType } from '../../domain/enums/raid-link.enum'

function targetTypeLabel(t: string): string {
  switch (t) {
    case RaidLinkTargetType.RaidItem: return 'RAID item'
    case RaidLinkTargetType.Decision: return 'Decision'
    case RaidLinkTargetType.Task: return 'Task'
    case RaidLinkTargetType.Deliverable: return 'Deliverable'
    default: return t
  }
}

function linkTypeLabel(l: string): string {
  switch (l) {
    case RaidLinkType.RelatedTo: return 'Related to'
    case RaidLinkType.BlockedBy: return 'Blocked by'
    case RaidLinkType.Blocks: return 'Blocks'
    case RaidLinkType.DuplicateOf: return 'Duplicate of'
    default: return l
  }
}

interface Props {
  projectId: string
  raidItemId: string
}

export function RaidLinksPanel({ projectId, raidItemId }: Props) {
  const { links, loading, createLink, removeLink } = useRaidLinks(projectId, raidItemId)
  const [addOpen, setAddOpen] = useState(false)

  const handleRemove = async (linkId: string) => {
    try {
      await removeLink(linkId)
      toast.success('Link removed')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Typography variant="small" weight="medium" tone="muted">
          Links
        </Typography>
        <Button
          size="sm"
          variant="secondary"
          icon={<Plus size={14} />}
          onClick={() => setAddOpen(true)}
        >
          Add link
        </Button>
      </div>

      {loading && links.length === 0 ? (
        <Typography variant="small" tone="muted">Loading…</Typography>
      ) : links.length === 0 ? (
        <Typography variant="small" tone="muted">No links yet</Typography>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">Relationship</th>
                <th className="px-3 py-2 font-medium">Target type</th>
                <th className="px-3 py-2 font-medium">Target ID</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {links.map((link) => (
                <tr key={link.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-3 py-2">
                    <Badge tone="neutral">{linkTypeLabel(link.linkType)}</Badge>
                  </td>
                  <td className="px-3 py-2 text-neutral-500">{targetTypeLabel(link.targetType)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-neutral-500">{link.targetId}</td>
                  <td className="px-3 py-2">
                    <Stack direction="horizontal" spacing="sm">
                      <Button
                        size="sm"
                        variant="ghost"
                        tone="error"
                        icon={<Trash2 size={14} />}
                        onClick={() => void handleRemove(link.id)}
                      >
                        Remove
                      </Button>
                    </Stack>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddRaidLinkModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (body) => {
          await createLink(body)
          toast.success('Link added')
        }}
      />
    </div>
  )
}
