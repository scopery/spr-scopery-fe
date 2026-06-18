'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button, Typography } from '@/shared/ui'
import { EntityEvidenceDocumentsPanel } from './EntityEvidenceDocumentsPanel'

interface AnswerEvidenceStripProps {
  orgId: string
  projectId: string
  sessionId: string
  questionId: string
  canView: boolean
  canCreateLink: boolean
  canRemoveLink: boolean
  canRestoreDocument?: boolean
}

export function AnswerEvidenceStrip({
  orgId,
  projectId,
  sessionId,
  questionId,
  canView,
  canCreateLink,
  canRemoveLink,
  canRestoreDocument,
}: AnswerEvidenceStripProps) {
  const [expanded, setExpanded] = useState(false)

  if (!canView) return null

  return (
    <div className="mt-4 border-t border-neutral-100 pt-3">
      <Button
        variant="ghost"
        size="sm"
        className="gap-1.5 px-0 h-auto"
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        <Typography variant="small" weight="medium">
          Answer evidence
        </Typography>
      </Button>
      {expanded && (
        <div className="mt-2">
          <EntityEvidenceDocumentsPanel
            orgId={orgId}
            projectId={projectId}
            linkedEntityType="answer"
            linkedEntityId={questionId}
            sessionId={sessionId}
            canView={canView}
            canCreateLink={canCreateLink}
            canRemoveLink={canRemoveLink}
            canRestoreDocument={canRestoreDocument}
            enableBulkLink={false}
            title="Linked documents"
            emptyStateText="No evidence documents linked to this answer yet."
            compact
          />
        </div>
      )}
    </div>
  )
}
