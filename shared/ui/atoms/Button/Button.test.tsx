import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Button } from './Button'

describe('Button', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Button>Click me</Button>)
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
    })

    it('renders as button by default', () => {
      render(<Button>Button</Button>)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Variants', () => {
    it('applies primary variant styles', () => {
      render(<Button variant="primary">Primary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-primary')
    })

    it('applies secondary variant styles', () => {
      render(<Button variant="secondary">Secondary</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-secondary')
    })

    it('applies outline variant styles', () => {
      render(<Button variant="outline">Outline</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-2', 'border-primary')
    })

    it('applies ghost variant styles', () => {
      render(<Button variant="ghost">Ghost</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-transparent')
    })
  })

  describe('Sizes', () => {
    it('applies small size styles', () => {
      render(<Button size="sm">Small</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-sm', 'py-xs', 'text-sm')
    })

    it('applies medium size styles by default', () => {
      render(<Button>Medium</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-md', 'py-sm', 'text-base')
    })

    it('applies large size styles', () => {
      render(<Button size="lg">Large</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('px-lg', 'py-md', 'text-lg')
    })
  })

  describe('Tones', () => {
    it('applies success tone', () => {
      render(<Button tone="success">Success</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-success')
    })

    it('applies warning tone', () => {
      render(<Button tone="warning">Warning</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-warning')
    })

    it('applies error tone', () => {
      render(<Button tone="error">Error</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-error')
    })
  })

  describe('States', () => {
    it('handles disabled state', () => {
      render(<Button disabled>Disabled</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-disabled', 'true')
    })

    it('handles loading state', () => {
      render(<Button loading>Loading</Button>)
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    it('renders loading spinner when loading', () => {
      render(<Button loading>Loading</Button>)
      const spinner = screen.getByRole('button').querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  describe('Polymorphic', () => {
    it('renders as anchor when as="a"', () => {
      render(
        <Button as="a" href="/link">
          Link Button
        </Button>
      )
      expect(screen.getByRole('link')).toBeInTheDocument()
      expect(screen.getByRole('link')).toHaveAttribute('href', '/link')
    })

    it('renders as custom element', () => {
      render(<Button as="div">Div Button</Button>)
      expect(screen.getByText('Div Button').tagName).toBe('DIV')
    })
  })

  describe('Full Width', () => {
    it('applies full width styles', () => {
      render(<Button fullWidth>Full Width</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('w-full')
    })
  })

  describe('Icon support', () => {
    const TestIcon = () => <svg data-testid="test-icon" width="16" height="16" />

    it('renders with left icon', () => {
      render(<Button icon={<TestIcon />}>With Icon</Button>)
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
      expect(screen.getByText('With Icon')).toBeInTheDocument()
    })

    it('renders with right icon', () => {
      render(<Button iconRight={<TestIcon />}>With Icon Right</Button>)
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
      expect(screen.getByText('With Icon Right')).toBeInTheDocument()
    })

    it('renders icon-only button', () => {
      render(<Button iconOnly icon={<TestIcon />} aria-label="Close" />)
      expect(screen.getByTestId('test-icon')).toBeInTheDocument()
      expect(screen.queryByText('Close')).not.toBeInTheDocument()
    })

    it('applies icon-only size styles', () => {
      render(<Button iconOnly icon={<TestIcon />} size="md" aria-label="Test" />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('h-10', 'w-10', 'p-0')
    })

    it('hides icon when loading', () => {
      render(<Button loading icon={<TestIcon />}>Loading</Button>)
      expect(screen.queryByTestId('test-icon')).not.toBeInTheDocument()
    })
  })

  describe('Custom className', () => {
    it('merges custom className with default styles', () => {
      render(<Button className="custom-class">Custom</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('custom-class')
      expect(button).toHaveClass('bg-primary') // Still has default styles
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA attributes when disabled', () => {
      render(<Button disabled>Disabled</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
    })

    it('has proper ARIA attributes when loading', () => {
      render(<Button loading>Loading</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
    })

    it('spinner has aria-hidden', () => {
      render(<Button loading>Loading</Button>)
      const spinner = screen.getByRole('button').querySelector('svg')
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })

    it('icon-only button requires aria-label', () => {
      const TestIcon = () => <svg data-testid="icon" />
      render(<Button iconOnly icon={<TestIcon />} aria-label="Close" />)
      expect(screen.getByLabelText('Close')).toBeInTheDocument()
    })
  })
})

