import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TodoList } from './TodoList'
import type { TodoItem } from './TodoList.types'

describe('TodoList', () => {
  const mockItems: TodoItem[] = [
    {
      id: '1',
      title: 'Update button styles to match guidelines',
      date: 'Mar 24th',
      status: 'blocking',
    },
    {
      id: '2',
      title: 'Sync with UX team to refine user flows',
      date: 'Mar 24th',
      status: 'essential',
      expanded: true,
      description: 'Design low-fidelity wireframes for the new landing page',
      assignee: {
        name: 'Kaylynn Siphron',
      },
    },
  ]

  it('renders with title', () => {
    render(<TodoList items={mockItems} />)
    expect(screen.getByText('To do list')).toBeInTheDocument()
  })

  it('renders custom title', () => {
    render(<TodoList title="My Tasks" items={mockItems} />)
    expect(screen.getByText('My Tasks')).toBeInTheDocument()
  })

  it('renders all todo items', () => {
    render(<TodoList items={mockItems} />)
    expect(screen.getByText('Update button styles to match guidelines')).toBeInTheDocument()
    expect(screen.getByText('Sync with UX team to refine user flows')).toBeInTheDocument()
  })

  it('renders dates and status badges', () => {
    render(<TodoList items={mockItems} />)
    const dates = screen.getAllByText('Mar 24th')
    expect(dates.length).toBeGreaterThan(0)
    expect(screen.getByText('Blocking')).toBeInTheDocument()
    expect(screen.getByText('Essential')).toBeInTheDocument()
  })

  it('renders expanded content when item is expanded', () => {
    render(<TodoList items={mockItems} />)
    expect(screen.getByText('Design low-fidelity wireframes for the new landing page')).toBeInTheDocument()
    expect(screen.getByText('Kaylynn Siphron')).toBeInTheDocument()
    expect(screen.getByText('(Assignee)')).toBeInTheDocument()
  })

  it('calls onAdd when add button is clicked', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<TodoList items={mockItems} onAdd={onAdd} />)
    
    const addButton = screen.getByLabelText('Add new task')
    await user.click(addButton)
    
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('calls onExpand when expand button is clicked', async () => {
    const user = userEvent.setup()
    const onExpand = vi.fn()
    render(<TodoList items={mockItems} onExpand={onExpand} />)
    
    const expandButton = screen.getByLabelText('Expand Update button styles to match guidelines')
    await user.click(expandButton)
    
    expect(onExpand).toHaveBeenCalledWith('1', true)
  })

  it('does not render add button when onAdd is not provided', () => {
    render(<TodoList items={mockItems} />)
    expect(screen.queryByLabelText('Add new task')).not.toBeInTheDocument()
  })

  it('shows chevron icon when expanded', () => {
    const expandedItems: TodoItem[] = [
      {
        id: '1',
        title: 'Expanded task',
        expanded: true,
      },
    ]
    render(<TodoList items={expandedItems} />)
    const collapseButton = screen.getByLabelText('Collapse Expanded task')
    expect(collapseButton).toBeInTheDocument()
  })

  it('renders assignee avatar', () => {
    render(<TodoList items={mockItems} />)
    const avatar = screen.getByText('KS')
    expect(avatar).toBeInTheDocument()
  })
})

