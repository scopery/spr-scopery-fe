import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Badge>Test Badge</Badge>)
      expect(screen.getByText('Test Badge')).toBeInTheDocument()
    })

    it('renders as span by default', () => {
      render(<Badge>Badge</Badge>)
      expect(screen.getByText('Badge').tagName).toBe('SPAN')
    })
  })

  describe('Variants', () => {
    it('applies solid variant by default', () => {
      render(<Badge>Solid</Badge>)
      expect(screen.getByText('Solid')).toHaveClass('bg-neutral-900', 'text-white')
    })

    it('applies outline variant', () => {
      render(<Badge variant="outline">Outline</Badge>)
      const badge = screen.getByText('Outline')
      expect(badge).toHaveClass('border-2', 'border-neutral-900', 'bg-transparent')
    })

    it('applies soft variant', () => {
      render(<Badge variant="soft">Soft</Badge>)
      expect(screen.getByText('Soft')).toHaveClass('bg-neutral-100', 'text-neutral-900')
    })
  })

  describe('Sizes', () => {
    it('applies sm size', () => {
      render(<Badge size="sm">Small</Badge>)
      expect(screen.getByText('Small')).toHaveClass('px-sm', 'py-xs', 'text-xs')
    })

    it('applies md size by default', () => {
      render(<Badge>Medium</Badge>)
      expect(screen.getByText('Medium')).toHaveClass('px-md', 'py-xs', 'text-sm')
    })

    it('applies lg size', () => {
      render(<Badge size="lg">Large</Badge>)
      expect(screen.getByText('Large')).toHaveClass('px-md', 'py-sm', 'text-base')
    })
  })

  describe('Tones', () => {
    it('applies default tone', () => {
      render(<Badge tone="default">Default</Badge>)
      expect(screen.getByText('Default')).toHaveClass('bg-neutral-900')
    })

    it('applies primary tone', () => {
      render(<Badge tone="primary">Primary</Badge>)
      expect(screen.getByText('Primary')).toHaveClass('bg-primary')
    })

    it('applies success tone', () => {
      render(<Badge tone="success">Success</Badge>)
      expect(screen.getByText('Success')).toHaveClass('bg-success')
    })

    it('applies warning tone', () => {
      render(<Badge tone="warning">Warning</Badge>)
      expect(screen.getByText('Warning')).toHaveClass('bg-warning')
    })

    it('applies error tone', () => {
      render(<Badge tone="error">Error</Badge>)
      expect(screen.getByText('Error')).toHaveClass('bg-error')
    })

    it('applies info tone', () => {
      render(<Badge tone="info">Info</Badge>)
      expect(screen.getByText('Info')).toHaveClass('bg-info')
    })
  })

  describe('Tone with variants', () => {
    it('applies tone with outline variant', () => {
      render(
        <Badge variant="outline" tone="primary">
          Outline Primary
        </Badge>
      )
      const badge = screen.getByText('Outline Primary')
      expect(badge).toHaveClass('border-primary', 'text-primary')
    })

    it('applies tone with soft variant', () => {
      render(
        <Badge variant="soft" tone="success">
          Soft Success
        </Badge>
      )
      const badge = screen.getByText('Soft Success')
      expect(badge).toHaveClass('bg-success/10', 'text-success')
    })
  })

  describe('Dot indicator', () => {
    it('renders without dot by default', () => {
      render(<Badge>No Dot</Badge>)
      const badge = screen.getByText('No Dot')
      expect(badge.querySelector('span')).not.toBeInTheDocument()
    })

    it('renders with dot when dot prop is true', () => {
      render(<Badge dot>With Dot</Badge>)
      const badge = screen.getByText('With Dot')
      const dot = badge.querySelector('span')
      expect(dot).toBeInTheDocument()
      expect(dot).toHaveClass('rounded-full')
    })

    it('dot has aria-hidden', () => {
      render(<Badge dot>Dot Badge</Badge>)
      const dot = screen.getByText('Dot Badge').querySelector('span')
      expect(dot).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Polymorphic', () => {
    it('renders as custom element', () => {
      render(<Badge as="div">Div Badge</Badge>)
      expect(screen.getByText('Div Badge').tagName).toBe('DIV')
    })

    it('renders as button', () => {
      render(
        <Badge as="button" onClick={() => {}}>
          Button Badge
        </Badge>
      )
      expect(screen.getByText('Button Badge').tagName).toBe('BUTTON')
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(<Badge className="custom-class">Custom</Badge>)
      const badge = screen.getByText('Custom')
      expect(badge).toHaveClass('custom-class')
      expect(badge).toHaveClass('bg-neutral-900')
    })
  })
})

