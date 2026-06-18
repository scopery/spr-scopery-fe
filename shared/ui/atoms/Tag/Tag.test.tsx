import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tag } from './Tag'

describe('Tag', () => {
  describe('Rendering', () => {
    it('renders children', () => {
      render(<Tag>React</Tag>)
      expect(screen.getByText('React')).toBeInTheDocument()
    })

    it('renders as span by default', () => {
      render(<Tag>Tag</Tag>)
      expect(screen.getByText('Tag').tagName).toBe('SPAN')
    })
  })

  describe('Variants', () => {
    it('applies soft variant by default', () => {
      render(<Tag>Soft</Tag>)
      expect(screen.getByText('Soft')).toHaveClass('bg-neutral-100')
    })

    it('applies solid variant', () => {
      render(<Tag variant="solid">Solid</Tag>)
      expect(screen.getByText('Solid')).toHaveClass('bg-neutral-900', 'text-white')
    })

    it('applies outline variant', () => {
      render(<Tag variant="outline">Outline</Tag>)
      const tag = screen.getByText('Outline')
      expect(tag).toHaveClass('border-2', 'bg-transparent')
    })
  })

  describe('Sizes', () => {
    it('applies sm size', () => {
      render(<Tag size="sm">Small</Tag>)
      expect(screen.getByText('Small')).toHaveClass('px-sm', 'py-xs', 'text-xs')
    })

    it('applies md size by default', () => {
      render(<Tag>Medium</Tag>)
      expect(screen.getByText('Medium')).toHaveClass('px-md', 'py-xs', 'text-sm')
    })

    it('applies lg size', () => {
      render(<Tag size="lg">Large</Tag>)
      expect(screen.getByText('Large')).toHaveClass('px-md', 'py-sm', 'text-base')
    })
  })

  describe('Tones', () => {
    it('applies default tone', () => {
      render(<Tag tone="default">Default</Tag>)
      expect(screen.getByText('Default')).toHaveClass('bg-neutral-100')
    })

    it('applies primary tone', () => {
      render(<Tag tone="primary">Primary</Tag>)
      expect(screen.getByText('Primary')).toHaveClass('text-primary')
    })

    it('applies success tone', () => {
      render(<Tag tone="success">Success</Tag>)
      expect(screen.getByText('Success')).toHaveClass('text-success')
    })
  })

  describe('Removable', () => {
    it('does not show remove button by default', () => {
      render(<Tag>Tag</Tag>)
      expect(screen.queryByLabelText('Remove')).not.toBeInTheDocument()
    })

    it('shows remove button when removable', () => {
      render(<Tag removable>Tag</Tag>)
      expect(screen.getByLabelText('Remove')).toBeInTheDocument()
    })

    it('calls onRemove when remove button is clicked', async () => {
      const user = userEvent.setup()
      const handleRemove = vi.fn()
      render(
        <Tag removable onRemove={handleRemove}>
          Tag
        </Tag>
      )

      await user.click(screen.getByLabelText('Remove'))
      expect(handleRemove).toHaveBeenCalledTimes(1)
    })

    it('remove button has aria-label', () => {
      render(<Tag removable>Tag</Tag>)
      expect(screen.getByLabelText('Remove')).toBeInTheDocument()
    })

    it('remove icon has aria-hidden', () => {
      render(<Tag removable>Tag</Tag>)
      const svg = screen.getByLabelText('Remove').querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Polymorphic', () => {
    it('renders as custom element', () => {
      render(<Tag as="div">Div Tag</Tag>)
      expect(screen.getByText('Div Tag').tagName).toBe('DIV')
    })

    it('renders as button', () => {
      render(
        <Tag as="button" onClick={() => {}}>
          Button Tag
        </Tag>
      )
      expect(screen.getByText('Button Tag').tagName).toBe('BUTTON')
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(<Tag className="custom-class">Custom</Tag>)
      const tag = screen.getByText('Custom')
      expect(tag).toHaveClass('custom-class')
      expect(tag).toHaveClass('bg-neutral-100')
    })
  })
})

