'use client'

import { Modal, Select, Typography } from '@/shared/ui'
import {
  DOCUMENT_LINK_ENTITY_OPTIONS,
  DOCUMENT_RELATION_OPTIONS,
  type DocumentLinkedEntityType,
  type DocumentRelationType,
} from '@/modules/documents/document-links'
import type { AddDocumentLinkDialogViewProps } from '../model/document-links'

export function AddDocumentLinkDialogView({
  open,
  loading,
  loadingTargets,
  entityType,
  relationType,
  sessionId,
  targetId,
  sessionOptions,
  targetOptions,
  onClose,
  onSubmit,
  onEntityTypeChange,
  onRelationTypeChange,
  onSessionIdChange,
  onTargetIdChange,
}: AddDocumentLinkDialogViewProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add evidence link"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        { label: 'Add link', onClick: onSubmit, variant: 'primary', loading },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Link this document to a session, answer, requirement, or trace item as supporting
          evidence.
        </Typography>

        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Relation
          </Typography>
          <Select
            value={relationType}
            onValueChange={(v: string) => onRelationTypeChange(v as DocumentRelationType)}
            options={DOCUMENT_RELATION_OPTIONS}
          />
        </div>

        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Entity type
          </Typography>
          <Select
            value={entityType}
            onValueChange={(v: string) => onEntityTypeChange(v as DocumentLinkedEntityType)}
            options={DOCUMENT_LINK_ENTITY_OPTIONS}
          />
        </div>

        {entityType === 'answer' && (
          <div>
            <Typography variant="small" weight="medium" className="mb-1 block">
              Session
            </Typography>
            <Select
              value={sessionId}
              onValueChange={onSessionIdChange}
              options={sessionOptions}
              placeholder={loadingTargets ? 'Loading sessions…' : 'Select session'}
            />
          </div>
        )}

        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Target
          </Typography>
          <Select
            value={targetId}
            onValueChange={onTargetIdChange}
            options={targetOptions}
            placeholder={loadingTargets ? 'Loading…' : 'Select target'}
          />
        </div>
      </div>
    </Modal>
  )
}
