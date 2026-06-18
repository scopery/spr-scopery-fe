import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  describe('Rendering', () => {
    it('renders spinner', () => {
      render(<Spinner />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('renders with default label', () => {
      render(<Spinner />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('renders with custom label', () => {
      render(<Spinner label="Processing..." />)
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    it('has aria-label', () => {
      render(<Spinner label="Custom loading" />)
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Custom loading')
    })
  })

  describe('Sizes', () => {
    it('applies xs size', () => {
      render(<Spinner size="xs" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('h-3', 'w-3')
    })

    it('applies sm size', () => {
      render(<Spinner size="sm" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('h-4', 'w-4')
    })

    it('applies md size by default', () => {
      render(<Spinner />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('h-6', 'w-6')
    })

    it('applies lg size', () => {
      render(<Spinner size="lg" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('h-8', 'w-8')
    })

    it('applies xl size', () => {
      render(<Spinner size="xl" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('h-12', 'w-12')
    })
  })

  describe('Tones', () => {
    it('applies primary tone by default', () => {
      render(<Spinner />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('border-primary')
    })

    it('applies default tone', () => {
      render(<Spinner tone="default" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('border-neutral-900')
    })

    it('applies success tone', () => {
      render(<Spinner tone="success" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('border-success')
    })

    it('applies error tone', () => {
      render(<Spinner tone="error" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('border-error')
    })

    it('applies warning tone', () => {
      render(<Spinner tone="warning" />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('border-warning')
    })
  })

  describe('Animation', () => {
    it('has animate-spin class', () => {
      render(<Spinner />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('animate-spin')
    })

    it('has rounded-full class', () => {
      render(<Spinner />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveClass('rounded-full')
    })
  })

  describe('Accessibility', () => {
    it('has role status', () => {
      render(<Spinner />)
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('has screen reader text', () => {
      render(<Spinner label="Loading data" />)
      const srText = screen.getByText('Loading data')
      expect(srText).toHaveClass('sr-only')
    })

    it('spinner div has aria-hidden', () => {
      render(<Spinner />)
      const spinner = screen.getByRole('status').querySelector('div')
      expect(spinner).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(<Spinner className="custom-class" />)
      expect(screen.getByRole('status')).toHaveClass('custom-class')
    })
  })
})

