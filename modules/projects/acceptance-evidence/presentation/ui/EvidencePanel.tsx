'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useAcceptanceEvidence } from '../hooks/useAcceptanceEvidence'
import { AddEvidenceModal } from './AddEvidenceModal'

interface EvidencePanelProps {
  projectId: string
  deliverableId: string
}

export function EvidencePanel({ projectId, deliverableId }: EvidencePanelProps) {
  const { evidence, loading, addEvidence } = useAcceptanceEvidence(projectId, deliverableId)
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Typography weight="semibold">Evidence</Typography>
        <Button
          size="sm"
          variant="secondary"
          icon={<Plus size={14} />}
          onClick={() => setAddOpen(true)}
        >
          Add
        </Button>
      </div>

      {loading ? (
        <Typography variant="small" tone="muted">
          Loading…
        </Typography>
      ) : evidence.length === 0 ? (
        <Typography variant="small" tone="muted">
          No evidence submitted
        </Typography>
      ) : (
        <ul className="space-y-2">
          {evidence.map((e) => (
            <li
              key={e.id}
              className="flex items-start justify-between gap-2 border border-neutral-100 px-3 py-2"
            >
              <div>
                <Stack direction="horizontal" spacing="sm" className="items-center">
                  <Badge tone="neutral">{e.type}</Badge>
                  <Typography weight="medium">{e.title}</Typography>
                </Stack>
                {e.link && (
                  <Typography variant="small" tone="muted" className="truncate">
                    {e.link}
                  </Typography>
                )}
                {e.referenceNumber && (
                  <Typography variant="small" tone="muted">
                    Ref: {e.referenceNumber}
                  </Typography>
                )}
              </div>
              <Typography variant="small" tone="muted" className="shrink-0">
                {e.submittedAt ? new Date(e.submittedAt).toLocaleDateString() : ''}
              </Typography>
            </li>
          ))}
        </ul>
      )}

      <AddEvidenceModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (body) => {
          try {
            await addEvidence(body)
            toast.success('Evidence added')
          } catch (err) {
            toast.error(getProblemToastMessage(err))
            throw err
          }
        }}
      />
    </div>
  )
}
