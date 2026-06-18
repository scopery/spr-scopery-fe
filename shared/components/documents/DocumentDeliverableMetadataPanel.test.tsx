import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DocumentDeliverableMetadataPanel } from './DocumentDeliverableMetadataPanel'
import * as deliverablesService from '@/services/document-deliverables.service'

vi.mock('@/services/document-deliverables.service')

const mockGetMetadata = vi.mocked(deliverablesService.getDocumentDeliverableMetadata)
const mockRefresh = vi.mocked(deliverablesService.refreshDocumentDeliverableReadiness)

const readyMetadata = {
  document_id: 'doc-1',
  project_id: 'proj-1',
  is_generated_deliverable: true,
  document_type: 'project_brief' as const,
  workflow_status: 'draft' as const,
  origin_type: 'template_generated',
  generated_by_ai: false,
  deliverable_type: 'project_brief' as const,
  template_id: 'tpl-1',
  template_key: 'project_brief',
  template_name: 'Project Brief',
  entry_point: 'project_documents' as const,
  selected_document_count: 0,
  source_entity: {
    source_entity_type: 'project' as const,
    source_entity_id: 'proj-1',
    source_entity_label: 'Alpha',
    source_entity_accessible: true,
    source_entity_path: '/org/org-1/projects/proj-1/documents',
  },
  readiness: {
    readiness_status: 'ready' as const,
    warnings: [],
    blocking_issues: [],
    suggested_actions: [],
    warning_count: 0,
    blocking_issue_count: 0,
    computed_at: '2026-01-01T00:00:00.000Z',
    source: 'stored' as const,
    stale: false,
  },
}

describe('DocumentDeliverableMetadataPanel', () => {
  beforeEach(() => {
    mockGetMetadata.mockReset()
    mockRefresh.mockReset()
  })

  it('renders ready state for generated deliverable', async () => {
    mockGetMetadata.mockResolvedValue(readyMetadata)

    render(
      <DocumentDeliverableMetadataPanel
        orgId="org-1"
        documentId="doc-1"
        projectId="proj-1"
        canRefresh={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Generated deliverable/i)).toBeInTheDocument()
    })
    expect(screen.getByText('Ready')).toBeInTheDocument()
  })

  it('renders stale readiness state', async () => {
    mockGetMetadata.mockResolvedValue({
      ...readyMetadata,
      readiness: {
        ...readyMetadata.readiness,
        readiness_status: 'needs_review',
        stale: true,
        warning_count: 1,
        warnings: [{ code: 'no_requirements', message: 'No requirements found.' }],
      },
    })

    render(
      <DocumentDeliverableMetadataPanel
        orgId="org-1"
        documentId="doc-1"
        projectId="proj-1"
        canRefresh
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Readiness may be outdated/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Refresh readiness/i })).toBeInTheDocument()
  })

  it('renders missing readiness state when computed_at is null and not stale', async () => {
    mockGetMetadata.mockResolvedValue({
      ...readyMetadata,
      readiness: {
        ...readyMetadata.readiness,
        readiness_status: 'needs_review',
        computed_at: null,
        stale: false,
      },
    })

    render(
      <DocumentDeliverableMetadataPanel
        orgId="org-1"
        documentId="doc-1"
        projectId="proj-1"
        canRefresh
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Readiness not available/i)).toBeInTheDocument()
    })
  })

  it('calls refresh service and updates readiness', async () => {
    mockGetMetadata.mockResolvedValue(readyMetadata)
    mockRefresh.mockResolvedValue({
      readiness: {
        ...readyMetadata.readiness,
        readiness_status: 'ready',
        computed_at: '2026-05-01T00:00:00.000Z',
        source: 'recomputed' as const,
        stale: false,
      },
    })

    render(
      <DocumentDeliverableMetadataPanel
        orgId="org-1"
        documentId="doc-1"
        projectId="proj-1"
        canRefresh
      />
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Refresh readiness/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Refresh readiness/i }))

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledWith('org-1', 'doc-1', 'proj-1')
    })
  })

  it('returns null for non-generated documents', async () => {
    mockGetMetadata.mockResolvedValue({ ...readyMetadata, is_generated_deliverable: false })

    const { container } = render(
      <DocumentDeliverableMetadataPanel
        orgId="org-1"
        documentId="doc-1"
        projectId="proj-1"
      />
    )

    await waitFor(() => {
      expect(container.firstChild).toBeNull()
    })
  })
})
