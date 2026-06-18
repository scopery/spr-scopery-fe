import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Link } from './Link'

describe('Link', () => {
  describe('Rendering', () => {
    it('renders children correctly', () => {
      render(<Link href="/test">Test Link</Link>)
      expect(screen.getByText('Test Link')).toBeInTheDocument()
    })

    it('renders as anchor by default', () => {
      render(<Link href="/test">Link</Link>)
      expect(screen.getByText('Link').tagName).toBe('A')
    })

    it('renders href attribute', () => {
      render(<Link href="/about">About</Link>)
      expect(screen.getByText('About')).toHaveAttribute('href', '/about')
    })
  })

  describe('Variants', () => {
    it('applies default variant', () => {
      render(
        <Link href="/test" variant="default">
          Default
        </Link>
      )
      expect(screen.getByText('Default')).toHaveClass('text-primary')
    })

    it('applies primary variant', () => {
      render(
        <Link href="/test" variant="primary">
          Primary
        </Link>
      )
      const link = screen.getByText('Primary')
      expect(link).toHaveClass('text-primary', 'font-medium')
    })

    it('applies muted variant', () => {
      render(
        <Link href="/test" variant="muted">
          Muted
        </Link>
      )
      expect(screen.getByText('Muted')).toHaveClass('text-neutral-600')
    })

    it('applies underline variant', () => {
      render(
        <Link href="/test" variant="underline">
          Underline
        </Link>
      )
      expect(screen.getByText('Underline')).toHaveClass('underline')
    })
  })

  describe('Sizes', () => {
    it('applies sm size', () => {
      render(
        <Link href="/test" size="sm">
          Small
        </Link>
      )
      expect(screen.getByText('Small')).toHaveClass('text-sm')
    })

    it('applies md size by default', () => {
      render(<Link href="/test">Medium</Link>)
      expect(screen.getByText('Medium')).toHaveClass('text-base')
    })

    it('applies lg size', () => {
      render(
        <Link href="/test" size="lg">
          Large
        </Link>
      )
      expect(screen.getByText('Large')).toHaveClass('text-lg')
    })
  })

  describe('External links', () => {
    it('adds target and rel for external links', () => {
      render(
        <Link href="https://example.com" external>
          External
        </Link>
      )
      const link = screen.getByText('External')
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    })

    it('renders external icon', () => {
      render(
        <Link href="https://example.com" external>
          External
        </Link>
      )
      const svg = screen.getByText('External').querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('does not add external props for internal links', () => {
      render(<Link href="/internal">Internal</Link>)
      const link = screen.getByText('Internal')
      expect(link).not.toHaveAttribute('target')
      expect(link).not.toHaveAttribute('rel')
    })
  })

  describe('Disabled state', () => {
    it('applies disabled styles', () => {
      render(
        <Link href="/test" disabled>
          Disabled
        </Link>
      )
      const link = screen.getByText('Disabled')
      expect(link).toHaveClass('opacity-50', 'pointer-events-none')
    })

    it('removes href when disabled', () => {
      render(
        <Link href="/test" disabled>
          Disabled
        </Link>
      )
      expect(screen.getByText('Disabled')).not.toHaveAttribute('href')
    })

    it('sets aria-disabled', () => {
      render(
        <Link href="/test" disabled>
          Disabled
        </Link>
      )
      expect(screen.getByText('Disabled')).toHaveAttribute('aria-disabled', 'true')
    })

    it('does not show external icon when disabled', () => {
      render(
        <Link href="https://example.com" external disabled>
          Disabled External
        </Link>
      )
      const svg = screen.getByText('Disabled External').querySelector('svg')
      expect(svg).not.toBeInTheDocument()
    })
  })

  describe('Polymorphic', () => {
    it('renders as custom element', () => {
      render(
        <Link as="button" onClick={() => {}}>
          Button Link
        </Link>
      )
      expect(screen.getByText('Button Link').tagName).toBe('BUTTON')
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(
        <Link href="/test" className="custom-class">
          Custom
        </Link>
      )
      const link = screen.getByText('Custom')
      expect(link).toHaveClass('custom-class')
      expect(link).toHaveClass('text-primary')
    })
  })

  describe('Accessibility', () => {
    it('has focus styles', () => {
      render(<Link href="/test">Focusable</Link>)
      expect(screen.getByText('Focusable')).toHaveClass('focus-visible:ring-2')
    })

    it('external icon has aria-hidden', () => {
      render(
        <Link href="https://example.com" external>
          External
        </Link>
      )
      const svg = screen.getByText('External').querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })
  })
})

