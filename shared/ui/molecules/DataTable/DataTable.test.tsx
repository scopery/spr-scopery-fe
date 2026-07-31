import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { DataTable, type DataTableColumn } from './DataTable'

interface Row {
  id: string
  code: string
  title: string
  owner: string
}

const row: Row = {
  id: 'row-1',
  code: 'FR-001',
  title: 'Readable title',
  owner: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
}

const columns: DataTableColumn<Row>[] = [
  { id: 'code', header: 'Code', accessor: 'code', kind: 'code' },
  { id: 'title', header: 'Title', accessor: 'title' },
  { id: 'owner', header: 'Owner', accessor: 'owner', kind: 'reference' },
]

describe('DataTable', () => {
  it('uses catalog header and regular code typography', () => {
    render(
      <DataTable ariaLabel="Catalog" rows={[row]} rowKey={(item) => item.id} columns={columns} />
    )

    expect(screen.getByRole('columnheader', { name: 'Code' })).toHaveClass(
      'font-calsans',
      'font-normal'
    )
    expect(screen.getByText('FR-001')).toHaveClass('font-normal')
    expect(screen.getByText('FR-001')).not.toHaveClass('font-mono', 'font-bold')
  })

  it('does not expose technical IDs from reference columns', () => {
    render(
      <DataTable ariaLabel="Catalog" rows={[row]} rowKey={(item) => item.id} columns={columns} />
    )

    expect(screen.queryByText(row.owner)).not.toBeInTheDocument()
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  it('opens the focused row with Enter', () => {
    const onRowClick = vi.fn()
    render(
      <DataTable
        ariaLabel="Catalog"
        rows={[row]}
        rowKey={(item) => item.id}
        columns={columns}
        onRowClick={onRowClick}
      />
    )

    fireEvent.keyDown(screen.getByRole('table', { name: 'Catalog' }), { key: 'Enter' })
    expect(onRowClick).toHaveBeenCalledWith(row)
  })
})
