import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AISuggestion } from './AISuggestion'

describe('AISuggestion', () => {
  it('renders with default title', () => {
    render(
      <AISuggestion question="Would you like to set this task to High Priority?" />
    )
    expect(screen.getByText('AI suggestions')).toBeInTheDocument()
  })

  it('renders custom title', () => {
    render(
      <AISuggestion
        title="Custom Title"
        question="Test question?"
      />
    )
    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })

  it('renders question', () => {
    render(
      <AISuggestion question="Would you like to set this task to High Priority?" />
    )
    expect(screen.getByText('Would you like to set this task to High Priority?')).toBeInTheDocument()
  })

  it('renders Yes and No options', () => {
    render(
      <AISuggestion
        question="Test question?"
        onYes={() => {}}
        onNo={() => {}}
      />
    )
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  it('renders custom labels', () => {
    render(
      <AISuggestion
        question="Test question?"
        yesLabel="Accept"
        noLabel="Decline"
        onYes={() => {}}
        onNo={() => {}}
      />
    )
    expect(screen.getByText('Accept')).toBeInTheDocument()
    expect(screen.getByText('Decline')).toBeInTheDocument()
  })

  it('calls onYes when Yes is clicked', async () => {
    const user = userEvent.setup()
    const onYes = vi.fn()
    render(
      <AISuggestion
        question="Test question?"
        onYes={onYes}
        onNo={() => {}}
      />
    )
    
    const yesButton = screen.getByText('Yes')
    await user.click(yesButton)
    
    expect(onYes).toHaveBeenCalledTimes(1)
  })

  it('calls onNo when No is clicked', async () => {
    const user = userEvent.setup()
    const onNo = vi.fn()
    render(
      <AISuggestion
        question="Test question?"
        onYes={() => {}}
        onNo={onNo}
      />
    )
    
    const noButton = screen.getByText('No')
    await user.click(noButton)
    
    expect(onNo).toHaveBeenCalledTimes(1)
  })

  it('renders icon when showIcon is true', () => {
    const { container } = render(
      <AISuggestion
        question="Test question?"
        showIcon={true}
      />
    )
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBeGreaterThan(0)
  })

  it('does not render icon when showIcon is false', () => {
    const { container } = render(
      <AISuggestion
        question="Test question?"
        showIcon={false}
      />
    )
    const icons = container.querySelectorAll('svg')
    expect(icons.length).toBe(0)
  })

  it('renders only Yes option when onNo is not provided', () => {
    render(
      <AISuggestion
        question="Test question?"
        onYes={() => {}}
      />
    )
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.queryByText('No')).not.toBeInTheDocument()
    expect(screen.queryByText('/')).not.toBeInTheDocument()
  })

  it('renders only No option when onYes is not provided', () => {
    render(
      <AISuggestion
        question="Test question?"
        onNo={() => {}}
      />
    )
    expect(screen.getByText('No')).toBeInTheDocument()
    expect(screen.queryByText('Yes')).not.toBeInTheDocument()
    expect(screen.queryByText('/')).not.toBeInTheDocument()
  })
})

