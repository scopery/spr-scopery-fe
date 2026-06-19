'use client'

import { FileText, Plus } from 'lucide-react'
import { Typography, Button } from '@/shared/ui'
import type { EmptyDocumentsStateProps } from '../model/create-document-modal'

export function EmptyDocumentsState({ canCreate, onCreate }: EmptyDocumentsStateProps) {
  return (
    <div className="border border-neutral-200 bg-white p-12 text-center">
      <FileText className="mx-auto mb-4 text-neutral-400" size={40} aria-hidden />
      <Typography as="h3" weight="medium" className="mb-2">
        No documents yet
      </Typography>
      <Typography tone="muted" className="mx-auto mb-6 max-w-md">
        Documents help collect project knowledge — notes, decisions, research, and summaries in one
        place.
      </Typography>
      {canCreate && (
        <Button variant="primary" onClick={onCreate}>
          <Plus size={16} className="mr-2 inline" aria-hidden />
          Create first document
        </Button>
      )}
    </div>
  )
}
