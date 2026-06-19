import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeliverableDocumentSetPicker } from '@/modules/documents'
import * as deliverablesApi from '../api/deliverables.api'

vi.mock('../api/deliverables.api')

const mockSearch = vi.mocked(deliverablesApi.searchDeliverablePickerDocuments)

describe('DeliverableDocumentSetPicker', () => {
  beforeEach(() => {
    mockSearch.mockReset()
    mockSearch
      .mockResolvedValueOnce({
        items: [
          {
            id: 'd1',
            title: 'Doc 1',
            document_type: 'note',
            workflow_status: 'draft',
            status: 'active',
            updated_at: '',
            project_id: 'p1',
          },
        ],
        total: 2,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: 'd2',
            title: 'Doc 2',
            document_type: 'note',
            workflow_status: 'draft',
            status: 'active',
            updated_at: '',
            project_id: 'p1',
          },
        ],
        total: 2,
      })
  })

  it('renders load more when more results exist', async () => {
    render(
      <DeliverableDocumentSetPicker
        orgId="org-1"
        projectId="proj-1"
        selectedIds={[]}
        onSelectionChange={() => {}}
        includeArchived={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByText(/Showing 1 of 2 documents/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Load more/i })).toBeInTheDocument()
  })

  it('preserves selected items across pages', async () => {
    const onSelectionChange = vi.fn()

    render(
      <DeliverableDocumentSetPicker
        orgId="org-1"
        projectId="proj-1"
        selectedIds={['d1']}
        onSelectionChange={onSelectionChange}
        includeArchived={false}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Doc 1')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /Load more/i }))

    await waitFor(() => {
      expect(screen.getByText('Doc 2')).toBeInTheDocument()
    })

    const d1Checkbox = screen.getAllByRole('checkbox')[0]
    expect(d1Checkbox).toBeChecked()
  })
})
