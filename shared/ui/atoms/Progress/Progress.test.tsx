import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progress } from './Progress'

describe('Progress', () => {
  describe('Rendering', () => {
    it('renders progress bar', () => {
      render(<Progress />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('has default value of 0', () => {
      render(<Progress />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    })
  })

  describe('Value', () => {
    it('applies custom value', () => {
      render(<Progress value={50} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
    })

    it('renders correct percentage width', () => {
      render(<Progress value={75} />)
      const bar = screen.getByRole('progressbar').querySelector('div')
      expect(bar).toHaveStyle({ width: '75%' })
    })

    it('clamps value to max', () => {
      render(<Progress value={150} max={100} />)
      const bar = screen.getByRole('progressbar').querySelector('div')
      expect(bar).toHaveStyle({ width: '100%' })
    })

    it('clamps negative values to 0', () => {
      render(<Progress value={-10} />)
      const bar = screen.getByRole('progressbar').querySelector('div')
      expect(bar).toHaveStyle({ width: '0%' })
    })
  })

  describe('Max value', () => {
    it('uses default max of 100', () => {
      render(<Progress value={50} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100')
    })

    it('applies custom max', () => {
      render(<Progress value={50} max={200} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '200')
    })

    it('calculates percentage with custom max', () => {
      render(<Progress value={50} max={200} />)
      const bar = screen.getByRole('progressbar').querySelector('div')
      expect(bar).toHaveStyle({ width: '25%' })
    })
  })

  describe('Sizes', () => {
    it('applies sm size', () => {
      render(<Progress size="sm" />)
      const container = screen.getByRole('progressbar')
      expect(container).toHaveClass('h-1')
    })

    it('applies md size by default', () => {
      render(<Progress />)
      const container = screen.getByRole('progressbar')
      expect(container).toHaveClass('h-2')
    })

    it('applies lg size', () => {
      render(<Progress size="lg" />)
      const container = screen.getByRole('progressbar')
      expect(container).toHaveClass('h-3')
    })
  })

  describe('Tones', () => {
    it('applies primary tone by default', () => {
      render(<Progress value={50} />)
      const bar = screen.getByRole('progressbar').querySelector('div')
      expect(bar).toHaveClass('bg-primary')
    })

    it('applies success tone', () => {
      render(<Progress value={50} tone="success" />)
      const bar = screen.getByRole('progressbar').querySelector('div')
      expect(bar).toHaveClass('bg-success')
    })

    it('applies error tone', () => {
      render(<Progress value={50} tone="error" />)
      const bar = screen.getByRole('progressbar').querySelector('div')
      expect(bar).toHaveClass('bg-error')
    })

    it('applies warning tone', () => {
      render(<Progress value={50} tone="warning" />)
      const bar = screen.getByRole('progressbar').querySelector('div')
      expect(bar).toHaveClass('bg-warning')
    })
  })

  describe('Show value', () => {
    it('does not show value by default', () => {
      render(<Progress value={50} />)
      expect(screen.queryByText('50%')).not.toBeInTheDocument()
    })

    it('shows value when enabled', () => {
      render(<Progress value={50} showValue />)
      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('shows label text', () => {
      render(<Progress value={50} showValue />)
      expect(screen.getByText('Progress')).toBeInTheDocument()
    })
  })

  describe('Indeterminate', () => {
    it('renders indeterminate state', () => {
      render(<Progress indeterminate />)
      const bar = screen.getByRole('progressbar').querySelector('div')
      expect(bar).toHaveStyle({ width: '100%' })
    })

    it('has animate-pulse in indeterminate state', () => {
      render(<Progress indeterminate />)
      const bar = screen.getByRole('progressbar').querySelector('div')
      expect(bar).toHaveClass('animate-pulse')
    })

    it('does not have aria-valuenow in indeterminate state', () => {
      render(<Progress indeterminate />)
      expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow')
    })

    it('does not show value in indeterminate state', () => {
      render(<Progress indeterminate showValue />)
      expect(screen.queryByText('%')).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has role progressbar', () => {
      render(<Progress value={50} />)
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('has aria-valuenow', () => {
      render(<Progress value={75} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75')
    })

    it('has aria-valuemin', () => {
      render(<Progress value={50} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0')
    })

    it('has aria-valuemax', () => {
      render(<Progress value={50} max={100} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100')
    })

    it('has aria-label', () => {
      render(<Progress value={50} />)
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', '50%')
    })
  })

  describe('Custom className', () => {
    it('merges custom className', () => {
      render(<Progress value={50} className="custom-class" />)
      const container = screen.getByRole('progressbar').parentElement
      expect(container).toHaveClass('custom-class')
    })
  })
})

