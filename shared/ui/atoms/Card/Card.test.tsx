import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('renders the shared card surface with a small shadow by default', () => {
    render(<Card className="rounded-lg">Content</Card>)

    const card = screen.getByText('Content')
    expect(card).toHaveClass('border', 'border-neutral-200', 'bg-surface-card')
    expect(card).toHaveClass('shadow-sm')
    expect(card).toHaveClass('rounded-none')
    expect(card).not.toHaveClass('rounded-lg')
  })

  it('can disable elevation and supports polymorphism', () => {
    render(
      <Card as="section" hasShadow={false} aria-label="Summary">
        Content
      </Card>
    )

    expect(screen.getByRole('region', { name: 'Summary' })).not.toHaveClass('shadow-sm')
  })
})
