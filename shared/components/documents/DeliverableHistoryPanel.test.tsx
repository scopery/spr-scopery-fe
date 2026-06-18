import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeliverableHistoryPanel } from './DeliverableHistoryPanel'
import * as deliverablesService from '@/services/document-deliverables.service'
import type { DeliverableHistoryItem } from '@/types/document-deliverable'

vi.mock('@/services/document-deliverables.service')
vi.mock('@/utils/exportDownload', () => ({
  downloadSingleDocumentExport: vi.fn(),
}))
vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

const mockList = vi.mocked(deliverablesService.listDeliverableHistory)

function makeItem(overrides: Partial<DeliverableHistoryItem> = {}): DeliverableHistoryItem {
  return {
    document_id: 'doc-1',
    title: 'Project Brief',
    document_type: 'project_brief',
    workflow_status: 'draft',
    status: 'active',
    deliverable_type: 'project_brief',
    template_key: 'project_brief',
    template_name: 'Project Brief Template',
    source_entity_type: 'project',
    entry_point: 'project_documents',
    readiness_status: 'ready',
    warning_count: 0,
    blocking_issue_count: 0,
    readiness_stale: false,
    readiness_computed_at: '2026-01-01T00:00:00.000Z',
    readiness_source: 'stored',
    created_by_display_name: 'Alice',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('DeliverableHistoryPanel', () => {
  beforeEach(() => {
    mockList.mockReset()
  })

  it('renders readiness badge for history items', async () => {
    mockList.mockResolvedValue({
      items: [makeItem({ readiness_status: 'ready' })],
      total: 1,
    })

    render(<DeliverableHistoryPanel orgId="org-1" projectId="proj-1" />)

    await waitFor(() => {
      expect(screen.getByText('Ready')).toBeInTheDocument()
    })
  })

  it('renders needs_review badge with warning count', async () => {
    mockList.mockResolvedValue({
      items: [makeItem({ readiness_status: 'needs_review', warning_count: 2 })],
      total: 1,
    })

    render(<DeliverableHistoryPanel orgId="org-1" projectId="proj-1" />)

    await waitFor(() => {
      expect(screen.getByText('Needs review (2)')).toBeInTheDocument()
    })
  })

  it('shows stale indicator when readiness is outdated', async () => {
    mockList.mockResolvedValue({
      items: [makeItem({ readiness_stale: true, readiness_status: 'needs_review', warning_count: 1 })],
      total: 1,
    })

    render(<DeliverableHistoryPanel orgId="org-1" projectId="proj-1" />)

    await waitFor(() => {
      expect(screen.getByText(/may be outdated/i)).toBeInTheDocument()
    })
  })

  it('shows recomputed note when readiness_source is recomputed', async () => {
    mockList.mockResolvedValue({
      items: [makeItem({ readiness_source: 'recomputed', readiness_status: 'needs_review' })],
      total: 1,
    })

    render(<DeliverableHistoryPanel orgId="org-1" projectId="proj-1" />)

    await waitFor(() => {
      expect(screen.getByText(/readiness refreshed on load/i)).toBeInTheDocument()
    })
  })

  it('shows load more button when more items exist', async () => {
    mockList.mockResolvedValue({
      items: [makeItem()],
      total: 3,
    })

    render(<DeliverableHistoryPanel orgId="org-1" projectId="proj-1" />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Load more/i })).toBeInTheDocument()
    })
    expect(screen.getByText(/Showing 1 of 3/i)).toBeInTheDocument()
  })

  it('hides load more when all items are loaded', async () => {
    mockList.mockResolvedValue({
      items: [makeItem({ title: 'Alpha Summary' })],
      total: 1,
    })

    render(<DeliverableHistoryPanel orgId="org-1" projectId="proj-1" />)

    await waitFor(() => {
      expect(screen.getByText('Alpha Summary')).toBeInTheDocument()
    })
    expect(screen.queryByRole('button', { name: /Load more/i })).toBeNull()
  })

  it('appends items on load more click', async () => {
    mockList
      .mockResolvedValueOnce({
        items: [makeItem({ document_id: 'doc-1', title: 'Brief 1' })],
        total: 2,
      })
      .mockResolvedValueOnce({
        items: [makeItem({ document_id: 'doc-2', title: 'Brief 2' })],
        total: 2,
      })

    render(<DeliverableHistoryPanel orgId="org-1" projectId="proj-1" />)

    await waitFor(() => {
      expect(screen.getByText('Brief 1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Load more/i }))

    await waitFor(() => {
      expect(screen.getByText('Brief 2')).toBeInTheDocument()
    })
    expect(screen.getByText('Brief 1')).toBeInTheDocument()
  })

  it('shows empty state when no items match filters', async () => {
    mockList.mockResolvedValue({ items: [], total: 0 })

    render(<DeliverableHistoryPanel orgId="org-1" projectId="proj-1" />)

    await waitFor(() => {
      expect(screen.getByText(/No generated deliverables match your filters/i)).toBeInTheDocument()
    })
  })
})
