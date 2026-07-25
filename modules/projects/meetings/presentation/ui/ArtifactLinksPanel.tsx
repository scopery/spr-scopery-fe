'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Input, Select, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import type { MeetingArtifactLink } from '../../domain/model/artifact-link'
import type { CreateArtifactLinkPayload } from '../../domain/model/artifact-link'

const TARGET_TYPE_OPTIONS = [
  { value: 'TASK', label: 'Task' },
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'DECISION', label: 'Decision' },
  { value: 'RAID_ITEM', label: 'RAID item' },
]

const LINK_TYPE_OPTIONS = [
  { value: 'REFERENCE', label: 'Reference' },
  { value: 'DISCUSSED', label: 'Discussed' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'DECIDED', label: 'Decided' },
  { value: 'ACTION_FOR', label: 'Action for' },
  { value: 'BLOCKED_BY', label: 'Blocked by' },
  { value: 'FOLLOW_UP_FOR', label: 'Follow-up for' },
  { value: 'EVIDENCE', label: 'Evidence' },
]

interface Props {
  artifactLinks: MeetingArtifactLink[]
  onAdd: (body: CreateArtifactLinkPayload) => Promise<unknown>
  onRemove: (linkId: string) => Promise<void>
}

export function ArtifactLinksPanel({ artifactLinks, onAdd, onRemove }: Props) {
  const [targetType, setTargetType] = useState('TASK')
  const [targetId, setTargetId] = useState('')
  const [linkType, setLinkType] = useState('REFERENCE')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!targetId.trim()) return
    setAdding(true)
    try {
      await onAdd({
        targetType,
        targetId: targetId.trim(),
        linkType,
      })
      setTargetId('')
      toast.success('Artifact linked')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (linkId: string) => {
    try {
      await onRemove(linkId)
      toast.success('Link removed')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded border border-neutral-200 p-3">
        <Typography variant="small" weight="medium">Link artifact</Typography>
        <Select
          value={targetType}
          onValueChange={setTargetType}
          options={TARGET_TYPE_OPTIONS}
        />
        <Input
          value={targetId}
          onChange={(e) => setTargetId(e.target.value)}
          placeholder="Target ID (UUID)"
        />
        <Select
          value={linkType}
          onValueChange={setLinkType}
          options={LINK_TYPE_OPTIONS}
        />
        <Button
          size="sm"
          variant="secondary"
          icon={<Plus size={14} />}
          disabled={adding || !targetId.trim()}
          onClick={() => void handleAdd()}
        >
          {adding ? 'Linking…' : 'Link'}
        </Button>
      </div>

      {artifactLinks.length === 0 ? (
        <Typography variant="small" tone="muted">No artifact links</Typography>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">Target ID</th>
                <th className="px-3 py-2 font-medium">Link</th>
                <th className="px-3 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {artifactLinks.map((link) => (
                <tr key={link.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-3 py-2 text-neutral-500">{link.targetType}</td>
                  <td className="px-3 py-2 font-mono text-xs text-neutral-500">{link.targetId}</td>
                  <td className="px-3 py-2 text-neutral-500">{link.linkType}</td>
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
    </div>
  )
}
