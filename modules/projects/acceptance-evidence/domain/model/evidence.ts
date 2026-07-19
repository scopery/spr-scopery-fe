import type { EvidenceType } from '../enums/evidence.enum'

export interface AcceptanceEvidence {
  id: string
  projectId: string
  deliverableId: string
  criteriaId: string | null
  type: EvidenceType | string
  title: string
  link: string | null
  referenceNumber: string | null
  submittedBy: string | null
  submittedAt: string | null
}

export interface AddEvidencePayload {
  type: EvidenceType | string
  title: string
  criteriaId?: string | null
  link?: string | null
  referenceNumber?: string | null
}
